import { useState, useEffect } from 'react'
import Alert from '../components/Alert'
import { today, nowTime, fmt, showAlert } from '../lib/utils'
import { useLang } from '../lib/LangContext'

const emptyForm = () => ({
  car_model: '',
  service_type: '',
  service_description: '',
  price: '',
  service_date: today(),
  service_time: nowTime(),
})

export default function ServiceDept({ sb }) {
  const { t } = useLang()
  const [form, setForm]       = useState(emptyForm())
  const [saving, setSaving]   = useState(false)
  const [alert, setAlert]     = useState(null)
  const [todayRecs, setToday] = useState([])
  const [loadingT, setLoadT]  = useState(true)

  const SERVICE_TYPES = [
    { key: 'wheelAlignment',    label: t('wheelAlignment') },
    { key: 'generalInspection', label: t('generalInspection') },
    { key: 'other',             label: t('other') },
  ]

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadToday = async () => {
    if (!sb) return
    setLoadT(true)
    const { data } = await sb
      .from('services').select('*')
      .eq('service_date', today())
      .order('created_at', { ascending: false })
    setToday(data || [])
    setLoadT(false)
  }

  useEffect(() => {
    loadToday()
    if (!sb) return
    const channel = sb.channel('service-dept-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'services' }, loadToday)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [sb])

  const handleSave = async () => {
    if (!sb) { showAlert(setAlert, t('errNoConn'), 'error'); return }
    const isOther = form.service_type === t('other')
    if (!form.car_model)    { showAlert(setAlert, t('errCar'),   'error'); return }
    if (!form.service_type) { showAlert(setAlert, t('errType'),  'error'); return }
    if (isOther && !form.service_description) { showAlert(setAlert, t('errDesc'), 'error'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { showAlert(setAlert, t('errPrice'), 'error'); return }
    if (!form.service_date) { showAlert(setAlert, t('errDate'),  'error'); return }

    setSaving(true)
    const { error } = await sb.from('services').insert({
      customer_name:       null,
      phone_number:        null,
      car_model:           form.car_model.trim(),
      service_type:        form.service_type,
      service_description: form.service_description.trim() || null,
      price:               parseFloat(form.price),
      service_date:        form.service_date,
      service_time:        form.service_time || null,
      payment_status:      'pending',
    })
    setSaving(false)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error', 5000); return }
    showAlert(setAlert, t('savedOk'), 'success')
    setForm(emptyForm())
    loadToday()
  }

  const isOther = form.service_type === t('other')
  const descLabel = isOther ? `${t('serviceDescRequired')} *` : t('serviceDescOptional')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('serviceDeptTitle')}</h1>
        <div className="page-sub">{t('serviceDeptSub')}</div>
      </div>

      <Alert alert={alert} />

      <div className="card">
        <div className="card-title">{t('newServiceRecord')}</div>
        <div className="form-grid">
          <div className="form-group">
            <label>{t('carModel')} *</label>
            <input value={form.car_model} onChange={e => set('car_model', e.target.value)} placeholder={t('phCar')} />
          </div>
          <div className="form-group">
            <label>{t('serviceType')} *</label>
            <select value={form.service_type} onChange={e => set('service_type', e.target.value)}>
              <option value="">{t('selectType')}</option>
              {SERVICE_TYPES.map(st => <option key={st.key} value={st.label}>{st.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{t('date')} *</label>
            <input type="date" value={form.service_date} onChange={e => set('service_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('time')}</label>
            <input type="time" value={form.service_time} onChange={e => set('service_time', e.target.value)} />
          </div>
          <div className="form-group full">
            <label>{descLabel}</label>
            <textarea
              value={form.service_description}
              onChange={e => set('service_description', e.target.value)}
              placeholder={isOther ? t('requiredPlaceholder') : t('optionalPlaceholder')}
              style={isOther && !form.service_description ? { borderColor: '#BA7517' } : {}}
            />
          </div>
          <div className="form-group">
            <label>{t('priceMXN')} *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => setForm(emptyForm())}>{t('clear')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('saveRecord')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('todayRecords')}</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('car')}</th><th>{t('service')}</th>
                <th>{t('description')}</th><th>{t('price')}</th><th>{t('time')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingT ? (
                <tr><td colSpan={5} className="empty-state">
                  <div className="loading"><div className="spinner" />{t('loading')}</div>
                </td></tr>
              ) : todayRecs.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">{t('noRecordsToday')}</td></tr>
              ) : todayRecs.map(r => (
                <tr key={r.id}>
                  <td>{r.car_model}</td>
                  <td>{r.service_type}</td>
                  <td className="td-truncate">{r.service_description}</td>
                  <td>${fmt(r.price)}</td>
                  <td>{(r.service_time || '').slice(0, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
