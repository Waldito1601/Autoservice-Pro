import { useState, useEffect } from 'react'
import Dashboard      from './pages/Dashboard'
import ServiceDept    from './pages/ServiceDept'
import AdminDept      from './pages/AdminDept'
import DailyReport    from './pages/DailyReport'
import UserManagement from './pages/UserManagement'
import Login          from './pages/Login'
import { supabase } from './lib/supabase'
import { useLang } from './lib/LangContext'
import { LANGS } from './lib/i18n'

export default function App() {
  const { t, lang, switchLang } = useLang()
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(null)
  const [authReady, setReady] = useState(false)

  const defaultTab = (r) => r === 'taller' ? 'service' : 'dashboard'
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const r = await fetchRole(session.user.id)
        setRole(r)
        setTab(defaultTab(r))
      }
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const r = await fetchRole(session.user.id)
        setRole(r)
        setTab(defaultTab(r))
      } else {
        setRole(null)
        setTab('dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role || null
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setRole(null)
    setTab('dashboard')
  }

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1' }}>
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  if (!session) return <Login />

  const TABS = role === 'taller'
    ? [
        { id: 'dashboard', label: t('dashboard') },
        { id: 'service',   label: t('serviceDept') },
      ]
    : [
        { id: 'dashboard', label: t('dashboard') },
        { id: 'service',   label: t('serviceDept') },
        { id: 'admin',     label: t('admin') },
        { id: 'report',    label: t('dailyReport') },
        { id: 'users',     label: t('users') },
      ]

  const allowedIds = TABS.map(tb => tb.id)
  const activeTab  = allowedIds.includes(tab) ? tab : TABS[0].id

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard      sb={supabase} />
      case 'service':   return <ServiceDept    sb={supabase} />
      case 'admin':     return <AdminDept      sb={supabase} />
      case 'report':    return <DailyReport    sb={supabase} />
      case 'users':     return <UserManagement sb={supabase} />
      default:          return <Dashboard      sb={supabase} />
    }
  }

  const roleLabel = role === 'taller' ? t('roleTaller') : t('roleAdmin')

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
              className={`nav-tab ${activeTab === tb.id ? 'active' : ''}`}
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

          <span style={{
            fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
            background: role === 'taller' ? '#E6F1FB' : '#FAEEDA',
            color:      role === 'taller' ? '#185FA5' : '#BA7517',
          }}>
            {roleLabel}
          </span>

          <span style={{ fontSize: 12, color: '#888' }}>{session.user.email}</span>

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

