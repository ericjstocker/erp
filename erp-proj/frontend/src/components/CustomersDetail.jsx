import React, { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

const STATUS_COLORS = { running: '#28a745', hold: '#dc3545', ready: '#ffc107', 'needs-work': '#fd7e14', complete: '#0066cc' }
const STATUS_LABELS = { running: 'Running', hold: 'Hold', ready: 'Ready/Next', 'needs-work': 'Needs Work', complete: 'Complete' }
const statusBadgeStyle = (s) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', backgroundColor: STATUS_COLORS[s] || '#aaa', color: '#000', fontWeight: 'bold', fontSize: '12px' })
const statusLabel = (s) => STATUS_LABELS[s] || s || 'N/A'

export default function CustomersDetail({ customerId, onBack, onSelectJob, onSelectPart }) {
  const { accentColor, currentTheme } = useTheme()
  const [customer, setCustomer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [parts, setParts] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editedCustomer, setEditedCustomer] = useState(null)

  useEffect(() => {
    loadCustomerData()
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      setError('')
      const customerRes = await api.getCustomer(customerId)
      setCustomer(customerRes)
      setEditedCustomer(customerRes)

      const jobsRes = await api.getCustomerJobs(customerId)
      setJobs(jobsRes || [])

      const materialsRes = await api.listMaterials()
      setMaterials(materialsRes || [])

      // Get all parts for these jobs
      const allParts = []
      if (jobsRes && jobsRes.length > 0) {
        for (const job of jobsRes) {
          try {
            const jobParts = await api.getJobParts(job.id)
            allParts.push(...(jobParts || []))
          } catch (err) {
            console.error(`Error loading parts for job ${job.id}:`, err)
          }
        }
      }
      setParts(allParts)
    } catch (err) {
      console.error('Error loading customer data:', err)
      setError('Failed to load customer details: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomerData = async () => {
    if (!editedCustomer) return
    try {
      await api.updateCustomer(customerId, {
        name: editedCustomer.name,
        point_of_contact: editedCustomer.point_of_contact,
        phone_number: editedCustomer.phone_number,
        email: editedCustomer.email,
        notes: editedCustomer.notes
      })
      setCustomer(editedCustomer)
      setEditing(false)
      setError('')
    } catch (err) {
      setError('Failed to save customer: ' + err.message)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>
  if (!customer) return <div style={{ padding: '20px' }}>Customer not found</div>

  const getMaterialName = (matId) => { const m = materials.find(m => m.id === matId); return m ? m.name : 'N/A' }
  const getMaterialShape = (matId) => { const m = materials.find(m => m.id === matId); return m ? (m.shape || 'N/A') : 'N/A' }

  return (
    <div style={{ padding: '20px', backgroundColor: currentTheme.bg, color: currentTheme.text, minHeight: '100%' }}>
      <button 
        onClick={onBack} 
        style={{ 
          marginBottom: '20px', 
          padding: '8px 16px',
          backgroundColor: accentColor,
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        ← Back to Customers
      </button>
      
      <div style={{ backgroundColor: currentTheme.hover, padding: '15px', borderRadius: '5px', marginBottom: '20px', border: `2px solid ${accentColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>{customer.name}</h2>
          {!editing && <button 
            onClick={() => setEditing(true)}
            style={{ 
              padding: '8px 16px',
              backgroundColor: accentColor,
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>}
        </div>
        
        {editing && editedCustomer ? (
          <>
            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Name:</label>
              <input 
                type="text"
                value={editedCustomer.name}
                onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                style={{ padding: '8px', border: `1px solid ${accentColor}`, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}
              />
            </div>
            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Point of Contact:</label>
              <input 
                type="text"
                value={editedCustomer.point_of_contact || ''}
                onChange={(e) => setEditedCustomer({...editedCustomer, point_of_contact: e.target.value})}
                style={{ padding: '8px', border: `1px solid ${accentColor}`, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}
              />
            </div>
            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Phone Number:</label>
              <input 
                type="text"
                value={editedCustomer.phone_number || ''}
                onChange={(e) => setEditedCustomer({...editedCustomer, phone_number: e.target.value})}
                style={{ padding: '8px', border: `1px solid ${accentColor}`, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}
              />
            </div>
            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Email:</label>
              <input 
                type="email"
                value={editedCustomer.email || ''}
                onChange={(e) => setEditedCustomer({...editedCustomer, email: e.target.value})}
                style={{ padding: '8px', border: `1px solid ${accentColor}`, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Notes:</label>
              <textarea 
                value={editedCustomer.notes || ''}
                onChange={(e) => setEditedCustomer({...editedCustomer, notes: e.target.value})}
                style={{ padding: '8px', border: `1px solid ${accentColor}`, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, width: '100%', minHeight: '80px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={saveCustomerData}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button 
                onClick={() => { setEditing(false); setEditedCustomer(customer); }}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#ccc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Point of Contact:</strong> {customer.point_of_contact || 'N/A'}</p>
            <p><strong>Phone Number:</strong> {customer.phone_number || 'N/A'}</p>
            <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
            <p><strong>Notes:</strong> {customer.notes || 'N/A'}</p>
            <p><strong>Created:</strong> {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Last Updated:</strong> {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}</p>
          </>
        )}
      </div>

      <h3>Associated Jobs ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <p style={{ color: currentTheme.text }}>No jobs found for this customer</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Job Name</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}># of Parts</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Due Date</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Status</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>
                  <span
                    onClick={() => onSelectJob && onSelectJob(job.id)}
                    style={{ color: accentColor, cursor: 'pointer', textDecoration: 'underline' }}
                  >{job.name}</span>
                </td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{parts.filter(p => p.job_id === job.id).length}</td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}</td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>
                  <span style={statusBadgeStyle(job.status)}>{statusLabel(job.status)}</span>
                </td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Associated Parts ({parts.length})</h3>
      {parts.length === 0 ? (
        <p style={{ color: currentTheme.text }}>No parts found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Part Name</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Material Name</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Material Shape</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Quantity</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Status</th>
              <th style={{ border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }}>Job</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id}>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>
                  <span
                    onClick={() => onSelectPart && onSelectPart(part.id)}
                    style={{ color: accentColor, cursor: 'pointer', textDecoration: 'underline' }}
                  >{part.name}</span>
                </td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{getMaterialName(part.material_id)}</td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{getMaterialShape(part.material_id)}</td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>{part.quantity != null ? part.quantity : 'N/A'}</td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>
                  <span style={statusBadgeStyle(part.status)}>{statusLabel(part.status)}</span>
                </td>
                <td style={{ border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }}>
                  {jobs.find(j => j.id === part.job_id) ? (
                    <span
                      onClick={() => onSelectJob && onSelectJob(part.job_id)}
                      style={{ color: accentColor, cursor: 'pointer', textDecoration: 'underline' }}
                    >{jobs.find(j => j.id === part.job_id).name}</span>
                  ) : (part.job_id || 'N/A')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
