import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/LangContext'
import { LANGS } from '../lib/i18n'

export default function Login() {
  const { t, lang, switchLang } = useLang()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError(t('loginErrFields')); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(t('loginErrInvalid'))
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f4f1',
      padding: '1rem',
    }}>
      {/* Language switcher */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
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
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, background: '#BA7517', borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.3px' }}>AutoService Pro</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{t('loginSubtitle')}</div>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>{t('loginEmail')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('loginEmailPlaceholder')}
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>{t('loginPassword')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? t('loginLoading') : t('loginBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
