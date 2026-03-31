import React, { useState, useEffect } from 'react'
import api from '../api'

export default function Customers({ onSelectCustomer }) {
  const [customers, setCustomers] = useState([])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  const [archivedCustomers, setArchivedCustomers] = useState([])

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      const res = await api.listCustomers()
      setCustomers(res)
    } catch (err) { console.error('Error loading customers:', err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createCustomer({ name, contact, notes })
      setName(''); setContact(''); setNotes('')
      loadCustomers()
    } catch (err) { alert(`Error creating customer: ${err}`) }
  }

  async function handleArchive(customerId, e) {
    e.stopPropagation()
    if (!window.confirm('Archive this customer?')) return
    try { await api.archiveCustomer(customerId); loadCustomers() } catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDelete(customerId, e) {
    e.stopPropagation()
    if (!window.confirm('Permanently delete this customer? This cannot be undone.')) return
    try { await api.deleteCustomer(customerId); loadCustomers() } catch (err) { alert(`Error: ${err}`) }
  }

  async function openArchive() {
    try { const res = await api.listArchivedCustomers(); setArchivedCustomers(res || []); setShowArchive(true) }
    catch (err) { alert(`Error loading archive: ${err}`) }
  }

  async function handleRestore(customerId) {
    try { await api.restoreCustomer(customerId); setArchivedCustomers(archivedCustomers.filter(c => c.id !== customerId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  async function handleDeleteArchived(customerId) {
    if (!window.confirm('Permanently delete this customer?')) return
    try { await api.deleteCustomer(customerId); setArchivedCustomers(archivedCustomers.filter(c => c.id !== customerId)) }
    catch (err) { alert(`Error: ${err}`) }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.contact && c.contact.toLowerCase().includes(filter.toLowerCase()))
  )

  const btnStyle = (color) => ({ padding: '5px 10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' })

  return (
    <div style={{ padding: '20px' }}>
      <h1>Customers</h1>

      {/* Add Customer Form */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name *: </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Contact: </label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone, email, etc." />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Notes: </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional information" />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Add Customer
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="Search customers..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px' }} />
      </div>

      {/* List header with View Archive button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>All Customers ({filteredCustomers.length})</h2>
        <button onClick={openArchive} style={{ padding: '6px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          View Archive
        </button>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3
                onClick={() => onSelectCustomer(customer.id)}
                style={{ margin: '0 0 10px 0', cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
              >{customer.name}</h3>
              {customer.contact && <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {customer.contact}</p>}
              {customer.notes && <p style={{ margin: '5px 0' }}><strong>Notes:</strong> {customer.notes}</p>}
              <p style={{ margin: '5px 0 12px 0', color: '#666', fontSize: '12px' }}>
                Created: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
              </p>
              <div>
                <button onClick={() => onSelectCustomer(customer.id)} style={btnStyle('#0066cc')}>View Details</button>
                <button onClick={(e) => handleArchive(customer.id, e)} style={btnStyle('#6c757d')}>Archive</button>
                <button onClick={(e) => handleDelete(customer.id, e)} style={{ ...btnStyle('#dc3545'), marginRight: 0 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archive Modal */}
      {showArchive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '70%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Archived Customers ({archivedCustomers.length})</h2>
              <button onClick={() => setShowArchive(false)} style={{ padding: '6px 14px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Close</button>
            </div>
            {archivedCustomers.length === 0 ? <p>No archived customers</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Contact</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedCustomers.map(c => (
                    <tr key={c.id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{c.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{c.contact || 'N/A'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => handleRestore(c.id)} style={btnStyle('#28a745')}>Restore</button>
                        <button onClick={() => handleDeleteArchived(c.id)} style={{ ...btnStyle('#dc3545'), marginRight: 0 }}>Delete</button>
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

  const [customers, setCustomers] = useState([])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const res = await api.listCustomers()
      setCustomers(res)
    } catch (err) {
      console.error('Error loading customers:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createCustomer({ name, contact, notes })
      setName('')
      setContact('')
      setNotes('')
      loadCustomers()
    } catch (err) {
      alert(`Error creating customer: ${err}`)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.contact && c.contact.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div style={{ padding: '20px' }}>
      <h1>Customers</h1>

      {/* Add Customer Form */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '2px solid #0066cc', borderRadius: '5px' }}>
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name *: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Contact: </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone, email, etc."
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Notes: </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information"
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Add Customer
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search customers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* Customers List */}
      <h2>All Customers ({filteredCustomers.length})</h2>
      {filteredCustomers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              onClick={() => onSelectCustomer(customer.id)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                transition: 'all 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f4f8'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{customer.name}</h3>
              {customer.contact && <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {customer.contact}</p>}
              {customer.notes && <p style={{ margin: '5px 0' }}><strong>Notes:</strong> {customer.notes}</p>}
              <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                Created: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
