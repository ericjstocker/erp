import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Parts({ onSelectPart }) {
  const [parts, setParts] = useState([])
  const [jobs, setJobs] = useState([])
  const [materials, setMaterials] = useState([])
  const [name, setName] = useState('')
  const [jobId, setJobId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [status, setStatus] = useState('pending')
  const [createBlueprintFiles, setCreateBlueprintFiles] = useState([])
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [fileByPart, setFileByPart] = useState({})
  const [customers, setCustomers] = useState([])
  const [createCustFilter, setCreateCustFilter] = useState('')
  const [editCustFilter, setEditCustFilter] = useState('')

  // New material fields for create form
  const [newMaterialForCreate, setNewMaterialForCreate] = useState(false)
  const [createMatData, setCreateMatData] = useState({ name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' })
  const [createMatPOFile, setCreateMatPOFile] = useState(null)
  const [savingMaterial, setSavingMaterial] = useState(false)

  // Archive view
  const [showArchive, setShowArchive] = useState(false)
  const [archivedParts, setArchivedParts] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [partsRes, jobsRes, materialsRes, customersRes] = await Promise.all([
        api.listParts(), api.listJobs(), api.listMaterials(), api.listCustomers()
      ])
      setParts(partsRes)
      setJobs(jobsRes)
      setMaterials(materialsRes)
      setCustomers(customersRes)
    } catch (err) { console.error('Error loading data:', err) }
  }

  const resetCreateMatData = () => setCreateMatData({ name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' })

  const handleSubmitNewMaterial = async () => {
    if (!createMatData.name) { alert('Material name is required'); return }
    setSavingMaterial(true)
    try {
      const matRes = await api.createMaterial(createMatData)
      if (createMatPOFile) {
        try { await api.uploadMaterialPO(matRes.id, createMatPOFile) } catch (err) { console.error('Material PO upload error:', err) }
      }
      setMaterials(prev => [...prev, matRes])
      setMaterialId(String(matRes.id))
      setNewMaterialForCreate(false)
      resetCreateMatData()
      setCreateMatPOFile(null)
    } catch (err) { alert(`Error creating material: ${err}`) }
    setSavingMaterial(false)
  }

  async function submit(e) {
    e.preventDefault()
    try {
      const created = await api.createPart({
        name,
        job_id: jobId || null,
        material_id: materialId ? parseInt(materialId) : null,
        status
      })
      for (const file of createBlueprintFiles) {
        try { await api.uploadBlueprint(created.id, file) } catch (err) { alert(`Blueprint upload failed for ${file.name}: ${err}`) }
      }
      setName(''); setJobId(''); setMaterialId(''); setStatus('pending')
      setCreateBlueprintFiles([]); setNewMaterialForCreate(false)
      resetCreateMatData(); setCreateMatPOFile(null)
      loadData()
    } catch (err) { alert(`Error creating part: ${err}`) }
  }

  async function saveEdit(partId) {
    const part = parts.find(p => p.id === partId)
    if (!part) return
    try {
      await api.updatePart(partId, { name: part.name, job_id: part.job_id, material_id: part.material_id, status: part.status })
      if (fileByPart[partId]?.length > 0) {
        for (const file of fileByPart[partId]) {
          try { await api.uploadBlueprint(partId, file) } catch (err) { console.error(err) }
        }
        setFileByPart(prev => ({ ...prev, [partId]: [] }))
      }
      setEditing(null)
      loadData()
    } catch (err) { alert(`Error updating part: ${err}`) }
  }

  async function uploadBlueprintFor(partId) {
    const files = fileByPart[partId]
    if (!files?.length) { alert('Select file(s) first'); return }
    try {
      for (const file of files) { await api.uploadBlueprint(partId, file) }
      setFileByPart(prev => ({ ...prev, [partId]: [] }))
      loadData()
      alert(`${files.length} blueprint(s) uploaded successfully`)
    } catch (err) { alert(`Error uploading blueprint: ${err}`) }
  }

  async function handleArchive(partId) {
    if (!window.confirm('Archive this part?')) return
    try { await api.archivePart(partId); loadData() } catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDelete(partId) {
    if (!window.confirm('Permanently delete this part? This cannot be undone.')) return
    try { await api.deletePart(partId); loadData() } catch (err) { alert(`Error: ${err}`) }
  }

  async function openArchive() {
    try { const res = await api.listArchivedParts(); setArchivedParts(res || []); setShowArchive(true) }
    catch (err) { alert(`Error loading archive: ${err}`) }
  }

  async function handleRestore(partId) {
    try { await api.restorePart(partId); setArchivedParts(archivedParts.filter(p => p.id !== partId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDeleteArchived(partId) {
    if (!window.confirm('Permanently delete this part?')) return
    try { await api.deletePart(partId); setArchivedParts(archivedParts.filter(p => p.id !== partId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  const filteredParts = parts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
  const getMaterialName = (matId) => { const m = materials.find(m => m.id === matId); return m ? m.name : 'N/A' }
  const getMaterialShape = (matId) => { const m = materials.find(m => m.id === matId); return m ? (m.shape || 'N/A') : 'N/A' }
  const getJobName = (jId) => { const j = jobs.find(j => j.id === jId); return j ? j.name : 'N/A' }
  const getCustomerForJob = (jId) => {
    const j = jobs.find(j => j.id === jId)
    if (!j?.customer_id) return 'N/A'
    const c = customers.find(c => c.id === j.customer_id)
    return c ? c.name : 'N/A'
  }

  const th = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f0f0f0' }
  const td = { border: '1px solid #ddd', padding: '8px' }
  const btn = (color, mr) => ({ padding: '5px 10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: mr || '4px' })
  const matRow = { marginBottom: '8px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', alignItems: 'center' }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Parts</h1>

      {/* Create New Part */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Create New Part</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Part Name *: </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Part name" required />
          </div>

          {/* New Material? checkbox */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="checkbox" checked={newMaterialForCreate}
                onChange={(e) => { setNewMaterialForCreate(e.target.checked); if (!e.target.checked) { resetCreateMatData(); setCreateMatPOFile(null) } }}
                style={{ marginRight: '8px' }}
              />
              New Material?
            </label>
          </div>

          {!newMaterialForCreate ? (
            <div style={{ marginBottom: '10px' }}>
              <label>Material: </label>
              <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                <option value="">Select Material (optional)</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}{m.material_type ? ` — ${m.material_type}` : ''}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid #0066cc', marginBottom: '12px', padding: '10px 10px 10px 14px', backgroundColor: '#f8f9ff' }}>
              {[
                ['Material Name *', 'name', 'e.g., Steel Sheet'],
                ['Material Type', 'material_type', 'e.g., Carbon Steel'],
                ['Shape', 'shape', 'e.g., Round Bar, Sheet'],
                ['Diameter', 'diameter', 'e.g., 1.5in'],
                ['Length', 'length', 'e.g., 12ft'],
                ['Width', 'width', 'e.g., 24in'],
                ['Height', 'height', 'e.g., 0.25in'],
                ['Purchase Location', 'purchase_location', 'Where purchased'],
              ].map(([label, field, placeholder]) => (
                <div key={field} style={matRow}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px' }}>{label}:</label>
                  <input
                    type="text" placeholder={placeholder} value={createMatData[field]}
                    onChange={(e) => setCreateMatData({ ...createMatData, [field]: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '13px' }}
                  />
                </div>
              ))}
              <div style={matRow}>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Upload Material PO:</label>
                <input type="file" onChange={(e) => setCreateMatPOFile(e.target.files?.[0] || null)} />
              </div>
              <button
                type="button" onClick={handleSubmitNewMaterial} disabled={savingMaterial || !createMatData.name}
                style={{ marginTop: '8px', padding: '7px 16px', backgroundColor: savingMaterial || !createMatData.name ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: savingMaterial || !createMatData.name ? 'default' : 'pointer' }}
              >
                {savingMaterial ? 'Saving...' : 'Submit New Material'}
              </button>
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label>Customer: </label>
            <select value={createCustFilter} onChange={(e) => { setCreateCustFilter(e.target.value); setJobId('') }}>
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Job: </label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">Select Job (optional)</option>
              {(createCustFilter ? jobs.filter(j => j.customer_id === parseInt(createCustFilter)) : jobs).map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
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
          <div style={{ marginBottom: '10px' }}>
            <label>Blueprints (optional): </label>
            <input type="file" multiple accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx" onChange={(e) => setCreateBlueprintFiles(Array.from(e.target.files))} />
            {createBlueprintFiles.length > 0 && (
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: '#555' }}>
                {createBlueprintFiles.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Create Part
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="Search parts..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px' }} />
      </div>

      {/* List header with View Archive button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>All Parts ({filteredParts.length})</h2>
        <button onClick={openArchive} style={{ padding: '6px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          View Archive
        </button>
      </div>

      {filteredParts.length === 0 ? (
        <p>No parts found</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Part Name</th>
                <th style={th}>Material Name</th>
                <th style={th}>Shape</th>
                <th style={th}>Job</th>
                <th style={th}>Customer</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(p => (
                <tr key={p.id} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{getMaterialName(p.material_id)}</td>
                  <td style={td}>{getMaterialShape(p.material_id)}</td>
                  <td style={td}>{getJobName(p.job_id)}</td>
                  <td style={td}>{getCustomerForJob(p.job_id)}</td>
                  <td style={td}>{p.status || 'N/A'}</td>
                  <td style={td}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => onSelectPart && onSelectPart(p.id)} style={btn('#0066cc')}>View Details</button>
                    <button onClick={() => setEditing(p.id)} style={btn('#ff9900')}>Edit</button>
                    <button onClick={() => handleArchive(p.id)} style={btn('#6c757d')}>Archive</button>
                    <button onClick={() => handleDelete(p.id)} style={btn('#dc3545', '0')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Archive modal */}
      {showArchive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '75%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Archived Parts ({archivedParts.length})</h2>
              <button onClick={() => setShowArchive(false)} style={{ padding: '6px 14px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Close</button>
            </div>
            {archivedParts.length === 0 ? <p>No archived parts</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Part Name</th>
                    <th style={th}>Material</th>
                    <th style={th}>Status</th>
                    <th style={{ ...th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedParts.map(p => (
                    <tr key={p.id}>
                      <td style={td}>{p.name}</td>
                      <td style={td}>{getMaterialName(p.material_id)}</td>
                      <td style={td}>{p.status}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button onClick={() => handleRestore(p.id)} style={btn('#28a745')}>Restore</button>
                        <button onClick={() => handleDeleteArchived(p.id)} style={btn('#dc3545', '0')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Edit Part */}
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
                <label>Material: </label>
                <select value={p.material_id || ''} onChange={(e) => { p.material_id = e.target.value ? parseInt(e.target.value) : null; setParts([...parts]) }}>
                  <option value="">No Material</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}{m.material_type ? ` — ${m.material_type}` : ''}</option>)}
                </select>
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
                <label>Upload Blueprints: </label>
                <input type="file" multiple accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx" onChange={(e) => setFileByPart(prev => ({ ...prev, [p.id]: Array.from(e.target.files) }))} />
                {fileByPart[p.id]?.length > 0 && (
                  <button onClick={() => uploadBlueprintFor(p.id)} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#00cc00', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                    Upload {fileByPart[p.id].length} File(s)
                  </button>
                )}
              </div>
              <button onClick={() => saveEdit(p.id)} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '8px' }}>Save</button>
              <button onClick={() => setEditing(null)} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

  const [status, setStatus] = useState('pending')
  const [createBlueprintFiles, setCreateBlueprintFiles] = useState([])
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
      const created = await api.createPart({
        name,
        job_id: jobId || null,
        material_id: materialId || null,
        material_type: materialType || null,
        material_size: materialSize || null,
        status
      })
      // upload any blueprint files selected during creation
      for (const file of createBlueprintFiles) {
        try {
          await api.uploadBlueprint(created.id, file)
        } catch (err) {
          alert(`Warning: part created but blueprint upload failed for ${file.name}: ${err}`)
        }
      }
      setName('')
      setJobId('')
      setMaterialId('')
      setMaterialType('')
      setMaterialSize('')
      setStatus('pending')
      setCreateBlueprintFiles([])
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
    const files = fileByPart[partId]
    if (!files || files.length === 0) {
      alert('Select file(s) first')
      return
    }
    try {
      for (const file of files) {
        await api.uploadBlueprint(partId, file)
      }
      setFileByPart(prev => ({ ...prev, [partId]: [] }))
      loadData()
      alert(`${files.length} blueprint(s) uploaded successfully`)
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
          <div style={{ marginBottom: '10px' }}>
            <label>Blueprints (optional): </label>
            <input
              type="file"
              multiple
              accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx"
              onChange={(e) => setCreateBlueprintFiles(Array.from(e.target.files))}
            />
            {createBlueprintFiles.length > 0 && (
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: '#555' }}>
                {createBlueprintFiles.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            )}
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
                <label>Upload Blueprints: </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx"
                  onChange={(e) => setFileByPart(prev => ({ ...prev, [p.id]: Array.from(e.target.files) }))}
                />
                {fileByPart[p.id] && fileByPart[p.id].length > 0 && (
                  <button
                    onClick={() => uploadBlueprintFor(p.id)}
                    style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#00cc00', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Upload {fileByPart[p.id].length} File(s)
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
