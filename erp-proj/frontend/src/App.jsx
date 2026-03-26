import React, { useState } from 'react'
import store from './store'
import Login from './components/Login'
import Jobs from './components/Jobs'
import Parts from './components/Parts'
import POs from './components/POs'

export default function App() {
  const [view, setView] = useState('jobs')
  const [loggedIn, setLoggedIn] = useState(store.isLoggedIn())

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Small Shop ERP</h1>
        <button onClick={() => { store.logout(); setLoggedIn(false) }} style={{ padding: '8px 16px' }}>Logout</button>
      </div>
      <nav style={{ marginBottom: 12 }}>
        <button onClick={() => setView('jobs')}>Jobs</button>{' '}
        <button onClick={() => setView('parts')}>Parts</button>{' '}
        <button onClick={() => setView('pos')}>POs</button>
      </nav>
      <main>
        {view === 'jobs' && <Jobs />}
        {view === 'parts' && <Parts />}
        {view === 'pos' && <POs />}
      </main>
    </div>
  )
}
