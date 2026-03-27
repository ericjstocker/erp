import React, { useState } from 'react'
import store from './store'
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

export default function App() {
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
        return <CustomersDetail customerId={selectedId.id} onBack={handleBackFromDetail} />
      }
      if (selectedId.itemType === 'job') {
        return <JobsDetail jobId={selectedId.id} onBack={handleBackFromDetail} />
      }
      if (selectedId.itemType === 'part') {
        return <PartsDetail partId={selectedId.id} onBack={handleBackFromDetail} />
      }
    }

    // List views
    switch (view) {
      case 'home':
        return <Home />
      case 'customers':
        return <Customers onSelectCustomer={(id) => handleSelectItem(id, 'customer')} />
      case 'jobs':
        return <Jobs onSelectJob={(id) => handleSelectItem(id, 'job')} />
      case 'parts':
        return <Parts onSelectPart={(id) => handleSelectItem(id, 'part')} />
      case 'pos':
        return <POs />
      case 'material':
        return <Material />
      default:
        return <Home />
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Small Shop ERP</h1>
        <button onClick={() => { store.logout(); setLoggedIn(false) }} style={{ padding: '8px 16px' }}>Logout</button>
      </div>
      <nav style={{ marginBottom: '20px', borderBottom: '2px solid #0066cc', paddingBottom: '10px' }}>
        <button 
          onClick={() => { setView('home'); setDetailView(false) }} 
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: view === 'home' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'home' && !detailView ? 'white' : 'black',
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
            backgroundColor: view === 'customers' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'customers' && !detailView ? 'white' : 'black',
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
            backgroundColor: view === 'jobs' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'jobs' && !detailView ? 'white' : 'black',
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
            backgroundColor: view === 'parts' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'parts' && !detailView ? 'white' : 'black',
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
            backgroundColor: view === 'pos' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'pos' && !detailView ? 'white' : 'black',
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
            backgroundColor: view === 'material' && !detailView ? '#0066cc' : '#f0f0f0',
            color: view === 'material' && !detailView ? 'white' : 'black',
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
