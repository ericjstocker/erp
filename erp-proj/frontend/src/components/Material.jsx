import React, { useState, useEffect } from 'react'
import api from '../api'

export default function Material() {
  const [materials, setMaterials] = useState([])
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    material_type: '',
    material_size: '',
    purchase_location: '',
    provider_info: '',
    po_number: '',
    doc: null
  })
  const [message, setMessage] = useState('')

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
      const res = await api.createMaterial({
        name: newMaterial.name,
        material_type: newMaterial.material_type,
        material_size: newMaterial.material_size,
        purchase_location: newMaterial.purchase_location,
        provider_info: newMaterial.provider_info,
        po_number: newMaterial.po_number
      })

      // Upload documentation if provided
      if (newMaterial.doc) {
        const formData = new FormData()
        formData.append('file', newMaterial.doc)
        const token = localStorage.getItem('token')
        await fetch('/api/upload-material-doc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
      }

      setMessage('Material created successfully!')
      setNewMaterial({
        name: '',
        material_type: '',
        material_size: '',
        purchase_location: '',
        provider_info: '',
        po_number: '',
        doc: null
      })
      setShowNewMaterialForm(false)
      loadMaterials()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Materials Inventory</h1>

      <button 
        onClick={() => setShowNewMaterialForm(!showNewMaterialForm)}
        style={{ 
          marginBottom: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#0066cc', 
          color: 'white', 
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        {showNewMaterialForm ? 'Cancel' : '+ Add New Material'}
      </button>

      {showNewMaterialForm && (
        <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
          <h2>Add New Material</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Name *: </label>
            <input 
              type="text" 
              name="name" 
              value={newMaterial.name} 
              onChange={handleMaterialChange} 
              placeholder="e.g., Steel Sheet"
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Type: </label>
            <input 
              type="text" 
              name="material_type" 
              value={newMaterial.material_type} 
              onChange={handleMaterialChange} 
              placeholder="e.g., Carbon Steel"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Size: </label>
            <input 
              type="text" 
              name="material_size" 
              value={newMaterial.material_size} 
              onChange={handleMaterialChange} 
              placeholder="e.g., 1/4in x 12in x 24in"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>PO Number: </label>
            <input 
              type="text" 
              name="po_number" 
              value={newMaterial.po_number} 
              onChange={handleMaterialChange} 
              placeholder="Purchase order number"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Purchase Location: </label>
            <input 
              type="text" 
              name="purchase_location" 
              value={newMaterial.purchase_location} 
              onChange={handleMaterialChange} 
              placeholder="Where the material was purchased"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Provider/Vendor Info: </label>
            <input 
              type="text" 
              name="provider_info" 
              value={newMaterial.provider_info} 
              onChange={handleMaterialChange} 
              placeholder="Vendor contact info"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Documentation: </label>
            <input 
              type="file" 
              onChange={handleDocChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
            />
          </div>
          <button 
            onClick={submitMaterial}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#0066cc', 
              color: 'white', 
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Save Material
          </button>
        </div>
      )}

      {message && <p style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffffcc', border: '1px solid #cccc00', borderRadius: '3px' }}>{message}</p>}

      <h2>All Materials ({materials.length})</h2>
      {materials.length === 0 ? (
        <p>No materials found</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Size</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>PO #</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Purchase Location</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Provider</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(material => (
                <tr key={material.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.material_type || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.material_size || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.po_number || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.purchase_location || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.provider_info || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
