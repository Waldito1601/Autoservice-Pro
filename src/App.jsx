import { useState, useEffect } from 'react'
import Dashboard      from './pages/Dashboard'
import ServiceDept    from './pages/ServiceDept'
import AdminDept      from './pages/AdminDept'
import DailyReport    from './pages/DailyReport'
import UserManagement from './pages/UserManagement'
import Login          from './pages/Login'
import { supabase }   from './lib/supabase'
import { useLang }    from './lib/LangContext'
import { LANGS }      from './lib/i18n'

const CACHE_KEY = 'autoservice_role'

export default function App() {
  const { t, lang, switchLang } = useLang()
  const [authReady, setAuthReady] = useState(false)
  const [session,   setSession]   = useState(null)
  const [role,      setRole]      = useState(null)
  const [email,     setEmail]     = useState(null)
  const [tab,       setTab]       = useState('dashboard')

  /* ── 1. Resolve auth ONCE on mount ── */
  useEffect(() => {
    let alive = true

    const resolveAuth = async () => {
      // Try to get existing session (restored from localStorage by Supabase)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!alive) return

      if (error || !session) {
        localStorage.removeItem(CACHE_KEY)
        setAuthReady(true)
        return
      }

      await applySession(session)
      if (alive) setAuthReady(true)
    }

    resolveAuth()

    // Listen for future auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!alive) return
        if (event === 'SIGNED_OUT' || !session) {
          localStorage.removeItem(CACHE_KEY)
          setSession(null)
          setRole(null)
          setEmail(null)
          return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await applySession(session)
        }
      }
    )

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, []) // runs once — correct

  /* ── 2. Fetch role from profiles table ── */
  const applySession = async (session) => {
    setSession(session)
    setEmail(session.user.email)

    // Check cache first to avoid extra DB call
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { userId, role: cachedRole } = JSON.parse(cached)
      if (userId === session.user.id && cachedRole) {
        setRole(cachedRole)
        setTab(cachedRole === 'taller' ? 'service' : 'dashboard')
        return
      }
    }

    // Fetch from DB
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const r = data?.role || null
    if (r) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        userId: session.user.id, role: r
      }))
      setRole(r)
      setTab(r === 'taller' ? 'service' : 'dashboard')
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem(CACHE_KEY)
    await supabase.auth.signOut()
  }

  /* ── 3. Wait for auth to resolve before rendering ── */
  if (!authReady) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f4f1'
      }}>
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  /* ── 4. Not authenticated → Login ── */
  if (!session || !role) return <Login />

  /* ── 5. Authenticated → App (supabase guaranteed to have valid session) ── */
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

  // Key = session.access_token — forces pages to remount with fresh
  // supabase session after refresh, triggering their useEffect([sb])
  const sessionKey = session.access_token.slice(-8)

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard      key={`dash-${sessionKey}`}  sb={supabase} />
      case 'service':   return <ServiceDept    key={`svc-${sessionKey}`}   sb={supabase} />
      case 'admin':     return <AdminDept      key={`adm-${sessionKey}`}   sb={supabase} />
      case 'report':    return <DailyReport    key={`rep-${sessionKey}`}   sb={supabase} />
      case 'users':     return <UserManagement key={`usr-${sessionKey}`}   sb={supabase} />
      default:          return <Dashboard      key={`dash-${sessionKey}`}  sb={supabase} />
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
            {role === 'taller' ? t('roleTaller') : t('roleAdmin')}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>{email}</span>
          <button className="btn btn-sm" onClick={handleLogout}
            style={{ color: '#A32D2D', borderColor: '#F7C1C1' }}>
            {t('logout')}
          </button>
        </div>
      </header>
      <main className="content">{renderPage()}</main>
    </div>
  )
}
