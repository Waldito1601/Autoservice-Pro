import { useState, useEffect } from 'react'
import { today, fmt, fmtDate } from '../lib/utils'
import { useLang } from '../lib/LangContext'

export default function Dashboard({ sb }) {
  const { t } = useLang()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  const load = async () => {
    if (!sb) return
    setLoading(true)
    const { data } = await sb
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (!sb) return
    const channel = sb.channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' },
        () => load())
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [sb])

  const t_ = today()
  const todayRecs  = records.filter(r => r.service_date === t_)
  const paidToday  = todayRecs.filter(r => r.payment_status === 'paid')
  const todayTotal = todayRecs.reduce((a, b) => a + parseFloat(b.price), 0)
  const recent     = records.slice(0, 8)

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard')}</h1>
        <div className="page-sub">{dateLabel}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('totalRecords')}</div>
          <div className="stat-val">{loading ? '—' : records.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('todayServices')}</div>
          <div className="stat-val amber">{loading ? '—' : todayRecs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('paidToday')}</div>
          <div className="stat-val">{loading ? '—' : paidToday.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('todayTotal')}</div>
          <div className="stat-val amber">{loading ? '—' : `$${fmt(todayTotal)}`}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('recentServices')}</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('customer')}</th><th>{t('car')}</th><th>{t('service')}</th>
                <th>{t('price')}</th><th>{t('status')}</th><th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-state">
                  <div className="loading"><div className="spinner" />{t('loading')}</div>
                </td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">{t('noServicesYet')}</td></tr>
              ) : recent.map(r => (
                <tr key={r.id}>
                  <td>{r.customer_name}</td>
                  <td>{r.car_model}</td>
                  <td>{r.service_type}</td>
                  <td>${fmt(r.price)}</td>
                  <td><span className={`badge badge-${r.payment_status}`}>{t(r.payment_status)}</span></td>
                  <td>{fmtDate(r.service_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


