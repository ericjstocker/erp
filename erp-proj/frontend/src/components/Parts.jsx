import React, { useEffect, useState } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

export default function Parts({ onSelectPart }) {
  const { accentColor, currentTheme } = useTheme()
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

  const th = { border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }
  const td = { border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }
  const btn = (color, mr) => ({ padding: '5px 10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: mr || '4px' })
  const matRow = { marginBottom: '8px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px', alignItems: 'center' }

  return (
    <div style={{ padding: '20px', color: currentTheme.text, backgroundColor: currentTheme.bg, minHeight: '100%' }}>
      <h1>Parts</h1>

      {/* Create New Part */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid ' + accentColor, borderRadius: '5px', backgroundColor: currentTheme.bg }}>
        <h2>Create New Part</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Part Name *: </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Part name" required style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }} />
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
              <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
                <option value="">Select Material (optional)</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}{m.material_type ? ` — ${m.material_type}` : ''}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid ' + accentColor, marginBottom: '12px', padding: '10px 10px 10px 14px', backgroundColor: currentTheme.hover }}>
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
                    style={{ padding: '5px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', fontSize: '13px', backgroundColor: currentTheme.input, color: currentTheme.text, fontFamily: 'inherit' }}
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
            <select value={createCustFilter} onChange={(e) => { setCreateCustFilter(e.target.value); setJobId('') }} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Job: </label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
              <option value="">Select Job (optional)</option>
              {(createCustFilter ? jobs.filter(j => j.customer_id === parseInt(createCustFilter)) : jobs).map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Status: </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Blueprints (optional): </label>
            <input type="file" multiple accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.svg,.doc,.docx" onChange={(e) => setCreateBlueprintFiles(Array.from(e.target.files))} />
            {createBlueprintFiles.length > 0 && (
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: currentTheme.text }}>
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
        <input type="text" placeholder="Search parts..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, boxSizing: 'border-box' }} />
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
                <th style={th}>Material Shape</th>
                <th style={th}>Quantity</th>
                <th style={th}>Job</th>
                <th style={th}>Customer</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(p => (
                <tr key={p.id} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.bg}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{getMaterialName(p.material_id)}</td>
                  <td style={td}>{getMaterialShape(p.material_id)}</td>
                  <td style={td}>{p.quantity != null ? p.quantity : 'N/A'}</td>
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
          <div style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, borderRadius: '8px', padding: '24px', width: '75%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid ' + currentTheme.border }}>
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
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #ff9900', borderRadius: '5px', backgroundColor: currentTheme.hover, color: currentTheme.text }}>
          <h2>Edit Part</h2>
          {parts.map(p => editing === p.id && (
            <div key={p.id}>
              <div style={{ marginBottom: '10px' }}>
                <label>Part Name: </label>
                <input value={p.name} onChange={(e) => { p.name = e.target.value; setParts([...parts]) }} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Material: </label>
                <select value={p.material_id || ''} onChange={(e) => { p.material_id = e.target.value ? parseInt(e.target.value) : null; setParts([...parts]) }} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
                  <option value="">No Material</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}{m.material_type ? ` — ${m.material_type}` : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Customer Filter: </label>
                <select value={editCustFilter} onChange={(e) => setEditCustFilter(e.target.value)} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
                  <option value="">All Customers</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Job: </label>
                <select value={p.job_id || ''} onChange={(e) => { p.job_id = e.target.value ? parseInt(e.target.value) : null; setParts([...parts]) }} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
                  <option value="">No Job</option>
                  {(editCustFilter ? jobs.filter(j => j.customer_id === parseInt(editCustFilter)) : jobs).map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Status: </label>
                <select value={p.status || 'pending'} onChange={(e) => { p.status = e.target.value; setParts([...parts]) }} style={{ padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text }}>
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
