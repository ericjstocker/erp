import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Jobs(){
  const [jobs, setJobs] = useState([])
  const [name, setName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(()=>{ api.listJobs().then(setJobs).catch(console.error) }, [])

  async function submit(e){
    e.preventDefault()
    try{
      await api.createJob({ name, customer_id: customerId || null })
      const newJobs = await api.listJobs()
      setJobs(newJobs)
      setName('')
    }catch(err){ alert(err) }
  }

  async function saveEdit(jobId){
    const job = jobs.find(j=>j.id===jobId)
    if(!job) return
    const payload = { name: job.name, description: job.description, customer_id: job.customer_id, status: job.status }
    await api.updateJob(jobId, payload)
    setEditing(null)
    setJobs(await api.listJobs())
  }

  return (
    <div>
      <h2>Jobs</h2>
      <div style={{ marginBottom: 8 }}>
        <input placeholder="Search jobs" value={filter} onChange={e=>setFilter(e.target.value)} />
      </div>
      <form onSubmit={submit} style={{ marginBottom: 12 }}>
        <input placeholder="Job name" value={name} onChange={e=>setName(e.target.value)} required />{' '}
        <input placeholder="Customer ID (optional)" value={customerId} onChange={e=>setCustomerId(e.target.value)} />{' '}
        <button type="submit">Create</button>
      </form>
      <ul>
        {jobs.filter(j=> j.name.toLowerCase().includes(filter.toLowerCase())).map(j=> (
          <li key={j.id} style={{ marginBottom: 8 }}>
            <strong>{j.id}</strong> — {editing===j.id ? (
              <>
                <input value={j.name} onChange={e=>{ j.name = e.target.value; setJobs([...jobs]) }} />
                <input value={j.status||''} onChange={e=>{ j.status = e.target.value; setJobs([...jobs]) }} style={{ width: 120 }} />
                <button onClick={()=>saveEdit(j.id)}>Save</button>
                <button onClick={()=>setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                {j.name} — {j.status}
                <button onClick={()=>setEditing(j.id)}>Edit</button>
              </>
            )}</li>
        ))}
      </ul>
    </div>
  )
}
