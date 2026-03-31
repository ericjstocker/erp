import React, { useState, useEffect } from 'react'
import api from '../api'

export default function JobsDetail({ jobId, onBack, onSelectPart }) {
  const [job, setJob] = useState(null)
  const [parts, setParts] = useState([])
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

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
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Jobs</button>
      
      <h2>{job.name}</h2>
      <p><strong>Description:</strong> {job.description || 'N/A'}</p>
      <p><strong>Customer:</strong> {getCustomerName(job.customer_id)}</p>
      <p><strong>Due Date:</strong> {job.due_date || 'N/A'}</p>
      <p><strong>Received Date:</strong> {job.received_date || 'N/A'}</p>
      <p><strong>Status:</strong> {job.status}</p>
      <p><strong>Created:</strong> {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</p>

      <h3>Associated Parts ({parts.length})</h3>
      {parts.length === 0 ? (
        <p>No parts found for this job</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Shape</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span
                    onClick={() => onSelectPart && onSelectPart(part.id)}
                    style={{ color: '#0066cc', cursor: onSelectPart ? 'pointer' : 'default', textDecoration: onSelectPart ? 'underline' : 'none' }}
                  >{part.name}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaterialName(part.material_id)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaterialShape(part.material_id)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(part.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '30px' }}>PO Documents ({documents.length})</h3>
      {documents.length === 0 ? (
        <p style={{ color: '#666' }}>No documents uploaded for this job</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Filename</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Uploaded</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.filename}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDownload(doc)}
                    style={{ padding: '4px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}
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

      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', display: 'inline-block' }}>
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
