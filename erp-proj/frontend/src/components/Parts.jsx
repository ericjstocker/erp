import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Parts({ onSelectPart }) {
  const [parts, setParts] = useState([])
  const [jobs, setJobs] = useState([])
  const [materials, setMaterials] = useState([])
  const [name, setName] = useState('')
  const [jobId, setJobId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [materialSize, setMaterialSize] = useState('')
  const [status, setStatus] = useState('pending')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [fileByPart, setFileByPart] = useState({})
  const [customers, setCustomers] = useState([])
  const [createCustFilter, setCreateCustFilter] = useState('')
  const [editCustFilter, setEditCustFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [partsRes, jobsRes, materialsRes, customersRes] = await Promise.all([
        api.listParts(),
        api.listJobs(),
        api.listMaterials(),
        api.listCustomers()
      ])
      setParts(partsRes)
      setJobs(jobsRes)
      setMaterials(materialsRes)
      setCustomers(customersRes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  async function submit(e) {
    e.preventDefault()
    try {
      await api.createPart({
        name,
        job_id: jobId || null,
        material_id: materialId || null,
        material_type: materialType || null,
        material_size: materialSize || null,
        status
      })
      setName('')
      setJobId('')
      setMaterialId('')
      setMaterialType('')
      setMaterialSize('')
      setStatus('pending')
      loadData()
    } catch (err) {
      alert(`Error creating part: ${err}`)
    }
  }

  async function saveEdit(partId) {
    const part = parts.find(p => p.id === partId)
    if (!part) return
    const payload = {
      name: part.name,
      job_id: part.job_id,
      material_id: part.material_id,
      material_type: part.material_type,
      material_size: part.material_size,
      status: part.status
    }
    try {
      await api.updatePart(partId, payload)
      setEditing(null)
      loadData()
    } catch (err) {
      alert(`Error updating part: ${err}`)
    }
  }

  async function uploadBlueprintFor(partId) {
    const file = fileByPart[partId]
    if (!file) {
      alert('Select file first')
      return
    }
    try {
      await api.uploadBlueprint(partId, file)
      setFileByPart(prev => ({ ...prev, [partId]: null }))
      loadData()
      alert('Blueprint uploaded successfully')
    } catch (err) {
      alert(`Error uploading blueprint: ${err}`)
    }
  }

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

  const getJobName = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    return job ? job.name : 'N/A'
  }

  const getCustomerForJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job || !job.customer_id) return 'N/A'
    const customer = customers.find(c => c.id === job.customer_id)
    return customer ? customer.name : 'N/A'
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Parts</h1>

      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Create New Part</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Part Name *: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Part name"
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Type: </label>
            <input
              type="text"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              placeholder="e.g., Steel, Aluminum"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material Size: </label>
            <input
              type="text"
              value={materialSize}
              onChange={(e) => setMaterialSize(e.target.value)}
              placeholder="e.g., 10x10x5"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Customer: </label>
            <select
              value={createCustFilter}
              onChange={(e) => { setCreateCustFilter(e.target.value); setJobId('') }}
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Job: </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">Select Job (optional)</option>
              {(createCustFilter ? jobs.filter(j => j.customer_id === parseInt(createCustFilter)) : jobs).map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Material ID: </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              <option value="">Select Material (optional)</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Status: </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Create Part
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search parts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      <h2>All Parts ({filteredParts.length})</h2>
      {filteredParts.length === 0 ? (
        <p>No parts found</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Material Size</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Customer</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.material_type || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.material_size || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getJobName(p.job_id)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getCustomerForJob(p.job_id)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.status || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectPart && onSelectPart(p.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setEditing(p.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Edit
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
          <h2>Edit Part</h2>
          {parts.map(p => editing === p.id && (
            <div key={p.id}>
              <div style={{ marginBottom: '10px' }}>
                <label>Part Name: </label>
                <input value={p.name} onChange={(e) => { p.name = e.target.value; setParts([...parts]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Material Type: </label>
                <input value={p.material_type || ''} onChange={(e) => { p.material_type = e.target.value; setParts([...parts]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Material Size: </label>
                <input value={p.material_size || ''} onChange={(e) => { p.material_size = e.target.value; setParts([...parts]) }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Customer Filter: </label>
                <select value={editCustFilter} onChange={(e) => setEditCustFilter(e.target.value)}>
                  <option value="">All Customers</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Job: </label>
                <select value={p.job_id || ''} onChange={(e) => { p.job_id = e.target.value ? parseInt(e.target.value) : null; setParts([...parts]) }}>
                  <option value="">No Job</option>
                  {(editCustFilter ? jobs.filter(j => j.customer_id === parseInt(editCustFilter)) : jobs).map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Status: </label>
                <select value={p.status || 'pending'} onChange={(e) => { p.status = e.target.value; setParts([...parts]) }}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Upload Blueprint: </label>
                <input
                  type="file"
                  onChange={(e) => setFileByPart(prev => ({ ...prev, [p.id]: e.target.files[0] }))}
                />
                {fileByPart[p.id] && (
                  <button
                    onClick={() => uploadBlueprintFor(p.id)}
                    style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#00cc00', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Upload Blueprint
                  </button>
                )}
              </div>
              <button onClick={() => saveEdit(p.id)} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '8px' }}>
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
