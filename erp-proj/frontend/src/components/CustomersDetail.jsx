import React, { useState, useEffect } from 'react'
import api from '../api'

export default function CustomersDetail({ customerId, onBack }) {
  const [customer, setCustomer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomerData()
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      const [customerRes, jobsRes] = await Promise.all([
        api.request(`/customers/${customerId}`),
        api.request(`/customers/${customerId}/jobs`)
      ])
      
      setCustomer(customerRes)
      setJobs(jobsRes)

      // Get all parts for these jobs
      const allParts = []
      for (const job of jobsRes) {
        const jobParts = await api.request(`/jobs/${job.id}/parts`)
        allParts.push(...jobParts)
      }
      setParts(allParts)
    } catch (err) {
      console.error('Error loading customer data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!customer) return <div>Customer not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Customers</button>
      
      <h2>{customer.name}</h2>
      <p><strong>Contact:</strong> {customer.contact || 'N/A'}</p>
      <p><strong>Notes:</strong> {customer.notes || 'N/A'}</p>
      <p><strong>Created:</strong> {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>

      <h3>Associated Jobs ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Due Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.due_date || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{job.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Associated Parts ({parts.length})</h3>
      {parts.length === 0 ? (
        <p>No parts found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.material_type || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(part.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
