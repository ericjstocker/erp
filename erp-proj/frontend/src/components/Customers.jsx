import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function Customers({ onSelectCustomer }) {
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
