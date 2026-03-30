import React, { useState, useEffect } from 'react'
import api from '../api'

export default function MaterialDetail({ materialId, onBack }) {
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(null)
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState([])
  const [poFiles, setPoFiles] = useState([])
  const [docUploadFiles, setDocUploadFiles] = useState([])
  const [poUploadFiles, setPoUploadFiles] = useState([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadingPO, setUploadingPO] = useState(false)

  useEffect(() => {
    loadMaterial()
  }, [materialId])

  const loadMaterial = async () => {
    try {
      const [res, docsRes, posRes] = await Promise.all([
        api.getMaterial(materialId),
        api.listMaterialDocuments(materialId),
        api.listMaterialPOs(materialId)
      ])
      setMaterial(res)
      setEdited(res)
      setDocuments(docsRes || [])
      setPoFiles(posRes || [])
    } catch (err) {
      console.error('Error loading material:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      const { url, filename } = await api.downloadMaterialDocument(doc.id, doc.filename)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { alert(`Download failed: ${err}`) }
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.deleteMaterialDocument(docId)
      setDocuments(documents.filter(d => d.id !== docId))
    } catch (err) { alert(`Delete failed: ${err}`) }
  }

  const handleUploadDocs = async () => {
    if (docUploadFiles.length === 0) return
    setUploadingDoc(true)
    const files = [...docUploadFiles]
    setDocUploadFiles([])
    for (const file of files) {
      try { await api.uploadMaterialDocument(materialId, file) } catch (err) { console.error(err) }
    }
    setUploadingDoc(false)
    const docsRes = await api.listMaterialDocuments(materialId)
    setDocuments(docsRes || [])
  }

  const handleDownloadPO = async (po) => {
    try {
      const { url, filename } = await api.downloadMaterialPO(po.id, po.filename)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { alert(`Download failed: ${err}`) }
  }

  const handleDeletePO = async (poId) => {
    if (!window.confirm('Delete this PO?')) return
    try {
      await api.deleteMaterialPO(poId)
      setPoFiles(poFiles.filter(p => p.id !== poId))
    } catch (err) { alert(`Delete failed: ${err}`) }
  }

  const handleUploadPOs = async () => {
    if (poUploadFiles.length === 0) return
    setUploadingPO(true)
    const files = [...poUploadFiles]
    setPoUploadFiles([])
    for (const file of files) {
      try { await api.uploadMaterialPO(materialId, file) } catch (err) { console.error(err) }
    }
    setUploadingPO(false)
    const posRes = await api.listMaterialPOs(materialId)
    setPoFiles(posRes || [])
  }

  const saveMaterial = async () => {
    try {
      await api.updateMaterial(materialId, {
        name: edited.name,
        material_type: edited.material_type,
        shape: edited.shape,
        diameter: edited.diameter,
        length: edited.length,
        width: edited.width,
        height: edited.height,
        quantity: edited.quantity !== '' && edited.quantity !== null && edited.quantity !== undefined ? parseInt(edited.quantity) : null,
        purchase_location: edited.purchase_location,
        provider_info: edited.provider_info,
        po_number: edited.po_number
      })
      setMaterial(edited)
      setEditing(false)
      setMessage('Saved successfully')
    } catch (err) {
      setMessage('Error saving: ' + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!material) return <div>Material not found</div>

  const field = (label, key, type = 'text') => (
    <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', alignItems: 'center' }}>
      <strong>{label}:</strong>
      {editing ? (
        <input
          type={type}
          value={edited[key] || ''}
          onChange={(e) => setEdited({ ...edited, [key]: e.target.value })}
          style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '3px' }}
        />
      ) : (
        <span>{material[key] || 'N/A'}</span>
      )}
    </div>
  )

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Materials</button>

      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>{material.name}</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ padding: '8px 16px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              Edit
            </button>
          )}
        </div>

        {message && <p style={{ padding: '8px', backgroundColor: '#ffffcc', border: '1px solid #cccc00', borderRadius: '3px', marginBottom: '12px' }}>{message}</p>}

        {field('Material Name', 'name')}
        {field('Material Type', 'material_type')}
        {field('Shape', 'shape')}
        {field('Diameter', 'diameter')}
        {field('Length', 'length')}
        {field('Width', 'width')}
        {field('Height', 'height')}
        {field('Quantity', 'quantity', 'number')}
        {field('PO Number', 'po_number')}
        {field('Purchase Location', 'purchase_location')}
        {field('Provider Info', 'provider_info')}

        <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', alignItems: 'center' }}>
          <strong>Created:</strong>
          <span>{material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', alignItems: 'center' }}>
          <strong>Last Updated:</strong>
          <span>{material.updated_at ? new Date(material.updated_at).toLocaleDateString() : 'N/A'}</span>
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={saveMaterial} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
              Save
            </button>
            <button onClick={() => { setEditing(false); setEdited(material) }} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Documentation section */}
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Documentation ({documents.length})</h3>
        {documents.length === 0 ? (
          <p style={{ color: '#666' }}>No documentation uploaded</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
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
                    <button onClick={() => handleDownloadDoc(doc)} style={{ padding: '4px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}>Download</button>
                    <button onClick={() => handleDeleteDoc(doc.id)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="file" multiple onChange={(e) => setDocUploadFiles(Array.from(e.target.files))} />
          <button
            onClick={handleUploadDocs}
            disabled={uploadingDoc || docUploadFiles.length === 0}
            style={{ padding: '6px 14px', backgroundColor: uploadingDoc || docUploadFiles.length === 0 ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: uploadingDoc || docUploadFiles.length === 0 ? 'default' : 'pointer' }}
          >{uploadingDoc ? 'Uploading...' : 'Upload'}</button>
        </div>
      </div>

      {/* PO Documents section */}
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>PO Documents ({poFiles.length})</h3>
        {poFiles.length === 0 ? (
          <p style={{ color: '#666' }}>No PO documents uploaded</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Filename</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Uploaded</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {poFiles.map(po => (
                <tr key={po.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{po.filename}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{po.uploaded_at ? new Date(po.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <button onClick={() => handleDownloadPO(po)} style={{ padding: '4px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '6px' }}>Download</button>
                    <button onClick={() => handleDeletePO(po.id)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="file" multiple onChange={(e) => setPoUploadFiles(Array.from(e.target.files))} />
          <button
            onClick={handleUploadPOs}
            disabled={uploadingPO || poUploadFiles.length === 0}
            style={{ padding: '6px 14px', backgroundColor: uploadingPO || poUploadFiles.length === 0 ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: uploadingPO || poUploadFiles.length === 0 ? 'default' : 'pointer' }}
          >{uploadingPO ? 'Uploading...' : 'Upload'}</button>
        </div>
      </div>
    </div>
  )
}
