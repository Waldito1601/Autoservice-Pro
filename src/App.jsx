import { useState, useEffect } from 'react'
import Dashboard   from './pages/Dashboard'
import ServiceDept from './pages/ServiceDept'
import AdminDept   from './pages/AdminDept'
import DailyReport from './pages/DailyReport'
import Login       from './pages/Login'
import { supabase } from './lib/supabase'
import { useLang } from './lib/LangContext'
import { LANGS } from './lib/i18n'

export default function App() {
  const { t, lang, switchLang } = useLang()
  const [tab, setTab]         = useState('dashboard')
  const [session, setSession] = useState(null)
  const [authReady, setReady] = useState(false)

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setReady(true)
    })
    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setTab('dashboard')
  }

  // Wait for auth check before rendering anything
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1' }}>
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  // Not logged in — show login screen
  if (!session) return <Login />

  const TABS = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'service',   label: t('serviceDept') },
    { id: 'admin',     label: t('admin') },
    { id: 'report',    label: t('dailyReport') },
  ]

  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard   sb={supabase} />
      case 'service':   return <ServiceDept sb={supabase} />
      case 'admin':     return <AdminDept   sb={supabase} />
      case 'report':    return <DailyReport sb={supabase} />
      default:          return <Dashboard   sb={supabase} />
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-dot" />
          AutoService Pro
        </div>

        <nav className="nav-tabs">
          {TABS.map(tb => (
            <button
              key={tb.id}
              className={`nav-tab ${tab === tb.id ? 'active' : ''}`}
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </nav>

        <div className="nav-right">
          <div className="lang-switcher">
            {LANGS.map(l => (
              <button
                key={l.code}
                className={`lang-btn ${lang === l.code ? 'active' : ''}`}
                onClick={() => switchLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: '#888' }}>
            {session.user.email}
          </span>

          <button className="btn btn-sm" onClick={handleLogout} style={{ color: '#A32D2D', borderColor: '#F7C1C1' }}>
            {t('logout')}
          </button>
        </div>
      </header>

      <main className="content">
        {renderPage()}
      </main>
    </div>
  )
}
