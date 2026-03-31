import React, { useEffect, useState } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

const STATUS_COLORS = { running: '#28a745', hold: '#dc3545', ready: '#ffc107', 'needs-work': '#fd7e14', complete: '#0066cc' }
const STATUS_LABELS = { running: 'Running', hold: 'Hold', ready: 'Ready/Next', 'needs-work': 'Needs Work', complete: 'Complete' }
const statusBadgeStyle = (s) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', backgroundColor: STATUS_COLORS[s] || '#aaa', color: '#000', fontWeight: 'bold', fontSize: '12px' })
const statusLabel = (s) => STATUS_LABELS[s] || s || 'N/A'

export default function Jobs({ onSelectJob }) {
  const { accentColor, currentTheme } = useTheme()
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [parts, setParts] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [selectedParts, setSelectedParts] = useState([])
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [createDocFiles, setCreateDocFiles] = useState([])
  const [editDocFiles, setEditDocFiles] = useState([])
  const [editDocs, setEditDocs] = useState([])
  const [showArchive, setShowArchive] = useState(false)
  const [archivedJobs, setArchivedJobs] = useState([])
  const [createStatus, setCreateStatus] = useState('ready')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsRes, customersRes, partsRes] = await Promise.all([
        api.listJobs(),
        api.listCustomers(),
        api.listParts()
      ])
      setJobs(jobsRes)
      setCustomers(customersRes)
      setParts(partsRes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  async function submit(e) {
    e.preventDefault()
    try {
      const newJob = await api.createJob({ 
        name, 
        description: description || null,
        po_number: poNumber || null,
        customer_id: customerId ? parseInt(customerId) : null,
        status: createStatus
      })
      if (createDocFiles.length > 0) {
        for (const file of createDocFiles) {
          try { await api.uploadJobDocument(newJob.id, file) } catch (err) { console.error('Doc upload error:', err) }
        }
      }
      setName('')
      setDescription('')
      setPoNumber('')
      setCustomerId('')
      setSelectedParts([])
      setCreateDocFiles([])
      setCreateStatus('ready')
      loadData()
    } catch (err) {
      alert(`Error creating job: ${err}`)
    }
  }

  async function saveEdit(jobId) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const payload = { 
      name: job.name, 
      description: job.description, 
      customer_id: job.customer_id || null,
      due_date: job.due_date || null,
      status: job.status 
    }
    try {
      await api.updateJob(jobId, payload)
      if (editDocFiles.length > 0) {
        for (const file of editDocFiles) {
          try { await api.uploadJobDocument(jobId, file) } catch (err) { console.error('Doc upload error:', err) }
        }
      }
      setEditing(null)
      setEditDocFiles([])
      setEditDocs([])
      loadData()
    } catch (err) {
      alert(`Error updating job: ${err}`)
    }
  }

  async function openEdit(jobId) {
    setEditing(jobId)
    setEditDocFiles([])
    try {
      const docs = await api.listJobDocuments(jobId)
      setEditDocs(docs || [])
    } catch (err) {
      setEditDocs([])
    }
  }

  async function deleteEditDoc(docId) {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.deleteJobDocument(docId)
      setEditDocs(editDocs.filter(d => d.id !== docId))
    } catch (err) {
      alert(`Error deleting document: ${err}`)
    }
  }

  async function handleArchive(jobId) {
    if (!window.confirm('Archive this job?')) return
    try { await api.archiveJob(jobId); loadData() } catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDelete(jobId) {
    if (!window.confirm('Permanently delete this job? This cannot be undone.')) return
    try { await api.deleteJob(jobId); loadData() } catch (err) { alert(`Error: ${err}`) }
  }

  async function openArchive() {
    try { const res = await api.listArchivedJobs(); setArchivedJobs(res || []); setShowArchive(true) }
    catch (err) { alert(`Error loading archive: ${err}`) }
  }

  async function handleRestore(jobId) {
    try { await api.restoreJob(jobId); setArchivedJobs(archivedJobs.filter(j => j.id !== jobId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDeleteArchived(jobId) {
    if (!window.confirm('Permanently delete this job?')) return
    try { await api.deleteJob(jobId); setArchivedJobs(archivedJobs.filter(j => j.id !== jobId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  async function downloadEditDoc(doc) {
    try {
      const { url, filename } = await api.downloadJobDocument(doc.id, doc.filename)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      alert(`Download failed: ${err}`)
    }
  }

  const filteredJobs = jobs.filter(j =>
    j.name.toLowerCase().includes(filter.toLowerCase())
  )

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    return customer ? customer.name : 'N/A'
  }

  const boxStyle = { marginBottom: '30px', padding: '15px', border: '2px solid ' + accentColor, borderRadius: '5px', backgroundColor: currentTheme.bg }
  const inputStyle = { padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }
  const thStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }
  const tdStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }

  return (
    <div style={{ padding: '20px', color: currentTheme.text, backgroundColor: currentTheme.bg, minHeight: '100%' }}>
      <h1>Jobs</h1>

      {/* Add Job Form */}
      <div style={boxStyle}>
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
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Description: </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job description"
              style={{ ...inputStyle, width: '100%', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>PO#: </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Purchase Order number"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Customer: </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Customer (optional)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Status: </label>
            <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} style={inputStyle}>
              <option value="running">Running</option>
              <option value="hold">Hold</option>
              <option value="ready">Ready/Next</option>
              <option value="needs-work">Needs Work</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>PO Documents: </label>
            <input
              type="file"
              multiple
              onChange={(e) => setCreateDocFiles(Array.from(e.target.files))}
            />
            {createDocFiles.length > 0 && <span style={{ marginLeft: '8px', fontSize: '13px', color: currentTheme.text }}>{createDocFiles.length} file(s) selected</span>}
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
          style={{ ...inputStyle, width: '100%', padding: '8px' }}
        />
      </div>

      {/* Jobs Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>All Jobs ({filteredJobs.length})</h2>
        <button onClick={openArchive} style={{ padding: '6px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View Archive</button>
      </div>
      {filteredJobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Job Name</th>
              <th style={thStyle}># of Parts</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(j => (
              <tr key={j.id} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.bg}>
                <td style={tdStyle}>{j.name}</td>
                <td style={tdStyle}>{parts.filter(p => p.job_id === j.id).length}</td>
                <td style={tdStyle}>{getCustomerName(j.customer_id)}</td>
                <td style={tdStyle}>{j.due_date ? new Date(j.due_date).toLocaleDateString() : 'N/A'}</td>
                <td style={tdStyle}><span style={statusBadgeStyle(j.status)}>{statusLabel(j.status)}</span></td>
                <td style={tdStyle}>{j.created_at ? new Date(j.created_at).toLocaleDateString() : 'N/A'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => onSelectJob && onSelectJob(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => openEdit(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#ff9900', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editing && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #ff9900', borderRadius: '5px', backgroundColor: currentTheme.hover, color: currentTheme.text }}>
          <h2>Edit Job</h2>
          {jobs.map(j => editing === j.id && (
            <div key={j.id}>
              <div style={{ marginBottom: '10px' }}>
                <label>Job Name: </label>
                <input value={j.name} onChange={(e) => { j.name = e.target.value; setJobs([...jobs]) }} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Customer: </label>
                <select value={j.customer_id || ''} onChange={(e) => { j.customer_id = e.target.value ? parseInt(e.target.value) : null; setJobs([...jobs]) }} style={inputStyle}>
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Due Date: </label>
                <input type="date" value={j.due_date || ''} onChange={(e) => { j.due_date = e.target.value || null; setJobs([...jobs]) }} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Status: </label>
                <select value={j.status || ''} onChange={(e) => { j.status = e.target.value; setJobs([...jobs]) }} style={inputStyle}>
                  <option value="running">Running</option>
                  <option value="hold">Hold</option>
                  <option value="ready">Ready/Next</option>
                  <option value="needs-work">Needs Work</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Upload PO Documents:</label>
                <input type="file" multiple onChange={(e) => setEditDocFiles(Array.from(e.target.files))} />
                {editDocFiles.length > 0 && <span style={{ marginLeft: '8px', fontSize: '13px', color: currentTheme.text }}>{editDocFiles.length} file(s) selected</span>}
              </div>
              {editDocs.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Existing Documents ({editDocs.length}):</label>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                      <th style={thStyle}>Filename</th>
                      <th style={thStyle}>Uploaded</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                      {editDocs.map(doc => (
                        <tr key={doc.id}>
                          <td style={tdStyle}>{doc.filename}</td>
                          <td style={tdStyle}>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button onClick={() => downloadEditDoc(doc)} style={{ padding: '3px 8px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Download</button>
                            <button onClick={() => deleteEditDoc(doc.id)} style={{ padding: '3px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button onClick={() => saveEdit(j.id)} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '8px' }}>
                Save
              </button>
              <button onClick={() => { setEditing(null); setEditDocFiles([]); setEditDocs([]) }} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Archive Modal */}
      {showArchive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, borderRadius: '8px', padding: '24px', width: '75%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid ' + currentTheme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Archived Jobs ({archivedJobs.length})</h2>
              <button onClick={() => setShowArchive(false)} style={{ padding: '6px 14px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Close</button>
            </div>
            {archivedJobs.length === 0 ? <p>No archived jobs</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Job Name</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedJobs.map(j => (
                    <tr key={j.id}>
                      <td style={tdStyle}>{j.name}</td>
                      <td style={tdStyle}>{getCustomerName(j.customer_id)}</td>
                      <td style={tdStyle}><span style={statusBadgeStyle(j.status)}>{statusLabel(j.status)}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button onClick={() => handleRestore(j.id)} style={{ padding: '4px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}>Restore</button>
                        <button onClick={() => handleDeleteArchived(j.id)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
