import React, { useEffect, useState } from 'react'
import api from '../api'

export default function POs() {
  const [jobDocs, setJobDocs] = useState([])
  const [materialPOs, setMaterialPOs] = useState([])
  const [itemPOs, setItemPOs] = useState([])
  const [itemPOFile, setItemPOFile] = useState(null)
  const [itemPODesc, setItemPODesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [jd, mp, ip] = await Promise.all([
        api.listAllJobDocuments(),
        api.listAllMaterialPOs(),
        api.listItemPOs()
      ])
      setJobDocs(jd || [])
      setMaterialPOs(mp || [])
      setItemPOs(ip || [])
    } catch (err) {
      console.error('Error loading POs:', err)
    }
  }

  const downloadFile = async (downloadFn, id, filename) => {
    try {
      const { url, filename: fn } = await downloadFn(id, filename)
      const a = document.createElement('a'); a.href = url; a.download = fn; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { alert(`Download failed: ${err}`) }
  }

  const handleUploadItemPO = async () => {
    if (!itemPOFile) return
    setUploading(true)
    setError('')
    try {
      await api.uploadItemPO(itemPOFile, itemPODesc)
      setItemPOFile(null)
      setItemPODesc('')
      const ip = await api.listItemPOs()
      setItemPOs(ip || [])
    } catch (err) {
      setError(`Upload failed: ${err}`)
    }
    setUploading(false)
  }

  const handleDeleteItemPO = async (poId) => {
    if (!window.confirm('Delete this item PO?')) return
    try {
      await api.deleteItemPO(poId)
      setItemPOs(itemPOs.filter(p => p.id !== poId))
    } catch (err) { alert(`Delete failed: ${err}`) }
  }

  const colStyle = {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '16px',
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column'
  }

  const thStyle = { border: '1px solid #ddd', padding: '7px', textAlign: 'left', backgroundColor: '#f0f0f0', fontSize: '13px' }
  const tdStyle = { border: '1px solid #ddd', padding: '7px', fontSize: '13px' }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Purchase Orders</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Column 1: Job POs */}
        <div style={colStyle}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0066cc', paddingBottom: '8px' }}>Job POs</h3>
          {jobDocs.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No job POs uploaded yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Job</th>
                  <th style={thStyle}>Filename</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Download</th>
                </tr>
              </thead>
              <tbody>
                {jobDocs.map(doc => (
                  <tr key={doc.id}>
                    <td style={tdStyle}>{doc.job_name}</td>
                    <td style={tdStyle}>{doc.filename}</td>
                    <td style={tdStyle}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => downloadFile(api.downloadJobDocument, doc.id, doc.filename)}
                        style={{ padding: '3px 8px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Column 2: Material POs */}
        <div style={colStyle}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>Material POs</h3>
          {materialPOs.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No material POs uploaded yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Filename</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Download</th>
                </tr>
              </thead>
              <tbody>
                {materialPOs.map(po => (
                  <tr key={po.id}>
                    <td style={tdStyle}>{po.material_name}</td>
                    <td style={tdStyle}>{po.filename}</td>
                    <td style={tdStyle}>{po.uploaded_at ? new Date(po.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => downloadFile(api.downloadMaterialPO, po.id, po.filename)}
                        style={{ padding: '3px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Column 3: Item POs */}
        <div style={colStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ff9900', paddingBottom: '8px', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Item POs</h3>
          </div>

          {/* Upload form */}
          <div style={{ marginBottom: '16px', padding: '12px', border: '1px dashed #ff9900', borderRadius: '5px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Description:</label>
              <input
                type="text"
                value={itemPODesc}
                onChange={(e) => setItemPODesc(e.target.value)}
                placeholder="Description for this PO"
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box', fontSize: '13px' }}
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <input type="file" onChange={(e) => setItemPOFile(e.target.files?.[0] || null)} style={{ fontSize: '13px' }} />
            </div>
            <button
              onClick={handleUploadItemPO}
              disabled={uploading || !itemPOFile}
              style={{ padding: '6px 14px', backgroundColor: uploading || !itemPOFile ? '#aaa' : '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: uploading || !itemPOFile ? 'default' : 'pointer', fontSize: '13px' }}
            >{uploading ? 'Uploading...' : 'Upload'}</button>
            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
          </div>

          {itemPOs.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No item POs uploaded yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Filename</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemPOs.map(po => (
                  <tr key={po.id}>
                    <td style={tdStyle}>{po.description || '—'}</td>
                    <td style={tdStyle}>{po.filename}</td>
                    <td style={tdStyle}>{po.uploaded_at ? new Date(po.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => downloadFile(api.downloadItemPO, po.id, po.filename)}
                        style={{ padding: '3px 8px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}
                      >Download</button>
                      <button
                        onClick={() => handleDeleteItemPO(po.id)}
                        style={{ padding: '3px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
