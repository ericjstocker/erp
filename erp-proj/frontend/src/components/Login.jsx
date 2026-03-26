import React, { useState } from 'react'
import { api } from '../api'
import store from '../store'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.login(username, password)
      store.setToken(res.access_token)
      onLogin()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f7f7f8',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: 300
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Small Shop ERP</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 10,
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: '#666' }}>
          Demo: admin / admin123
        </p>
      </div>
    </div>
  )
}
