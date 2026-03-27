import React, { useState, useEffect } from 'react'
import api from '../api'

export default function Home() {
  const [activeJobs, setActiveJobs] = useState([])
  const [existingJobs, setExistingJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [jobForm, setJobForm] = useState({
    name: '',
    description: '',
    customer_id: '',
    due_date: '',
    received_date: '',
    po_number: ''
  })
  const [parts, setParts] = useState([{ name: '', material_type: '', material_size: '', status: 'pending', blueprint: null }])
  const [selectedJobForPart, setSelectedJobForPart] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsRes, customersRes] = await Promise.all([
        api.listJobs(),
        api.listCustomers()
      ])
      setActiveJobs(jobsRes.filter(j => j.status !== 'finished'))
      setExistingJobs(jobsRes)
      setCustomers(customersRes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const handleJobChange = (e) => {
    const { name, value } = e.target
    setJobForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePartChange = (index, field, value) => {
    const newParts = [...parts]
    newParts[index] = { ...newParts[index], [field]: value }
    setParts(newParts)
    
    // Add new part field if current is filled and is last
    if (index === parts.length - 1 && newParts[index].name) {
      setParts([...newParts, { name: '', material_type: '', material_size: '', status: 'pending', blueprint: null }])
    }
  }

  const handleBlueprintChange = (index, file) => {
    const newParts = [...parts]
    newParts[index].blueprint = file
    setParts(newParts)
  }

  const submitJob = async () => {
    if (!jobForm.name || !jobForm.customer_id) {
      setMessage('Job name and customer are required')
      return
    }

    try {
      // Create job
      const jobRes = await api.createJob({
        name: jobForm.name,
        description: jobForm.description,
        customer_id: parseInt(jobForm.customer_id),
        due_date: jobForm.due_date || null,
        received_date: jobForm.received_date || null,
        status: 'queued'
      })

      const jobId = jobRes.id

      // Create parts
      for (const part of parts.filter(p => p.name)) {
        const partRes = await api.createPart({
          job_id: jobId,
          name: part.name,
          material_type: part.material_type,
          material_size: part.material_size,
          status: part.status
        })

        // Upload blueprint if provided
        if (part.blueprint) {
          try {
            await api.uploadBlueprint(partRes.id, part.blueprint)
          } catch (err) {
            console.error('Error uploading blueprint:', err)
          }
        }
      }

      setMessage('Job and parts created successfully!')
      setJobForm({ name: '', description: '', customer_id: '', due_date: '', received_date: '', po_number: '' })
      setParts([{ name: '', material_type: '', material_size: '', status: 'pending', blueprint: null }])
      loadData()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const submitPart = async () => {
    if (!selectedJobForPart || !parts[0].name) {
      setMessage('Select a job and enter part name')
      return
    }

    try {
      for (const part of parts.filter(p => p.name)) {
        await api.createPart({
          job_id: parseInt(selectedJobForPart),
          name: part.name,
          material_type: part.material_type,
          material_size: part.material_size,
          status: part.status
        })
      }

      setMessage('Parts added to job successfully!')
      setParts([{ name: '', material_type: '', material_size: '', status: 'pending', blueprint: null }])
      setSelectedJobForPart('')
      loadData()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Home - Active Jobs</h1>

      {/* Active Jobs List */}
      <div style={{ marginBottom: '30px', padding: '10px', border: '1px solid #ddd' }}>
        <h2>Active Jobs ({activeJobs.length})</h2>
        {activeJobs.length === 0 ? (
          <p>No active jobs</p>
        ) : (
          <ul>
            {activeJobs.map(job => (
              <li key={job.id}>
                <strong>{job.name}</strong> - Customer: {job.customer_id} | Due: {job.due_date} | Status: {job.status}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Job Form */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Create New Job</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Customer: </label>
          <select name="customer_id" value={jobForm.customer_id} onChange={handleJobChange} required>
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Job Name: </label>
          <input type="text" name="name" value={jobForm.name} onChange={handleJobChange} placeholder="Enter job name" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description: </label>
          <textarea name="description" value={jobForm.description} onChange={handleJobChange} placeholder="Job description" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Due Date: </label>
          <input type="date" name="due_date" value={jobForm.due_date} onChange={handleJobChange} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Received Date: </label>
          <input type="date" name="received_date" value={jobForm.received_date} onChange={handleJobChange} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>PO#: </label>
          <input type="text" name="po_number" value={jobForm.po_number} onChange={handleJobChange} placeholder="Purchase order number" />
        </div>

        {/* Parts Section */}
        <h3>Parts for this Job</h3>
        {parts.map((part, idx) => (
          <div key={idx} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label>Part Name: </label>
              <input 
                type="text" 
                value={part.name} 
                onChange={(e) => handlePartChange(idx, 'name', e.target.value)} 
                placeholder="Enter part name"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Material Type: </label>
              <input 
                type="text" 
                value={part.material_type} 
                onChange={(e) => handlePartChange(idx, 'material_type', e.target.value)} 
                placeholder="e.g., Steel, Aluminum"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Material Size: </label>
              <input 
                type="text" 
                value={part.material_size} 
                onChange={(e) => handlePartChange(idx, 'material_size', e.target.value)} 
                placeholder="e.g., 10x10x5"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Status: </label>
              <select value={part.status} onChange={(e) => handlePartChange(idx, 'status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Blueprint: </label>
              <input 
                type="file" 
                onChange={(e) => handleBlueprintChange(idx, e.target.files[0])}
              />
            </div>
          </div>
        ))}

        <button onClick={submitJob} style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          Create Job with Parts
        </button>
      </div>

      {/* Add Parts to Existing Job */}
      <div style={{ padding: '15px', border: '2px solid #ff9900', borderRadius: '5px' }}>
        <h2>Add Parts to Existing Job</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Select Job: </label>
          <select value={selectedJobForPart} onChange={(e) => setSelectedJobForPart(e.target.value)}>
            <option value="">Select Job</option>
            {existingJobs.map(j => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </div>

        {/* Parts Section for Existing Job */}
        {parts.map((part, idx) => (
          <div key={idx} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label>Part Name: </label>
              <input 
                type="text" 
                value={part.name} 
                onChange={(e) => handlePartChange(idx, 'name', e.target.value)} 
                placeholder="Enter part name"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Material Type: </label>
              <input 
                type="text" 
                value={part.material_type} 
                onChange={(e) => handlePartChange(idx, 'material_type', e.target.value)} 
                placeholder="e.g., Steel, Aluminum"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Material Size: </label>
              <input 
                type="text" 
                value={part.material_size} 
                onChange={(e) => handlePartChange(idx, 'material_size', e.target.value)} 
                placeholder="e.g., 10x10x5"
              />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Status: </label>
              <select value={part.status} onChange={(e) => handlePartChange(idx, 'status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label>Blueprint: </label>
              <input 
                type="file" 
                onChange={(e) => handleBlueprintChange(idx, e.target.files[0])}
              />
            </div>
          </div>
        ))}

        <button onClick={submitPart} style={{ padding: '10px 20px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          Add Parts to Selected Job
        </button>
      </div>

      {message && <p style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffffcc', border: '1px solid #cccc00', borderRadius: '3px' }}>{message}</p>}
    </div>
  )
}
