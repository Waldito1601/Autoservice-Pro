import { useState } from 'react'
import { saveConfig } from '../lib/supabase'
import { useLang } from '../lib/LangContext'

const SQL = `create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text,
  car_model text not null,
  service_type text not null,
  service_description text,
  price numeric(10,2) not null default 0,
  service_date date not null,
  service_time time,
  payment_status text not null default 'pending',
  created_at timestamptz default now()
);

alter table services enable row level security;

create policy "Allow all for MVP"
  on services for all
  using (true)
  with check (true);`

export default function ConfigModal({ onConnect }) {
  const { t } = useLang()
  const [url, setUrl]     = useState('')
  const [key, setKey]     = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleConnect = () => {
    if (!url.trim() || !key.trim()) { setError(t('errBothFields')); return }
    if (!url.startsWith('https://')) { setError(t('errHttps')); return }
    setError('')
    saveConfig(url.trim(), key.trim())
    onConnect(url.trim(), key.trim())
  }

  const copySql = () => {
    navigator.clipboard.writeText(SQL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="overlay-title">{t('connectTitle')}</div>
        <div className="overlay-sub">{t('connectSub')}</div>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>{t('projectUrl')}</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
        </div>
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>{t('anonKey')}</label>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbG..." />
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="btn-row" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
          <button className="btn btn-primary" onClick={handleConnect}>{t('connect')}</button>
        </div>

        <div className="divider" />
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('runSqlFirst')}</div>
        <div className="code-block">{SQL}</div>
        <button className="btn btn-sm" onClick={copySql}>
          {copied ? t('copied') : t('copySql')}
        </button>
      </div>
    </div>
  )
}
