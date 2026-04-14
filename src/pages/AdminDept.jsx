import { useState, useEffect, useRef } from 'react'
import Alert from '../components/Alert'
import { fmt, fmtDate, showAlert } from '../lib/utils'
import { useLang } from '../lib/LangContext'

export default function AdminDept({ sb }) {
  const { t } = useLang()
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [alert, setAlert]       = useState(null)
  const [editingId, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ customer_name: '', phone_number: '' })
  const debounceRef             = useRef(null)
  const allRecordsRef           = useRef([])

  const fetchRecords = async (showLoader = true) => {
    if (!sb) return
    if (showLoader) setLoading(true)
    const { data, error } = await sb
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      showAlert(setAlert, `${t('searchErr')}${error.message}`, 'error')
      setLoading(false)
      return
    }
    allRecordsRef.current = data || []
    applyFilter(data || [], query)
    setLoading(false)
  }

  const applyFilter = (data, q) => {
    if (!q.trim()) {
      setRecords(data)
      return
    }
    const lower = q.toLowerCase()
    setRecords(data.filter(r =>
      (r.customer_name || '').toLowerCase().includes(lower) ||
      (r.phone_number  || '').toLowerCase().includes(lower) ||
      (r.car_model     || '').toLowerCase().includes(lower)
    ))
  }

  useEffect(() => {
    fetchRecords()
    if (!sb) return
    const channel = sb.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' },
        () => fetchRecords(false))
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [sb])

  const handleSearch = (val) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      applyFilter(allRecordsRef.current, val)
    }, 200)
  }

  const markPaid = async (id) => {
    if (!sb) return
    const { error } = await sb
      .from('services')
      .update({ payment_status: 'paid' })
      .eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('paidUpdated'), 'success')
    // Update locally without refetching
    const updated = allRecordsRef.current.map(r =>
      r.id === id ? { ...r, payment_status: 'paid' } : r
    )
    allRecordsRef.current = updated
    applyFilter(updated, query)
  }

  const startEdit = (r) => {
    setEditing(r.id)
    setEditForm({ customer_name: r.customer_name || '', phone_number: r.phone_number || '' })
  }

  const cancelEdit = () => setEditing(null)

  const deleteRecord = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    const { error } = await sb.from('services').delete().eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('recordDeleted'), 'success')
    const updated = allRecordsRef.current.filter(r => r.id !== id)
    allRecordsRef.current = updated
    applyFilter(updated, query)
  }

  const saveCustomerInfo = async (id) => {
    if (!sb) return
    if (!editForm.customer_name.trim()) { showAlert(setAlert, t('errName'), 'error'); return }
    if (!editForm.phone_number.trim())  { showAlert(setAlert, t('errPhone'), 'error'); return }
    const { error } = await sb.from('services').update({
      customer_name: editForm.customer_name.trim(),
      phone_number:  editForm.phone_number.trim(),
    }).eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('customerInfoSaved'), 'success')
    const updated = allRecordsRef.current.map(r =>
      r.id === id
        ? { ...r, customer_name: editForm.customer_name.trim(), phone_number: editForm.phone_number.trim() }
        : r
    )
    allRecordsRef.current = updated
    applyFilter(updated, query)
    setEditing(null)
  }

  const roleBadgeStyle = (role) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    background: role === 'admin' ? '#FAEEDA' : '#E6F1FB',
    color:      role === 'admin' ? '#BA7517' : '#185FA5',
  })

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
          <button className="btn" onClick={() => { setQuery(''); applyFilter(allRecordsRef.current, '') }}>
            {t('all')}
          </button>
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
                editingId === r.id ? (
                  <tr key={r.id} style={{ background: '#FAEEDA22' }}>
                    <td>
                      <input value={editForm.customer_name}
                        onChange={e => setEditForm(f => ({ ...f, customer_name: e.target.value }))}
                        placeholder={t('phName')} style={{ width: '100%', minWidth: 120 }} />
                    </td>
                    <td>
                      <input value={editForm.phone_number}
                        onChange={e => setEditForm(f => ({ ...f, phone_number: e.target.value }))}
                        placeholder={t('phPhone')} style={{ width: '100%', minWidth: 110 }} />
                    </td>
                    <td colSpan={6} style={{ color: '#888', fontSize: 12 }}>
                      {r.car_model} — {r.service_type} — {fmtDate(r.service_date)}
                    </td>
                    <td colSpan={2}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveCustomerInfo(r.id)}>
                          {t('save')}
                        </button>
                        <button className="btn btn-sm" onClick={cancelEdit}>{t('cancel')}</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>
                      {r.customer_name ? (
                        <span style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc' }}
                          onClick={() => startEdit(r)} title={t('editCustomerInfo')}>
                          {r.customer_name}
                        </span>
                      ) : (
                        <button className="btn btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px', color: '#BA7517', borderColor: '#EF9F27' }}
                          onClick={() => startEdit(r)}>
                          + {t('addCustomer')}
                        </button>
                      )}
                    </td>
                    <td>
                      {r.phone_number ? (
                        <span style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc' }}
                          onClick={() => startEdit(r)}>{r.phone_number}</span>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      )}
                    </td>
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
                      <button
                        className="btn btn-sm"
                        style={{ color: '#A32D2D', borderColor: '#F7C1C1', marginLeft: 6 }}
                        onClick={() => deleteRecord(r.id)}
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
