import React, { useState } from 'react'
import api from '../api'
import { useTheme } from '../themeContext.jsx'

export default function ChangePassword({ onBack }) {
  const { accentColor, currentTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    padding: '8px',
    border: `1px solid ${accentColor}`,
    borderRadius: '4px',
    backgroundColor: currentTheme.input,
    color: currentTheme.text,
    fontFamily: 'inherit',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setMessage('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', color: currentTheme.text }}>
      <button
        onClick={onBack}
        style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
      >
        ← Back
      </button>

      <div style={{ maxWidth: '400px', border: `2px solid ${accentColor}`, borderRadius: '8px', padding: '24px', backgroundColor: currentTheme.bg }}>
        <h2 style={{ marginTop: 0 }}>Change Password</h2>

        {message && (
          <div style={{ padding: '10px', marginBottom: '16px', backgroundColor: '#ccffcc', border: '1px solid #00aa00', borderRadius: '4px', color: '#006600' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '10px', marginBottom: '16px', backgroundColor: '#ffcccc', border: '1px solid #aa0000', borderRadius: '4px', color: '#660000' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
              required
              autoComplete="current-password"
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              required
              autoComplete="new-password"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
