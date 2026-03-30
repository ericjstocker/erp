import React, { useState, useEffect } from 'react'
import api from '../api'

export default function Material({ onSelectMaterial }) {
  const [materials, setMaterials] = useState([])
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    material_type: '',
    shape: '',
    diameter: '',
    length: '',
    width: '',
    height: '',
    quantity: '',
    purchase_location: '',
    provider_info: '',
    po_number: '',
    doc: null
  })
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [newMaterialDocFile, setNewMaterialDocFile] = useState(null)
  const [newMaterialPOFile, setNewMaterialPOFile] = useState(null)
  const [editMaterialDocs, setEditMaterialDocs] = useState([])
  const [editMaterialPOs, setEditMaterialPOs] = useState([])
  const [editDocFiles, setEditDocFiles] = useState([])
  const [editPOFiles, setEditPOFiles] = useState([])
  const [filters, setFilters] = useState({
    name: '', material_type: '', shape: '', diameter: '',
    length: '', width: '', height: '', quantity: '', po_number: '',
    purchase_location: '', provider_info: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const res = await api.listMaterials()
      setMaterials(res)
    } catch (err) {
      console.error('Error loading materials:', err)
    }
  }

  const handleMaterialChange = (e) => {
    const { name, value } = e.target
    setNewMaterial(prev => ({ ...prev, [name]: value }))
  }

  const handleDocChange = (e) => {
    setNewMaterial(prev => ({ ...prev, doc: e.target.files[0] }))
  }

  const submitMaterial = async () => {
    if (!newMaterial.name) {
      setMessage('Material name is required')
      return
    }
    try {
      const matRes = await api.createMaterial({
        name: newMaterial.name,
        material_type: newMaterial.material_type,
        shape: newMaterial.shape,
        diameter: newMaterial.diameter,
        length: newMaterial.length,
        width: newMaterial.width,
        height: newMaterial.height,
        quantity: newMaterial.quantity ? parseInt(newMaterial.quantity) : null,
        purchase_location: newMaterial.purchase_location,
        provider_info: newMaterial.provider_info,
        po_number: newMaterial.po_number
      })
      if (newMaterialDocFile) {
        try { await api.uploadMaterialDocument(matRes.id, newMaterialDocFile) } catch (err) { console.error('Doc upload error:', err) }
      }
      if (newMaterialPOFile) {
        try { await api.uploadMaterialPO(matRes.id, newMaterialPOFile) } catch (err) { console.error('PO upload error:', err) }
      }
      setMessage('Material created successfully!')
      setNewMaterial({ name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', quantity: '', purchase_location: '', provider_info: '', po_number: '', doc: null })
      setNewMaterialDocFile(null)
      setNewMaterialPOFile(null)
      setShowNewMaterialForm(false)
      loadMaterials()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const saveEdit = async (matId) => {
    const mat = materials.find(m => m.id === matId)
    if (!mat) return
    try {
      await api.updateMaterial(matId, {
        name: mat.name,
        material_type: mat.material_type,
        shape: mat.shape,
        diameter: mat.diameter,
        length: mat.length,
        width: mat.width,
        height: mat.height,
        quantity: mat.quantity !== '' && mat.quantity !== null && mat.quantity !== undefined ? parseInt(mat.quantity) : null,
        purchase_location: mat.purchase_location,
        provider_info: mat.provider_info,
        po_number: mat.po_number
      })
      for (const file of editDocFiles) {
        try { await api.uploadMaterialDocument(matId, file) } catch (err) { console.error('Doc upload error:', err) }
      }
      for (const file of editPOFiles) {
        try { await api.uploadMaterialPO(matId, file) } catch (err) { console.error('PO upload error:', err) }
      }
      setEditing(null)
      setEditDocFiles([])
      setEditPOFiles([])
      setEditMaterialDocs([])
      setEditMaterialPOs([])
      setMessage('Material updated successfully!')
      loadMaterials()
    } catch (err) {
      setMessage(`Error updating material: ${err.message}`)
    }
  }

  const openEditMaterial = async (matId) => {
    setEditing(matId)
    setEditDocFiles([])
    setEditPOFiles([])
    try {
      const [docs, pos] = await Promise.all([
        api.listMaterialDocuments(matId),
        api.listMaterialPOs(matId)
      ])
      setEditMaterialDocs(docs || [])
      setEditMaterialPOs(pos || [])
    } catch (err) {
      setEditMaterialDocs([])
      setEditMaterialPOs([])
    }
  }

  const deleteEditDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.deleteMaterialDocument(docId)
      setEditMaterialDocs(editMaterialDocs.filter(d => d.id !== docId))
    } catch (err) { alert(`Error: ${err}`) }
  }

  const deleteEditPO = async (poId) => {
    if (!window.confirm('Delete this PO?')) return
    try {
      await api.deleteMaterialPO(poId)
      setEditMaterialPOs(editMaterialPOs.filter(p => p.id !== poId))
    } catch (err) { alert(`Error: ${err}`) }
  }

  const downloadEditDoc = async (doc) => {
    try {
      const { url, filename } = await api.downloadMaterialDocument(doc.id, doc.filename)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { alert(`Download failed: ${err}`) }
  }

  const downloadEditPO = async (po) => {
    try {
      const { url, filename } = await api.downloadMaterialPO(po.id, po.filename)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { alert(`Download failed: ${err}`) }
  }

  const deleteMaterial = async (id, name) => {
    if (!window.confirm(`Delete material "${name}"?`)) return
    try {
      await api.deleteMaterial(id)
      setMessage(`"${name}" deleted.`)
      loadMaterials()
    } catch (err) {
      setMessage(`Error deleting: ${err.message}`)
    }
  }

  const filteredMaterials = materials.filter(m => {
    return (
      m.name?.toLowerCase().includes(filters.name.toLowerCase()) &&
      (m.material_type || '').toLowerCase().includes(filters.material_type.toLowerCase()) &&
      (m.shape || '').toLowerCase().includes(filters.shape.toLowerCase()) &&
      (m.diameter || '').toLowerCase().includes(filters.diameter.toLowerCase()) &&
      (m.length || '').toLowerCase().includes(filters.length.toLowerCase()) &&
      (m.width || '').toLowerCase().includes(filters.width.toLowerCase()) &&
      (m.height || '').toLowerCase().includes(filters.height.toLowerCase()) &&
      String(m.quantity ?? '').includes(filters.quantity) &&
      (m.po_number || '').toLowerCase().includes(filters.po_number.toLowerCase()) &&
      (m.purchase_location || '').toLowerCase().includes(filters.purchase_location.toLowerCase()) &&
      (m.provider_info || '').toLowerCase().includes(filters.provider_info.toLowerCase())
    )
  })

  return (
    <div style={{ padding: '20px' }}>
      <h1>Materials Inventory</h1>

      <button
        onClick={() => setShowNewMaterialForm(!showNewMaterialForm)}
        style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
      >
        {showNewMaterialForm ? 'Cancel' : '+ Add New Material'}
      </button>

      {showNewMaterialForm && (
        <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
          <h2>Add New Material</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Name *: </label>
            <input type="text" name="name" value={newMaterial.name} onChange={handleMaterialChange} placeholder="e.g., Steel Sheet" required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Type: </label>
            <input type="text" name="material_type" value={newMaterial.material_type} onChange={handleMaterialChange} placeholder="e.g., Carbon Steel" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Shape: </label>
            <input type="text" name="shape" value={newMaterial.shape} onChange={handleMaterialChange} placeholder="e.g., Round Bar, Sheet, Tube" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Diameter: </label>
            <input type="text" name="diameter" value={newMaterial.diameter} onChange={handleMaterialChange} placeholder="e.g., 1.5in" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Length: </label>
            <input type="text" name="length" value={newMaterial.length} onChange={handleMaterialChange} placeholder="e.g., 12ft" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Width: </label>
            <input type="text" name="width" value={newMaterial.width} onChange={handleMaterialChange} placeholder="e.g., 24in" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Height: </label>
            <input type="text" name="height" value={newMaterial.height} onChange={handleMaterialChange} placeholder="e.g., 0.25in" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Quantity: </label>
            <input type="number" name="quantity" value={newMaterial.quantity} onChange={handleMaterialChange} placeholder="e.g., 10" min="0" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>PO Number: </label>
            <input type="text" name="po_number" value={newMaterial.po_number} onChange={handleMaterialChange} placeholder="Purchase order number" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Purchase Location: </label>
            <input type="text" name="purchase_location" value={newMaterial.purchase_location} onChange={handleMaterialChange} placeholder="Where the material was purchased" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Provider/Vendor Info: </label>
            <input type="text" name="provider_info" value={newMaterial.provider_info} onChange={handleMaterialChange} placeholder="Vendor contact info" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Documentation: </label>
            <input type="file" onChange={(e) => setNewMaterialDocFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Upload PO: </label>
            <input type="file" onChange={(e) => setNewMaterialPOFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
          </div>
          <button onClick={submitMaterial} style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Save Material
          </button>
        </div>
      )}

      {message && <p style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffffcc', border: '1px solid #cccc00', borderRadius: '3px' }}>{message}</p>}

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ padding: '8px 16px', backgroundColor: showFilters ? '#555' : '#444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {showFilters && (
          <button
            onClick={() => setFilters({ name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', quantity: '', po_number: '', purchase_location: '', provider_info: '' })}
            style={{ marginLeft: '8px', padding: '8px 16px', backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #aaa', borderRadius: '5px', backgroundColor: '#f9f9f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {[
            ['Name', 'name'],
            ['Type', 'material_type'],
            ['Shape', 'shape'],
            ['Diameter', 'diameter'],
            ['Length', 'length'],
            ['Width', 'width'],
            ['Height', 'height'],
            ['Quantity', 'quantity'],
            ['PO #', 'po_number'],
            ['Purchase Location', 'purchase_location'],
            ['Provider', 'provider_info'],
          ].map(([label, key]) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>{label}</label>
              <input
                type="text"
                value={filters[key]}
                onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Filter by ${label.toLowerCase()}...`}
                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
      )}

      <h2>All Materials ({filteredMaterials.length}{filteredMaterials.length !== materials.length ? ` of ${materials.length}` : ''})</h2>
      {materials.length === 0 ? (
        <p>No materials found</p>
      ) : filteredMaterials.length === 0 ? (
        <p>No materials match the current filters.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Shape</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Diameter</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Length</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Width</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Height</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Qty</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>PO #</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Purchase Location</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Provider</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(material => (
                <tr key={material.id} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.material_type || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.shape || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.diameter || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.length || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.width || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.height || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.quantity ?? 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.po_number || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.purchase_location || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.provider_info || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectMaterial && onSelectMaterial(material.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openEditMaterial(material.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMaterial(material.id, material.name)}
                      style={{ padding: '5px 10px', backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #ff9900', borderRadius: '5px', backgroundColor: '#fffacd' }}>
          <h2>Edit Material</h2>
          {materials.map(m => editing === m.id && (
            <div key={m.id}>
              <div style={{ marginBottom: '10px' }}>
                <label>Name: </label>
                <input value={m.name} onChange={(e) => { m.name = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Type: </label>
                <input value={m.material_type || ''} onChange={(e) => { m.material_type = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Shape: </label>
                <input value={m.shape || ''} onChange={(e) => { m.shape = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Diameter: </label>
                <input value={m.diameter || ''} onChange={(e) => { m.diameter = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Length: </label>
                <input value={m.length || ''} onChange={(e) => { m.length = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Width: </label>
                <input value={m.width || ''} onChange={(e) => { m.width = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Height: </label>
                <input value={m.height || ''} onChange={(e) => { m.height = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Quantity: </label>
                <input type="number" value={m.quantity ?? ''} min="0" onChange={(e) => { m.quantity = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>PO Number: </label>
                <input value={m.po_number || ''} onChange={(e) => { m.po_number = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Purchase Location: </label>
                <input value={m.purchase_location || ''} onChange={(e) => { m.purchase_location = e.target.value; setMaterials([...materials]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Provider Info: </label>
                <input value={m.provider_info || ''} onChange={(e) => { m.provider_info = e.target.value; setMaterials([...materials]) }} />
              </div>

              {/* Documentation upload section */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Upload Documentation:</label>
                <input type="file" multiple onChange={(e) => setEditDocFiles(Array.from(e.target.files))} />
                {editDocFiles.length > 0 && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#555' }}>{editDocFiles.length} file(s) selected</span>}
              </div>
              {editMaterialDocs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Existing Documentation ({editMaterialDocs.length}):</label>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>Filename</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>Uploaded</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Actions</th>
                    </tr></thead>
                    <tbody>{editMaterialDocs.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>{doc.filename}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>
                          <button onClick={() => downloadEditDoc(doc)} style={{ padding: '3px 8px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Download</button>
                          <button onClick={() => deleteEditDoc(doc.id)} style={{ padding: '3px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {/* PO upload section */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Upload PO Documents:</label>
                <input type="file" multiple onChange={(e) => setEditPOFiles(Array.from(e.target.files))} />
                {editPOFiles.length > 0 && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#555' }}>{editPOFiles.length} file(s) selected</span>}
              </div>
              {editMaterialPOs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Existing PO Documents ({editMaterialPOs.length}):</label>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>Filename</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>Uploaded</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Actions</th>
                    </tr></thead>
                    <tbody>{editMaterialPOs.map(po => (
                      <tr key={po.id}>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>{po.filename}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>{po.uploaded_at ? new Date(po.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>
                          <button onClick={() => downloadEditPO(po)} style={{ padding: '3px 8px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Download</button>
                          <button onClick={() => deleteEditPO(po.id)} style={{ padding: '3px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              <button onClick={() => saveEdit(m.id)} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '8px' }}>
                Save
              </button>
              <button onClick={() => { setEditing(null); setEditDocFiles([]); setEditPOFiles([]); setEditMaterialDocs([]); setEditMaterialPOs([]) }} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
