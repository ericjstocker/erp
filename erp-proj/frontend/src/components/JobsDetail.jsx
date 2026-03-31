import React, { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

export default function JobsDetail({ jobId, onBack, onSelectPart }) {
  const { accentColor, currentTheme } = useTheme()
  const thStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }
  const tdStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }
  const inputStyle = { padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }
  const [job, setJob] = useState(null)
  const [parts, setParts] = useState([])
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editingJob, setEditingJob] = useState(false)
  const [editedJob, setEditedJob] = useState(null)
  const [editingPartId, setEditingPartId] = useState(null)
  const [editedPart, setEditedPart] = useState(null)

  useEffect(() => {
    loadJobData()
  }, [jobId])

  const loadJobData = async () => {
    try {
      const [jobRes, partsRes, customersRes, docsRes, materialsRes] = await Promise.all([
        api.getJob(jobId),
        api.getJobParts(jobId),
        api.listCustomers(),
        api.listJobDocuments(jobId),
        api.listMaterials()
      ])
      setJob(jobRes)
      setParts(partsRes)
      setCustomers(customersRes)
      setDocuments(docsRes || [])
      setMaterials(materialsRes || [])
    } catch (err) {
      console.error('Error loading job data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerName = (customerId) => {
    const c = customers.find(c => c.id === customerId)
    return c ? c.name : 'N/A'
  }

  const getMaterialName = (matId) => { const m = materials.find(m => m.id === matId); return m ? m.name : 'N/A' }
  const getMaterialShape = (matId) => { const m = materials.find(m => m.id === matId); return m ? (m.shape || 'N/A') : 'N/A' }

  const saveJobEdit = async () => {
    try {
      await api.updateJob(jobId, {
        name: editedJob.name,
        description: editedJob.description || null,
        customer_id: editedJob.customer_id || null,
        due_date: editedJob.due_date || null,
        received_date: editedJob.received_date || null,
        status: editedJob.status,
      })
      setEditingJob(false)
      setEditedJob(null)
      loadJobData()
    } catch (err) {
      alert(`Error updating job: ${err}`)
    }
  }

  const savePartEdit = async () => {
    try {
      await api.updatePart(editingPartId, {
        name: editedPart.name,
        job_id: editedPart.job_id,
        material_id: editedPart.material_id || null,
        quantity: editedPart.quantity !== '' ? parseInt(editedPart.quantity) : null,
        status: editedPart.status,
      })
      setEditingPartId(null)
      setEditedPart(null)
      loadJobData()
    } catch (err) {
      alert(`Error updating part: ${err}`)
    }
  }

  const handleDownload = async (doc) => {
    try {
      const { url, filename } = await api.downloadJobDocument(doc.id, doc.filename)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      alert(`Download failed: ${err}`)
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.deleteJobDocument(docId)
      setDocuments(documents.filter(d => d.id !== docId))
    } catch (err) {
      alert(`Delete failed: ${err}`)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    setUploading(true)
    setUploadError('')
    const filesToUpload = [...uploadFiles]
    setUploadFiles([])
    let errors = 0
    for (const file of filesToUpload) {
      try { await api.uploadJobDocument(jobId, file) } catch (err) { errors++; console.error(err) }
    }
    setUploading(false)
    if (errors > 0) setUploadError(`${errors} file(s) failed to upload`)
    const docsRes = await api.listJobDocuments(jobId)
    setDocuments(docsRes || [])
  }

  if (loading) return <div>Loading...</div>
  if (!job) return <div>Job not found</div>

  return (
    <div style={{ padding: '20px', backgroundColor: currentTheme.bg, color: currentTheme.text, minHeight: '100%' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>← Back to Jobs</button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <h2 style={{ margin: 0 }}>{job.name}</h2>
        {!editingJob && (
          <button
            onClick={() => { setEditingJob(true); setEditedJob({ ...job }) }}
            style={{ padding: '6px 14px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
          >Edit Job</button>
        )}
      </div>

      {editingJob ? (
        <div style={{ padding: '15px', border: '2px solid #ff9900', borderRadius: '5px', backgroundColor: currentTheme.hover, marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Edit Job</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Job Name: </label>
            <input value={editedJob.name} onChange={(e) => setEditedJob({ ...editedJob, name: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Description: </label>
            <textarea value={editedJob.description || ''} onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })} style={{ ...inputStyle, width: '100%', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Customer: </label>
            <select value={editedJob.customer_id || ''} onChange={(e) => setEditedJob({ ...editedJob, customer_id: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle}>
              <option value="">No Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Due Date: </label>
            <input type="date" value={editedJob.due_date || ''} onChange={(e) => setEditedJob({ ...editedJob, due_date: e.target.value || null })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Received Date: </label>
            <input type="date" value={editedJob.received_date || ''} onChange={(e) => setEditedJob({ ...editedJob, received_date: e.target.value || null })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label>Status: </label>
            <select value={editedJob.status || ''} onChange={(e) => setEditedJob({ ...editedJob, status: e.target.value })} style={inputStyle}>
              <option value="queued">Queued</option>
              <option value="in-progress">In Progress</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveJobEdit} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
            <button onClick={() => { setEditingJob(false); setEditedJob(null) }} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p><strong>Description:</strong> {job.description || 'N/A'}</p>
          <p><strong>Customer:</strong> {getCustomerName(job.customer_id)}</p>
          <p><strong>Due Date:</strong> {job.due_date || 'N/A'}</p>
          <p><strong>Received Date:</strong> {job.received_date || 'N/A'}</p>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Created:</strong> {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</p>
        </>
      )}

      <h3>Associated Parts ({parts.length})</h3>
      {parts.length === 0 ? (
        <p>No parts found for this job</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Part Name</th>
              <th style={thStyle}>Material Name</th>
              <th style={thStyle}>Material Shape</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              editingPartId === part.id ? (
                <tr key={part.id}>
                  <td style={tdStyle}>
                    <input value={editedPart.name} onChange={(e) => setEditedPart({ ...editedPart, name: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                  </td>
                  <td style={tdStyle}>
                    <select value={editedPart.material_id || ''} onChange={(e) => setEditedPart({ ...editedPart, material_id: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle}>
                      <option value="">No Material</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>{getMaterialShape(editedPart.material_id)}</td>
                  <td style={tdStyle}>
                    <input type="number" min="1" value={editedPart.quantity ?? ''} onChange={(e) => setEditedPart({ ...editedPart, quantity: e.target.value })} style={{ ...inputStyle, width: '80px' }} />
                  </td>
                  <td style={tdStyle}>
                    <select value={editedPart.status || ''} onChange={(e) => setEditedPart({ ...editedPart, status: e.target.value })} style={inputStyle}>
                      <option value="queued">Queued</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td style={tdStyle}>{new Date(part.created_at).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={savePartEdit} style={{ padding: '4px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '4px' }}>Save</button>
                    <button onClick={() => { setEditingPartId(null); setEditedPart(null) }} style={{ padding: '4px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={part.id}>
                  <td style={tdStyle}>
                    <span
                      onClick={() => onSelectPart && onSelectPart(part.id)}
                      style={{ color: accentColor, cursor: onSelectPart ? 'pointer' : 'default', textDecoration: onSelectPart ? 'underline' : 'none' }}
                    >{part.name}</span>
                  </td>
                  <td style={tdStyle}>{getMaterialName(part.material_id)}</td>
                  <td style={tdStyle}>{getMaterialShape(part.material_id)}</td>
                  <td style={tdStyle}>{part.quantity != null ? part.quantity : 'N/A'}</td>
                  <td style={tdStyle}>{part.status}</td>
                  <td style={tdStyle}>{new Date(part.created_at).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => { setEditingPartId(part.id); setEditedPart({ ...part, quantity: part.quantity ?? '' }) }}
                      style={{ padding: '4px 10px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >Edit</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '30px' }}>PO Documents ({documents.length})</h3>
      {documents.length === 0 ? (
        <p style={{ color: currentTheme.text }}>No documents uploaded for this job</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Filename</th>
              <th style={thStyle}>Uploaded</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td style={tdStyle}>{doc.filename}</td>
                <td style={tdStyle}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => handleDownload(doc)}
                    style={{ padding: '4px 10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}
                  >Download</button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ padding: '15px', border: '1px solid ' + currentTheme.border, borderRadius: '5px', display: 'inline-block', backgroundColor: currentTheme.hover }}>
        <strong>Upload Document(s):</strong>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            multiple
            onChange={(e) => setUploadFiles(Array.from(e.target.files))}
          />
          <button
            onClick={handleUpload}
            disabled={uploading || uploadFiles.length === 0}
            style={{ padding: '6px 14px', backgroundColor: uploading || uploadFiles.length === 0 ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: uploading || uploadFiles.length === 0 ? 'default' : 'pointer' }}
          >{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>
        {uploadError && <p style={{ color: 'red', marginTop: '6px' }}>{uploadError}</p>}
      </div>
    </div>
  )
}
