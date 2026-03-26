import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Parts(){
  const [parts, setParts] = useState([])
  const [name, setName] = useState('')
  const [jobId, setJobId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [editing, setEditing] = useState(null)
  const [fileByPart, setFileByPart] = useState({})

  useEffect(()=>{ api.listParts().then(setParts).catch(console.error) }, [])

  async function submit(e){
    e.preventDefault()
    try{
      await api.createPart({ name, job_id: jobId || null, material_id: materialId || null })
      setParts(await api.listParts())
      setName('')
    }catch(err){ alert(err) }
  }

  async function saveEdit(partId){
    const part = parts.find(p=>p.id===partId)
    if(!part) return
    const payload = { name: part.name, job_id: part.job_id, material_id: part.material_id }
    await api.updatePart(partId, payload)
    setEditing(null)
    setParts(await api.listParts())
  }

  async function uploadBlueprintFor(partId){
    const file = fileByPart[partId]
    if(!file){ alert('Select file first'); return }
    try{
      await api.uploadBlueprint(partId, file)
      setFileByPart(prev=>({ ...prev, [partId]: null }))
      setParts(await api.listParts())
      alert('Upload complete')
    }catch(err){ alert(err) }
  }

  return (
    <div>
      <h2>Parts</h2>
      <form onSubmit={submit} style={{ marginBottom: 12 }}>
        <input placeholder="Part name" value={name} onChange={e=>setName(e.target.value)} required />{' '}
        <input placeholder="Job ID (optional)" value={jobId} onChange={e=>setJobId(e.target.value)} />{' '}
        <input placeholder="Material ID (optional)" value={materialId} onChange={e=>setMaterialId(e.target.value)} />{' '}
        <button type="submit">Create</button>
      </form>
      <ul>
        {parts.map(p => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <strong>{p.id}</strong> — {editing===p.id ? (
              <>
                <input value={p.name} onChange={e=>{ p.name = e.target.value; setParts([...parts]) }} />
                <input value={p.job_id||''} onChange={e=>{ p.job_id = e.target.value||null; setParts([...parts]) }} style={{ width: 80 }} />
                <input value={p.material_id||''} onChange={e=>{ p.material_id = e.target.value||null; setParts([...parts]) }} style={{ width: 80 }} />
                <button onClick={()=>saveEdit(p.id)}>Save</button>
                <button onClick={()=>setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                {p.name} — job:{p.job_id} material:{p.material_id}
                <button onClick={()=>setEditing(p.id)}>Edit</button>
                <input type="file" onChange={e=>setFileByPart(prev=>({ ...prev, [p.id]: e.target.files[0] }))} />
                <button onClick={()=>uploadBlueprintFor(p.id)}>Upload Blueprint</button>
              </>
            )}</li>
        ))}
      </ul>
    </div>
  )
}
