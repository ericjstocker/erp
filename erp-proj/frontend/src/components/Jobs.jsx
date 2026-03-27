import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Jobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([])
  const [name, setName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const res = await api.listJobs()
      setJobs(res)
    } catch (err) {
      console.error('Error loading jobs:', err)
    }
  }

  async function submit(e) {
    e.preventDefault()
    try {
      await api.createJob({ name, customer_id: customerId || null })
      setName('')
      setCustomerId('')
      loadJobs()
    } catch (err) {
      alert(`Error creating job: ${err}`)
    }
  }

  async function saveEdit(jobId) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const payload = { name: job.name, description: job.description, customer_id: job.customer_id, status: job.status }
    try {
      await api.updateJob(jobId, payload)
      setEditing(null)
      loadJobs()
    } catch (err) {
      alert(`Error updating job: ${err}`)
    }
  }

  const filteredJobs = jobs.filter(j =>
    j.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div style={{ padding: '20px' }}>
      <h1>Jobs</h1>

      {/* Add Job Form */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Create New Job</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Job Name *: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Job name"
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Customer ID: </label>
            <input
              type="number"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Customer ID (optional)"
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Create Job
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* Jobs Table */}
      <h2>All Jobs ({filteredJobs.length})</h2>
      {filteredJobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Customer ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Due Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(j => (
              <tr key={j.id} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{j.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{j.customer_id || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{j.due_date || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{j.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{j.created_at ? new Date(j.created_at).toLocaleDateString() : 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => onSelectJob && onSelectJob(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setEditing(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editing && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #ff9900', borderRadius: '5px', backgroundColor: '#fffacd' }}>
          <h2>Edit Job</h2>
          {jobs.map(j => editing === j.id && (
            <div key={j.id}>
              <div style={{ marginBottom: '10px' }}>
                <label>Job Name: </label>
                <input value={j.name} onChange={(e) => { j.name = e.target.value; setJobs([...jobs]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Status: </label>
                <select value={j.status || ''} onChange={(e) => { j.status = e.target.value; setJobs([...jobs]) }}>
                  <option value="queued">Queued</option>
                  <option value="in-progress">In Progress</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <button onClick={() => saveEdit(j.id)} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '8px' }}>
                Save
              </button>
              <button onClick={() => setEditing(null)} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
