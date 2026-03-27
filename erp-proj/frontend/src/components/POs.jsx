import React, { useEffect, useState } from 'react'
import api from '../api'

export default function POs(){
  const [pos, setPos] = useState([])
  const [jobs, setJobs] = useState([])
  const [poNumber, setPoNumber] = useState('')
  const [vendor, setVendor] = useState('')
  const [jobId, setJobId] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(()=>{ loadData() }, [])

  const loadData = async () => {
    try {
      const [posRes, jobsRes] = await Promise.all([
        api.listPOs(),
        api.listJobs()
      ])
      setPos(posRes)
      setJobs(jobsRes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  async function submit(e){
    e.preventDefault()
    try{
      await api.createPO({ po_number: poNumber, vendor, job_id: jobId ? parseInt(jobId) : null })
      await loadData()
      setPoNumber('')
      setVendor('')
      setJobId('')
    }catch(err){ alert(err) }
  }

  async function saveEdit(poId){
    const p = pos.find(x=>x.id===poId)
    if(!p) return
    const payload = { po_number: p.po_number, vendor: p.vendor, job_id: p.job_id }
    await api.updatePO(poId, payload)
    setEditing(null)
    await loadData()
  }

  return (
    <div>
      <h2>Purchase Orders</h2>
      <div style={{ marginBottom: 8 }}>
        <input placeholder="Search POs" value={filter} onChange={e=>setFilter(e.target.value)} />
      </div>
      <form onSubmit={submit} style={{ marginBottom: 12 }}>
        <input placeholder="PO number" value={poNumber} onChange={e=>setPoNumber(e.target.value)} required />{' '}
        <input placeholder="Vendor" value={vendor} onChange={e=>setVendor(e.target.value)} />{' '}
        <select value={jobId} onChange={e=>setJobId(e.target.value)}>
          <option value="">Select Job (optional)</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.id} - {j.name}</option>
          ))}
        </select>
        <button type="submit">Create</button>
      </form>
      <ul>
        {pos.filter(x=> x.po_number && x.po_number.toLowerCase().includes(filter.toLowerCase())).map(p=> (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <strong>{p.id}</strong> — {editing===p.id ? (
              <>
                <input value={p.po_number} onChange={e=>{ p.po_number = e.target.value; setPos([...pos]) }} />
                <input value={p.vendor||''} onChange={e=>{ p.vendor = e.target.value; setPos([...pos]) }} />
                <input value={p.job_id||''} onChange={e=>{ p.job_id = e.target.value||null; setPos([...pos]) }} style={{ width: 80 }} />
                <button onClick={()=>saveEdit(p.id)}>Save</button>
                <button onClick={()=>setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                {p.po_number} — vendor:{p.vendor} job:{p.job_id}
                <button onClick={()=>setEditing(p.id)}>Edit</button>
              </>
            )}</li>
        ))}
      </ul>
    </div>
  )
}
