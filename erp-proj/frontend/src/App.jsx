import React, { useState } from 'react'
import store from './store'
import { ThemeProvider, useTheme } from './themeContext.jsx'
import Login from './components/Login'
import Home from './components/Home'
import Customers from './components/Customers'
import CustomersDetail from './components/CustomersDetail'
import Jobs from './components/Jobs'
import JobsDetail from './components/JobsDetail'
import Parts from './components/Parts'
import PartsDetail from './components/PartsDetail'
import POs from './components/POs'
import Material from './components/Material'
import MaterialDetail from './components/MaterialDetail'
import ChangePassword from './components/ChangePassword'

function AppContent() {
  const { theme, accentColor, setAccentColor, toggleTheme, currentTheme } = useTheme()
  const [view, setView] = useState('home')
  const [loggedIn, setLoggedIn] = useState(store.isLoggedIn())
  const [selectedId, setSelectedId] = useState(null)
  const [detailView, setDetailView] = useState(false)

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  const handleSelectItem = (id, itemType) => {
    setSelectedId({ id, itemType })
    setDetailView(true)
  }

  const handleBackFromDetail = () => {
    setDetailView(false)
    setSelectedId(null)
  }

  const renderContent = () => {
    // Detail views
    if (detailView && selectedId) {
      if (selectedId.itemType === 'customer') {
        return <CustomersDetail customerId={selectedId.id} onBack={handleBackFromDetail} onSelectJob={(id) => handleSelectItem(id, 'job')} onSelectPart={(id) => handleSelectItem(id, 'part')} />
      }
      if (selectedId.itemType === 'job') {
        return <JobsDetail jobId={selectedId.id} onBack={handleBackFromDetail} />
      }
      if (selectedId.itemType === 'part') {
        return <PartsDetail partId={selectedId.id} onBack={handleBackFromDetail} />
      }
      if (selectedId.itemType === 'material') {
        return <MaterialDetail materialId={selectedId.id} onBack={handleBackFromDetail} />
      }
    }

    // List views
    if (view === 'changepassword') {
      return <ChangePassword onBack={() => setView('home')} />
    }
    switch (view) {
      case 'home':
        return <Home onSelectJob={(id) => handleSelectItem(id, 'job')} />
      case 'customers':
        return <Customers onSelectCustomer={(id) => handleSelectItem(id, 'customer')} />
      case 'jobs':
        return <Jobs onSelectJob={(id) => handleSelectItem(id, 'job')} />
      case 'parts':
        return <Parts onSelectPart={(id) => handleSelectItem(id, 'part')} />
      case 'pos':
        return <POs />
      case 'material':
        return <Material onSelectMaterial={(id) => handleSelectItem(id, 'material')} />
      default:
        return <Home />
    }
  }

  return (
    <div style={{ 
      padding: 20, 
      fontFamily: 'sans-serif',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      minHeight: '100vh'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Carter Components</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px' }}>Theme:</label>
            <button 
              onClick={toggleTheme}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: accentColor,
                color: 'white', 
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px' }}>Accent:</label>
            <input 
              type="color" 
              value={accentColor} 
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ width: '40px', height: '35px', cursor: 'pointer', border: `2px solid ${currentTheme.border}` }}
              title="Choose accent color"
            />
          </div>
          <button onClick={() => { setView('changepassword'); setDetailView(false) }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Change Password</button>
          <button onClick={() => { store.logout(); setLoggedIn(false) }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      <nav style={{ marginBottom: '20px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '10px' }}>
        <button 
          onClick={() => { setView('home'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'home' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'home' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Home
        </button>
        <button 
          onClick={() => { setView('customers'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'customers' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'customers' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Customers
        </button>
        <button 
          onClick={() => { setView('jobs'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'jobs' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'jobs' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Jobs
        </button>
        <button 
          onClick={() => { setView('parts'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'parts' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'parts' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Parts
        </button>
        <button 
          onClick={() => { setView('pos'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'pos' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'pos' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          POs
        </button>
        <button 
          onClick={() => { setView('material'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'material' && !detailView ? accentColor : currentTheme.hover,
            color: view === 'material' && !detailView ? 'white' : currentTheme.text,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Material
        </button>
      </nav>
      <main>
        {renderContent()}
      </main>
    </div>
  )
}

export default function App() {
  if (!store.isLoggedIn()) {
    return <Login onLogin={() => window.location.reload()} />
  }
  
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
