import React, { useState, useEffect } from 'react'
import api from '../api'

export default function MaterialDetail({ materialId, onBack }) {
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadMaterial()
  }, [materialId])

  const loadMaterial = async () => {
    try {
      const res = await api.getMaterial(materialId)
      setMaterial(res)
      setEdited(res)
    } catch (err) {
      console.error('Error loading material:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveMaterial = async () => {
    try {
      await api.updateMaterial(materialId, {
        name: edited.name,
        material_type: edited.material_type,
        material_size: edited.material_size,
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
        {field('Material Size', 'material_size')}
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
    </div>
  )
}
