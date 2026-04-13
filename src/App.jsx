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

const CACHE_KEY = 'autoservice_user'

function saveCache(session, role) {
  if (session && role) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      userId: session.user.id,
      email:  session.user.email,
      role,
      savedAt: Date.now(),
    }))
  } else {
    localStorage.removeItem(CACHE_KEY)
  }
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    // Expire cache after 10 hours
    if (Date.now() - c.savedAt > 10 * 60 * 60 * 1000) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return c
  } catch {
    return null
  }
}

export default function App() {
  const { t, lang, switchLang } = useLang()

  const cached = loadCache()
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(cached?.role || null)
  const [email, setEmail]     = useState(cached?.email || null)
  const [authReady, setReady] = useState(!!cached) // instant if cached
  const [tab, setTab]         = useState(cached?.role === 'taller' ? 'service' : 'dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // No valid session — clear cache and show login
        saveCache(null, null)
        setRole(null)
        setEmail(null)
        setReady(true)
        return
      }

      setSession(session)
      setEmail(session.user.email)

      // Only fetch role from DB if not cached
      let r = cached?.userId === session.user.id ? cached.role : null
      if (!r) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        r = data?.role || null
      }

      setRole(r)
      setTab(r === 'taller' ? 'service' : 'dashboard')
      saveCache(session, r)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        saveCache(null, null)
        setSession(null)
        setRole(null)
        setEmail(null)
        setTab('dashboard')
        setReady(true)
        return
      }
      if (event === 'SIGNED_IN') {
        setSession(session)
        setEmail(session.user.email)
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        const r = data?.role || null
        setRole(r)
        setTab(r === 'taller' ? 'service' : 'dashboard')
        saveCache(session, r)
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    saveCache(null, null)
    await supabase.auth.signOut()
  }

  // Show spinner only on very first ever load (no cache)
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1' }}>
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  // Not logged in
  if (!role && !cached) return <Login />
  if (authReady && !role) return <Login />

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

          <span style={{ fontSize: 12, color: '#888' }}>{email}</span>

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
