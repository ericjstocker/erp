import React, { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

const STATUS_COLORS = { running: '#28a745', hold: '#dc3545', ready: '#ffc107', 'needs-work': '#fd7e14', complete: '#0066cc' }
const STATUS_LABELS = { running: 'Running', hold: 'Hold', ready: 'Ready/Next', 'needs-work': 'Needs Work', complete: 'Complete' }
const statusBadgeStyle = (s) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', backgroundColor: STATUS_COLORS[s] || '#aaa', color: '#000', fontWeight: 'bold', fontSize: '12px' })
const statusLabel = (s) => STATUS_LABELS[s] || s || 'N/A'

export default function PartsDetail({ partId, onBack }) {
  const { accentColor, currentTheme } = useTheme()
  const thStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }
  const tdStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }
  const inputStyle = { padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }
  const [part, setPart] = useState(null)
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [blueprints, setBlueprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingPart, setEditingPart] = useState(false)
  const [editedPart, setEditedPart] = useState(null)

  useEffect(() => {
    loadPartData()
  }, [partId])

  const loadPartData = async () => {
    try {
      const [partRes, jobsRes, customersRes, bpsRes, materialsRes] = await Promise.all([
        api.getPart(partId),
        api.listJobs(),
        api.listCustomers(),
        api.listBlueprints(partId),
        api.listMaterials()
      ])
      setPart(partRes)
      setJobs(jobsRes)
      setCustomers(customersRes)
      setBlueprints(bpsRes)
      setMaterials(materialsRes || [])
    } catch (err) {
      console.error('Error loading part data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getJobName = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    return job ? job.name : 'N/A'
  }

  const getCustomerForJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job || !job.customer_id) return 'N/A'
    const customer = customers.find(c => c.id === job.customer_id)
    return customer ? customer.name : 'N/A'
  }

  const savePartEdit = async () => {
    try {
      await api.updatePart(partId, {
        name: editedPart.name,
        job_id: editedPart.job_id || null,
        material_id: editedPart.material_id || null,
        material_type: editedPart.material_type || null,
        material_size: editedPart.material_size || null,
        quantity: editedPart.quantity !== '' && editedPart.quantity != null ? parseInt(editedPart.quantity) : null,
        status: editedPart.status,
      })
      setEditingPart(false)
      setEditedPart(null)
      loadPartData()
    } catch (err) {
      alert('Error updating part: ' + err)
    }
  }

  const handleDownload = async (bp) => {
    try {
      const { url, filename } = await api.downloadBlueprint(bp.id, bp.filename)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading blueprint: ' + err.message)
    }
  }

  const handleDelete = async (bp) => {
    if (!window.confirm(`Delete blueprint "${bp.filename}"?`)) return
    try {
      await api.deleteBlueprint(bp.id)
      setBlueprints(prev => prev.filter(b => b.id !== bp.id))
      setMessage(`"${bp.filename}" deleted.`)
    } catch (err) {
      setMessage('Error deleting: ' + err.message)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    const count = uploadFiles.length
    setUploading(true)
    setMessage('')
    try {
      for (const file of uploadFiles) {
        await api.uploadBlueprint(partId, file)
      }
      setUploadFiles([])
      // reload blueprints list
      const bpsRes = await api.listBlueprints(partId)
      setBlueprints(bpsRes)
      setMessage(`${count} blueprint(s) uploaded successfully.`)
    } catch (err) {
      setMessage('Upload error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!part) return <div>Part not found</div>

  return (
    <div style={{ padding: '20px', backgroundColor: currentTheme.bg, color: currentTheme.text, minHeight: '100%' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>← Back to Parts</button>

      <h2>{part.name}</h2>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid ' + currentTheme.border, borderRadius: '5px', backgroundColor: currentTheme.hover }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>Part Information</h3>
          {!editingPart && (
            <button
              onClick={() => { setEditingPart(true); setEditedPart({ ...part, quantity: part.quantity ?? '' }) }}
              style={{ padding: '6px 14px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >Edit</button>
          )}
        </div>

        {editingPart ? (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <label>Part Name: </label>
              <input value={editedPart.name} onChange={(e) => setEditedPart({ ...editedPart, name: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Job: </label>
              <select value={editedPart.job_id || ''} onChange={(e) => setEditedPart({ ...editedPart, job_id: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle}>
                <option value="">No Job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Material: </label>
              <select value={editedPart.material_id || ''} onChange={(e) => setEditedPart({ ...editedPart, material_id: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle}>
                <option value="">No Material</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Material Type: </label>
              <input value={editedPart.material_type || ''} onChange={(e) => setEditedPart({ ...editedPart, material_type: e.target.value })} style={inputStyle} placeholder="e.g. Steel" />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Material Size: </label>
              <input value={editedPart.material_size || ''} onChange={(e) => setEditedPart({ ...editedPart, material_size: e.target.value })} style={inputStyle} placeholder="e.g. 2x4" />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Quantity: </label>
              <input type="number" min="1" value={editedPart.quantity} onChange={(e) => setEditedPart({ ...editedPart, quantity: e.target.value })} style={{ ...inputStyle, width: '80px' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label>Status: </label>
              <select value={editedPart.status || ''} onChange={(e) => setEditedPart({ ...editedPart, status: e.target.value })} style={inputStyle}>
                <option value="running">Running</option>
                <option value="hold">Hold</option>
                <option value="ready">Ready/Next</option>
                <option value="needs-work">Needs Work</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={savePartEdit} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditingPart(false); setEditedPart(null) }} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p><strong>Input Date:</strong> {part.created_at ? new Date(part.created_at).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Updated:</strong> {part.updated_at ? new Date(part.updated_at).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Job:</strong> {getJobName(part.job_id)}</p>
            <p><strong>Customer:</strong> {getCustomerForJob(part.job_id)}</p>
            <p><strong>Material Type:</strong> {part.material_type || 'N/A'}</p>
            <p><strong>Material Size:</strong> {part.material_size || 'N/A'}</p>
            <p><strong>Quantity:</strong> {part.quantity != null ? part.quantity : 'N/A'}</p>
            <p><strong>Status:</strong> <span style={statusBadgeStyle(part.status)}>{statusLabel(part.status)}</span></p>
          </>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid ' + currentTheme.border, borderRadius: '5px', backgroundColor: currentTheme.hover }}>
        <h3>Blueprints ({blueprints.length})</h3>

        {message && <p style={{ padding: '8px', backgroundColor: currentTheme.hover, border: '1px solid ' + currentTheme.border, borderRadius: '3px', marginBottom: '12px', color: currentTheme.text }}>{message}</p>}

        {blueprints.length === 0 ? (
          <p style={{ color: currentTheme.text }}>No blueprints uploaded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Filename</th>
                <th style={thStyle}>Uploaded</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blueprints.map(bp => (
                <tr key={bp.id}>
                  <td style={tdStyle}>{bp.filename}</td>
                  <td style={tdStyle}>{bp.uploaded_at ? new Date(bp.uploaded_at).toLocaleString() : 'N/A'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => handleDownload(bp)}
                      style={{ padding: '5px 10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(bp)}
                      style={{ padding: '5px 10px', backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="file"
            multiple
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx"
            onChange={(e) => setUploadFiles(Array.from(e.target.files))}
          />
          {uploadFiles.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{ padding: '6px 14px', backgroundColor: '#00aa00', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
