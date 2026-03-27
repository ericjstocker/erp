import React, { useState, useEffect } from 'react'
import api from '../api'

export default function PartsDetail({ partId, onBack }) {
  const [part, setPart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartData()
  }, [partId])

  const loadPartData = async () => {
    try {
      const partRes = await api.request(`/parts/${partId}`)
      setPart(partRes)
    } catch (err) {
      console.error('Error loading part data:', err)
    } finally {
      setLoading(false)
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
        <p><strong>Job ID:</strong> {part.job_id || 'N/A'}</p>
        <p><strong>Material Type:</strong> {part.material_type || 'N/A'}</p>
        <p><strong>Material Size:</strong> {part.material_size || 'N/A'}</p>
        <p><strong>Status:</strong> <span style={{ padding: '5px 10px', backgroundColor: part.status === 'completed' ? '#90EE90' : part.status === 'in-progress' ? '#FFD700' : '#FFB6C6', borderRadius: '3px' }}>{part.status}</span></p>
        
        {part.blueprint_path && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Blueprint:</strong></p>
            <a href={`/api/${part.blueprint_path}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
              Download Blueprint
            </a>
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
