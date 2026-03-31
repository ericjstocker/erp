import React, { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

export default function Customers({ onSelectCustomer }) {
  const { accentColor, currentTheme } = useTheme()
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
  const boxStyle = { marginBottom: '30px', padding: '15px', border: '2px solid ' + accentColor, borderRadius: '5px', backgroundColor: currentTheme.bg }
  const inputStyle = { padding: '6px', border: '1px solid ' + currentTheme.inputBorder, borderRadius: '3px', backgroundColor: currentTheme.input, color: currentTheme.text, fontSize: '14px', fontFamily: 'inherit' }
  const thStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', textAlign: 'left', backgroundColor: currentTheme.hover, color: currentTheme.text }
  const tdStyle = { border: '1px solid ' + currentTheme.border, padding: '8px', color: currentTheme.text }

  return (
    <div style={{ padding: '20px', color: currentTheme.text, backgroundColor: currentTheme.bg, minHeight: '100%' }}>
      <h1>Customers</h1>

      {/* Add Customer Form */}
      <div style={boxStyle}>
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name *: </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Contact: </label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone, email, etc." style={inputStyle} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Notes: </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional information" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', width: '100%' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Add Customer
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="Search customers..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '8px' }} />
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
                border: '1px solid ' + currentTheme.border,
                borderRadius: '5px',
                backgroundColor: currentTheme.hover,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <h3
                onClick={() => onSelectCustomer(customer.id)}
                style={{ margin: '0 0 10px 0', cursor: 'pointer', color: accentColor, textDecoration: 'underline' }}
              >{customer.name}</h3>
              {customer.contact && <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {customer.contact}</p>}
              {customer.notes && <p style={{ margin: '5px 0' }}><strong>Notes:</strong> {customer.notes}</p>}
              <p style={{ margin: '5px 0 12px 0', color: currentTheme.text, fontSize: '12px', opacity: 0.7 }}>
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
          <div style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, borderRadius: '8px', padding: '24px', width: '70%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid ' + currentTheme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Archived Customers ({archivedCustomers.length})</h2>
              <button onClick={() => setShowArchive(false)} style={{ padding: '6px 14px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Close</button>
            </div>
            {archivedCustomers.length === 0 ? <p>No archived customers</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Contact</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedCustomers.map(c => (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.name}</td>
                      <td style={tdStyle}>{c.contact || 'N/A'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
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
