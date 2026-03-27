import React, { useState, useEffect } from 'react'
import api from '../api'

export default function CustomersDetail({ customerId, onBack }) {
  const [customer, setCustomer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomerData()
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      setError('')
      const customerRes = await api.getCustomer(customerId)
      setCustomer(customerRes)

      const jobsRes = await api.getCustomerJobs(customerId)
      setJobs(jobsRes || [])

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

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>
  if (!customer) return <div style={{ padding: '20px' }}>Customer not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={onBack} 
        style={{ 
          marginBottom: '20px', 
          padding: '8px 16px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        ← Back to Customers
      </button>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 15px 0' }}>{customer.name}</h2>
        <p><strong>Contact:</strong> {customer.contact || 'N/A'}</p>
        <p><strong>Notes:</strong> {customer.notes || 'N/A'}</p>
        <p><strong>Created:</strong> {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Last Updated:</strong> {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}</p>
      </div>

      <h3>Associated Jobs ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <p style={{ color: '#666' }}>No jobs found for this customer</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Due Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '3px',
                    backgroundColor: job.status === 'finished' ? '#90EE90' : job.status === 'in-progress' ? '#FFD700' : '#FFC0CB',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {job.status}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Associated Parts ({parts.length})</h3>
      {parts.length === 0 ? (
        <p style={{ color: '#666' }}>No parts found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job ID</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.material_type || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '3px',
                    backgroundColor: part.status === 'finished' ? '#90EE90' : part.status === 'in-progress' ? '#FFD700' : '#FFC0CB',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {part.status}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.job_id || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
