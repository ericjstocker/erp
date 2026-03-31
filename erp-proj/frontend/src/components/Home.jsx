import React, { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

export default function Home({ onSelectJob }) {
  const { accentColor, currentTheme } = useTheme()
  const [activeJobs, setActiveJobs] = useState([])
  const [existingJobs, setExistingJobs] = useState([])
  const [existingCustomers, setExistingCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  
  // Form state
  const [newCustomer, setNewCustomer] = useState(false)
  const [newJob, setNewJob] = useState(false)
  
  const [customerData, setCustomerData] = useState({
    id: '',
    name: '',
    point_of_contact: '',
    phone_number: '',
    email: '',
    notes: ''
  })
  
  const [jobData, setJobData] = useState({
    id: '',
    name: '',
    description: '',
    dueDate: '',
    receivedDate: '',
    poNumber: ''
  })
  
  const [parts, setParts] = useState([{ name: '', status: 'pending', blueprint: null, newMaterial: false, materialId: '', newMaterialData: { name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' }, newMaterialPOFile: null }])
  const [jobPOFiles, setJobPOFiles] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsRes, customersRes, materialsRes] = await Promise.all([
        api.listJobs(),
        api.listCustomers(),
        api.listMaterials()
      ])
      setExistingJobs(jobsRes)
      setActiveJobs(jobsRes.filter(j => j.status !== 'finished'))
      setExistingCustomers(customersRes)
      setMaterials(materialsRes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const emptyPart = () => ({ name: '', status: 'pending', blueprint: null, newMaterial: false, materialId: '', newMaterialData: { name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' }, newMaterialPOFile: null })

  const handlePartChange = (index, field, value) => {
    const newParts = [...parts]
    newParts[index] = { ...newParts[index], [field]: value }
    if (index === parts.length - 1 && field === 'name' && value) {
      newParts.push(emptyPart())
    }
    setParts(newParts)
  }

  const handlePartMaterialChange = (index, field, value) => {
    const newParts = [...parts]
    newParts[index] = { ...newParts[index], newMaterialData: { ...newParts[index].newMaterialData, [field]: value } }
    setParts(newParts)
  }

  const handleSubmitNewMaterialForPart = async (index) => {
    const part = parts[index]
    if (!part.newMaterialData.name) { setMessage('Material name is required'); return }
    try {
      const matRes = await api.createMaterial({
        name: part.newMaterialData.name,
        material_type: part.newMaterialData.material_type,
        shape: part.newMaterialData.shape,
        diameter: part.newMaterialData.diameter,
        length: part.newMaterialData.length,
        width: part.newMaterialData.width,
        height: part.newMaterialData.height,
        purchase_location: part.newMaterialData.purchase_location
      })
      if (part.newMaterialPOFile) {
        try { await api.uploadMaterialPO(matRes.id, part.newMaterialPOFile) } catch (err) { console.error('Material PO upload error:', err) }
      }
      // Add to materials list and switch part to dropdown with new material selected
      setMaterials(prev => [...prev, matRes])
      const newParts = [...parts]
      newParts[index] = {
        ...newParts[index],
        newMaterial: false,
        materialId: String(matRes.id),
        newMaterialData: { name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' },
        newMaterialPOFile: null
      }
      setParts(newParts)
      setMessage(`Material "${matRes.name}" saved successfully!`)
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage(`Error saving material: ${err.message}`)
    }
  }

  const submitForm = async () => {
    try {
      let customerId = customerData.id
      
      // Create new customer if needed
      if (newCustomer) {
        if (!customerData.name) {
          setMessage('Customer name is required')
          return
        }
        const customerRes = await api.createCustomer({
          name: customerData.name,
          point_of_contact: customerData.point_of_contact,
          phone_number: customerData.phone_number,
          email: customerData.email,
          notes: customerData.notes
        })
        customerId = customerRes.id
      } else {
        if (!customerId) {
          setMessage('Please select a customer')
          return
        }
      }

      let jobId
      
      // Create new job or use existing
      if (newJob) {
        if (!jobData.name) {
          setMessage('Job name is required')
          return
        }
        const jobRes = await api.createJob({
          name: jobData.name,
          description: jobData.description,
          customer_id: customerId,
          due_date: jobData.dueDate || null,
          received_date: jobData.receivedDate || null,
          status: 'queued'
        })
        jobId = jobRes.id
      } else {
        if (!jobData.id) {
          setMessage('Please select a job')
          return
        }
        jobId = jobData.id
      }

      // Upload job PO files
      for (const file of jobPOFiles) {
        try { await api.uploadJobDocument(jobId, file) } catch (err) { console.error('Job PO upload error:', err) }
      }

      // Create parts
      for (const part of parts.filter(p => p.name)) {
        let materialId = null
        if (part.newMaterial && part.newMaterialData.name) {
          const matRes = await api.createMaterial({
            name: part.newMaterialData.name,
            material_type: part.newMaterialData.material_type,
            shape: part.newMaterialData.shape,
            diameter: part.newMaterialData.diameter,
            length: part.newMaterialData.length,
            width: part.newMaterialData.width,
            height: part.newMaterialData.height,
            purchase_location: part.newMaterialData.purchase_location
          })
          materialId = matRes.id
          if (part.newMaterialPOFile) {
            try { await api.uploadMaterialPO(materialId, part.newMaterialPOFile) } catch (err) { console.error('Material PO upload error:', err) }
          }
        } else if (!part.newMaterial && part.materialId) {
          materialId = parseInt(part.materialId)
        }
        const partRes = await api.createPart({
          job_id: jobId,
          name: part.name,
          material_id: materialId,
          status: part.status
        })

        if (part.blueprint) {
          try {
            await api.uploadBlueprint(partRes.id, part.blueprint)
          } catch (err) {
            console.error('Error uploading blueprint:', err)
          }
        }
      }

      setMessage('Job and parts created successfully!')
      setTimeout(() => {
        setNewCustomer(false)
        setNewJob(false)
        setCustomerData({ id: '', name: '', point_of_contact: '', phone_number: '', email: '', notes: '' })
        setJobData({ id: '', name: '', description: '', dueDate: '', receivedDate: '', poNumber: '' })
        setParts([{ name: '', status: 'pending', blueprint: null, newMaterial: false, materialId: '', newMaterialData: { name: '', material_type: '', shape: '', diameter: '', length: '', width: '', height: '', purchase_location: '' }, newMaterialPOFile: null }])
        setJobPOFiles([])
        loadData()
      }, 1500)
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const boxStyle = {
    border: `2px solid ${accentColor}`,
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: currentTheme.bg,
    marginBottom: '20px'
  }

  const inputStyle = {
    padding: '8px',
    border: `1px solid ${accentColor}`,
    borderRadius: '4px',
    backgroundColor: currentTheme.input,
    color: currentTheme.text,
    fontFamily: 'inherit',
    fontSize: '14px'
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'auto',
    cursor: 'pointer'
  }

  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: accentColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
  }

  return (
    <div style={{ padding: '20px', color: currentTheme.text }}>
      <h2>Dashboard</h2>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#ffcccc' : '#ccffcc',
          border: '1px solid gray',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* New Job/Part Form */}
      <div style={boxStyle}>
        <h3>New Job / Add Parts</h3>

        {/* Customer Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newCustomer}
              onChange={(e) => {
                setNewCustomer(e.target.checked)
                if (!e.target.checked) {
                  setCustomerData({ id: '', name: '', point_of_contact: '', phone_number: '', email: '', notes: '' })
                }
              }}
              style={{ marginRight: '10px', cursor: 'pointer' }}
            />
            <span>New customer?</span>
          </label>

          {!newCustomer ? (
            <select
              value={customerData.id}
              onChange={(e) => {
                const customer = existingCustomers.find(c => c.id.toString() === e.target.value)
                setCustomerData(customer ? { ...customer } : { id: '', name: '', point_of_contact: '', phone_number: '', email: '', notes: '' })
              }}
              style={selectStyle}
            >
              <option value="">Select Customer</option>
              {existingCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Customer Name:</label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Point of Contact:</label>
                <input
                  type="text"
                  placeholder="Contact Person Name"
                  value={customerData.point_of_contact}
                  onChange={(e) => setCustomerData({ ...customerData, point_of_contact: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Phone Number:</label>
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={customerData.phone_number}
                  onChange={(e) => setCustomerData({ ...customerData, phone_number: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Email:</label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Notes:</label>
                <textarea
                  placeholder="Customer Notes"
                  value={customerData.notes}
                  onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Job Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newJob}
              onChange={(e) => {
                setNewJob(e.target.checked)
                if (!e.target.checked) {
                  setJobData({ id: '', name: '', description: '', dueDate: '', receivedDate: '', poNumber: '' })
                }
              }}
              style={{ marginRight: '10px', cursor: 'pointer' }}
            />
            <span>New Job?</span>
          </label>

          {!newJob ? (
            <select
              value={jobData.id}
              onChange={(e) => {
                const job = existingJobs.find(j => j.id.toString() === e.target.value)
                setJobData(job ? { ...job, id: job.id } : { id: '', name: '', description: '', dueDate: '', receivedDate: '', poNumber: '' })
              }}
              style={selectStyle}
            >
              <option value="">Select Job</option>
              {activeJobs.map(j => (
                <option key={j.id} value={j.id}>{j.id} - {j.name}</option>
              ))}
            </select>
          ) : (
            <>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Job Name:</label>
                <input
                  type="text"
                  placeholder="Job Name"
                  value={jobData.name}
                  onChange={(e) => setJobData({ ...jobData, name: e.target.value })}
                  style={{...inputStyle, width: '100%'}}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description:</label>
                <textarea
                  placeholder="Description"
                  value={jobData.description}
                  onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Due Date:</label>
                <input
                  type="date"
                  value={jobData.dueDate}
                  onChange={(e) => setJobData({ ...jobData, dueDate: e.target.value })}
                  style={{...inputStyle, width: '100%'}}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Received Date:</label>
                <input
                  type="date"
                  value={jobData.receivedDate}
                  onChange={(e) => setJobData({ ...jobData, receivedDate: e.target.value })}
                  style={{...inputStyle, width: '100%'}}
                />
              </div>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>PO Number:</label>
                <input
                  type="text"
                  placeholder="PO Number"
                  value={jobData.poNumber}
                  onChange={(e) => setJobData({ ...jobData, poNumber: e.target.value })}
                  style={{...inputStyle, width: '100%'}}
                />
              </div>
            </>
          )}
        </div>

        {/* Job PO Upload */}
        <div style={{ marginBottom: '20px', padding: '12px', border: `1px dashed ${accentColor}`, borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Upload Job PO(s):</label>
          <input
            type="file"
            multiple
            onChange={(e) => setJobPOFiles(Array.from(e.target.files))}
            style={{ marginBottom: '4px' }}
          />
          {jobPOFiles.length > 0 && <span style={{ fontSize: '13px', color: '#555' }}>{jobPOFiles.length} file(s) selected</span>}
        </div>

        {/* Parts Section */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginTop: '0' }}>Parts</h4>
          {parts.map((part, index) => (
            <div key={index} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: `1px solid ${accentColor}` }}>
              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Part Name:</label>
                <input
                  type="text"
                  placeholder="Part Name"
                  value={part.name}
                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                  style={{...inputStyle, width: '100%'}}
                />
              </div>

              {/* New Material? checkbox */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={part.newMaterial}
                    onChange={(e) => handlePartChange(index, 'newMaterial', e.target.checked)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <span>New Material?</span>
                </label>
              </div>

              {!part.newMaterial ? (
                <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Material:</label>
                  <select
                    value={part.materialId}
                    onChange={(e) => handlePartChange(index, 'materialId', e.target.value)}
                    style={{...selectStyle, width: '100%'}}
                  >
                    <option value="">Select Material (optional)</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}{m.material_type ? ` — ${m.material_type}` : ''}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ paddingLeft: '12px', borderLeft: `3px solid ${accentColor}`, marginBottom: '10px' }}>
                  {[
                    ['Material Name *', 'name', 'text', 'e.g., Steel Sheet'],
                    ['Material Type', 'material_type', 'text', 'e.g., Carbon Steel'],
                    ['Shape', 'shape', 'text', 'e.g., Round Bar, Sheet'],
                    ['Diameter', 'diameter', 'text', 'e.g., 1.5in'],
                    ['Length', 'length', 'text', 'e.g., 12ft'],
                    ['Width', 'width', 'text', 'e.g., 24in'],
                    ['Height', 'height', 'text', 'e.g., 0.25in'],
                    ['Purchase Location', 'purchase_location', 'text', 'Where purchased'],
                  ].map(([label, field, type, placeholder]) => (
                    <div key={field} style={{ marginBottom: '8px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '13px' }}>{label}:</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={part.newMaterialData[field]}
                        onChange={(e) => handlePartMaterialChange(index, field, e.target.value)}
                        style={{...inputStyle, width: '100%'}}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: '8px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Upload Material PO:</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const newParts = [...parts]
                        newParts[index] = { ...newParts[index], newMaterialPOFile: e.target.files?.[0] || null }
                        setParts(newParts)
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmitNewMaterialForPart(index)}
                    disabled={!part.newMaterialData.name}
                    style={{ marginTop: '8px', padding: '7px 16px', backgroundColor: !part.newMaterialData.name ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: !part.newMaterialData.name ? 'default' : 'pointer', fontSize: '13px' }}
                  >
                    Submit New Material
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Status:</label>
                <select
                  value={part.status}
                  onChange={(e) => handlePartChange(index, 'status', e.target.value)}
                  style={{...selectStyle, width: '100%'}}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <label style={{ display: 'block', marginTop: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Blueprint:</span>
                <input
                  type="file"
                  onChange={(e) => {
                    const newParts = [...parts]
                    newParts[index] = { ...newParts[index], blueprint: e.target.files?.[0] || null }
                    setParts(newParts)
                  }}
                  style={{ marginLeft: '8px' }}
                />
              </label>
            </div>
          ))}
        </div>

        <button onClick={submitForm} style={buttonStyle}>
          Submit
        </button>
      </div>

      {/* Active Jobs List */}
      <div style={{ marginTop: '20px' }}>
        <h3>Active Jobs</h3>
        {activeJobs.length === 0 ? (
          <p>No active jobs</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: currentTheme.hover }}>
                <th style={{ border: `1px solid ${accentColor}`, padding: '8px', textAlign: 'left' }}>ID</th>
                <th style={{ border: `1px solid ${accentColor}`, padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: `1px solid ${accentColor}`, padding: '8px', textAlign: 'left' }}>Customer</th>
                <th style={{ border: `1px solid ${accentColor}`, padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: `1px solid ${accentColor}`, padding: '8px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ border: `1px solid ${accentColor}`, padding: '8px' }}>{job.id}</td>
                  <td style={{ border: `1px solid ${accentColor}`, padding: '8px' }}>{job.name}</td>
                  <td style={{ border: `1px solid ${accentColor}`, padding: '8px' }}>{job.customer_id}</td>
                  <td style={{ border: `1px solid ${accentColor}`, padding: '8px' }}>{job.status}</td>
                  <td style={{ border: `1px solid ${accentColor}`, padding: '8px' }}>
                    <button onClick={() => onSelectJob(job.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
