import React, { useState, useEffect } from 'react'
import api from '../api'

export default function PartsDetail({ partId, onBack }) {
  const [part, setPart] = useState(null)
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [blueprints, setBlueprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPartData()
  }, [partId])

  const loadPartData = async () => {
    try {
      const [partRes, jobsRes, customersRes, bpsRes] = await Promise.all([
        api.getPart(partId),
        api.listJobs(),
        api.listCustomers(),
        api.listBlueprints(partId)
      ])
      setPart(partRes)
      setJobs(jobsRes)
      setCustomers(customersRes)
      setBlueprints(bpsRes)
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
      setMessage(`${uploadFiles.length} blueprint(s) uploaded successfully.`)
    } catch (err) {
      setMessage('Upload error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!part) return <div>Part not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Parts</button>

      <h2>{part.name}</h2>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Part Information</h3>
        <p><strong>Input Date:</strong> {part.created_at ? new Date(part.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Updated:</strong> {part.updated_at ? new Date(part.updated_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Job:</strong> {getJobName(part.job_id)}</p>
        <p><strong>Customer:</strong> {getCustomerForJob(part.job_id)}</p>
        <p><strong>Material Type:</strong> {part.material_type || 'N/A'}</p>
        <p><strong>Material Size:</strong> {part.material_size || 'N/A'}</p>
        <p><strong>Status:</strong> <span style={{ padding: '5px 10px', backgroundColor: part.status === 'completed' ? '#90EE90' : part.status === 'in-progress' ? '#FFD700' : '#FFB6C6', borderRadius: '3px' }}>{part.status}</span></p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Blueprints ({blueprints.length})</h3>

        {message && <p style={{ padding: '8px', backgroundColor: '#ffffcc', border: '1px solid #cccc00', borderRadius: '3px', marginBottom: '12px' }}>{message}</p>}

        {blueprints.length === 0 ? (
          <p style={{ color: '#888' }}>No blueprints uploaded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Filename</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Uploaded</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blueprints.map(bp => (
                <tr key={bp.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bp.filename}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bp.uploaded_at ? new Date(bp.uploaded_at).toLocaleString() : 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDownload(bp)}
                      style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}
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


  useEffect(() => {
    loadPartData()
  }, [partId])

  const loadPartData = async () => {
    try {
      const [partRes, jobsRes, customersRes] = await Promise.all([
        api.getPart(partId),
        api.listJobs(),
        api.listCustomers()
      ])
      setPart(partRes)
      setJobs(jobsRes)
      setCustomers(customersRes)
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

  const handleDownload = async () => {
    try {
      const url = await api.downloadBlueprint(part.id)
      const a = document.createElement('a')
      a.href = url
      a.download = `blueprint_part_${part.id}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading blueprint: ' + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!part) return <div>Part not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Parts</button>
      
      <h2>{part.name}</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Part Information</h3>
        <p><strong>Input Date:</strong> {part.created_at ? new Date(part.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Updated:</strong> {part.updated_at ? new Date(part.updated_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Job:</strong> {getJobName(part.job_id)}</p>
        <p><strong>Customer:</strong> {getCustomerForJob(part.job_id)}</p>
        <p><strong>Material Type:</strong> {part.material_type || 'N/A'}</p>
        <p><strong>Material Size:</strong> {part.material_size || 'N/A'}</p>
        <p><strong>Status:</strong> <span style={{ padding: '5px 10px', backgroundColor: part.status === 'completed' ? '#90EE90' : part.status === 'in-progress' ? '#FFD700' : '#FFB6C6', borderRadius: '3px' }}>{part.status}</span></p>
        
        {part.blueprint_path && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Blueprint:</strong></p>
            <button
              onClick={handleDownload}
              style={{ padding: '6px 14px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              Download Blueprint
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Additional Details</h3>
        <p><strong>Material ID:</strong> {part.material_id || 'None'}</p>
      </div>
    </div>
  )
}
