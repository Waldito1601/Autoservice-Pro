import { useState, useEffect, useRef } from 'react'
import Alert from '../components/Alert'
import { fmt, fmtDate, showAlert } from '../lib/utils'
import { useLang } from '../lib/LangContext'

export default function AdminDept({ sb }) {
  const { t } = useLang()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')
  const [alert, setAlert]     = useState(null)
  const debounceRef           = useRef(null)

  const fetchRecords = async (q = '') => {
    if (!sb) return
    setLoading(true)
    let req = sb.from('services').select('*').order('created_at', { ascending: false })
    if (q.trim()) {
      req = req.or(`customer_name.ilike.%${q}%,phone_number.ilike.%${q}%,car_model.ilike.%${q}%`)
    }
    const { data, error } = await req
    if (error) { showAlert(setAlert, `${t('searchErr')}${error.message}`, 'error'); setLoading(false); return }
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
    if (!sb) return
    const channel = sb.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchRecords(query))
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [sb])

  const handleSearch = (val) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRecords(val), 350)
  }

  const markPaid = async (id) => {
    if (!sb) return
    const { error } = await sb.from('services').update({ payment_status: 'paid' }).eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('paidUpdated'), 'success')
    fetchRecords(query)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('adminTitle')}</h1>
        <div className="page-sub">{t('adminSub')}</div>
      </div>

      <Alert alert={alert} />

      <div className="card">
        <div className="card-title">{t('searchRecords')}</div>
        <div className="search-row">
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
          <button className="btn" onClick={() => fetchRecords(query)}>{t('search')}</button>
          <button className="btn" onClick={() => { setQuery(''); fetchRecords('') }}>{t('all')}</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('customer')}</th><th>{t('phone')}</th><th>{t('car')}</th>
                <th>{t('service')}</th><th>{t('description')}</th><th>{t('price')}</th>
                <th>{t('date')}</th><th>{t('time')}</th><th>{t('status')}</th><th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="empty-state">
                  <div className="loading"><div className="spinner" />{t('loading')}</div>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10} className="empty-state">{t('noRecords')}</td></tr>
              ) : records.map(r => (
                <tr key={r.id}>
                  <td>{r.customer_name}</td>
                  <td>{r.phone_number}</td>
                  <td>{r.car_model}</td>
                  <td>{r.service_type}</td>
                  <td className="td-truncate">{r.service_description}</td>
                  <td>${fmt(r.price)}</td>
                  <td>{fmtDate(r.service_date)}</td>
                  <td>{(r.service_time || '').slice(0, 5)}</td>
                  <td>
                    <span className={`badge badge-${r.payment_status}`}>
                      {t(r.payment_status)}
                    </span>
                  </td>
                  <td>
                    {r.payment_status === 'pending' ? (
                      <button className="btn btn-sm btn-primary" onClick={() => markPaid(r.id)}>
                        {t('markPaid')}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#999' }}>{t('paid')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
