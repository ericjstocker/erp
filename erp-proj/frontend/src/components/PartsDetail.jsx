import React, { useState, useEffect } from 'react'
import api from '../api'

export default function PartsDetail({ partId, onBack }) {
  const [part, setPart] = useState(null)
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartData()
  }, [partId])

  const loadPartData = async () => {
    try {
      const [partRes, jobsRes, customersRes] = await Promise.all([
        api.getPart(partId),
        api.listJobs(),
        api.listCustomers()
      ])
      setPart(partRes)
      setJobs(jobsRes)
      setCustomers(customersRes)
    } catch (err) {
      console.error('Error loading part data:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleDownload = async () => {
    try {
      const url = await api.downloadBlueprint(part.id)
      const a = document.createElement('a')
      a.href = url
      a.download = `blueprint_part_${part.id}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading blueprint: ' + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!part) return <div>Part not found</div>

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>← Back to Parts</button>
      
      <h2>{part.name}</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Part Information</h3>
        <p><strong>Input Date:</strong> {part.created_at ? new Date(part.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Updated:</strong> {part.updated_at ? new Date(part.updated_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Job:</strong> {getJobName(part.job_id)}</p>
        <p><strong>Customer:</strong> {getCustomerForJob(part.job_id)}</p>
        <p><strong>Material Type:</strong> {part.material_type || 'N/A'}</p>
        <p><strong>Material Size:</strong> {part.material_size || 'N/A'}</p>
        <p><strong>Status:</strong> <span style={{ padding: '5px 10px', backgroundColor: part.status === 'completed' ? '#90EE90' : part.status === 'in-progress' ? '#FFD700' : '#FFB6C6', borderRadius: '3px' }}>{part.status}</span></p>
        
        {part.blueprint_path && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Blueprint:</strong></p>
            <button
              onClick={handleDownload}
              style={{ padding: '6px 14px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              Download Blueprint
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Additional Details</h3>
        <p><strong>Material ID:</strong> {part.material_id || 'None'}</p>
      </div>
    </div>
  )
}
