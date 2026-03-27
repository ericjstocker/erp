import React, { useState, useEffect } from 'react'
import api from '../api'

export default function JobsDetail({ jobId, onBack }) {
  const [job, setJob] = useState(null)
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobData()
  }, [jobId])

  const loadJobData = async () => {
    try {
      const [jobRes, partsRes] = await Promise.all([
        api.request(`/jobs/${jobId}`),
        api.request(`/jobs/${jobId}/parts`)
      ])
      
      setJob(jobRes)
      setParts(partsRes)
    } catch (err) {
      console.error('Error loading job data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!job) return <div>Job not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Jobs</button>
      
      <h2>{job.name}</h2>
      <p><strong>Description:</strong> {job.description || 'N/A'}</p>
      <p><strong>Customer ID:</strong> {job.customer_id || 'N/A'}</p>
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
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Size</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.material_type || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.material_size || 'N/A'}</td>
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
