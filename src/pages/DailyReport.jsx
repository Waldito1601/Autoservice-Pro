import { useState } from 'react'
import { today, fmt, fmtDate, calcPayments } from '../lib/utils'
import { useLang } from '../lib/LangContext'

export default function DailyReport({ sb }) {
  const { t } = useLang()
  const [date, setDate]       = useState(today())
  const [records, setRecords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const generate = async () => {
    if (!sb) { setError(t('errNoConn')); return }
    if (!date) { setError(t('errDate')); return }
    setError('')
    setLoading(true)
    const { data, error: err } = await sb
      .from('services').select('*')
      .eq('service_date', date)
      .order('service_time', { ascending: true })
    setLoading(false)
    if (err) { setError(err.message); return }
    setRecords(data || [])
  }

  const calc = records && records.length > 0 ? calcPayments(records) : null

  return (
    <div>
      <div className="page-header no-print">
        <h1 className="page-title">{t('reportTitle')}</h1>
        <div className="page-sub">{t('reportSub')}</div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 180 }} />
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? t('loading') : t('generateReport')}
        </button>
        {calc && (
          <button className="btn" onClick={() => window.print()}>{t('printReport')}</button>
        )}
      </div>

      {error && <div className="alert alert-error no-print">{error}</div>}
      {loading && <div className="loading"><div className="spinner" />{t('loadingRecords')}</div>}

      {records !== null && records.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state" style={{ padding: '2rem' }}>
            {t('noReportData')}{fmtDate(date)}.
          </div>
        </div>
      )}

      {calc && (
        <div className="card">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{t('reportHeader')}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {t('dailyReportLabel')} — {fmtDate(date)}
            </div>
          </div>

          {/* Stats */}
          <div className="report-stats">
            <div className="report-stat">
              <div className="stat-label">{t('totalServices')}</div>
              <div className="stat-val">{records.length}</div>
            </div>
            <div className="report-stat">
              <div className="stat-label">{t('paid')}</div>
              <div className="stat-val">{records.filter(r => r.payment_status === 'paid').length}</div>
            </div>
            <div className="report-stat">
              <div className="stat-label">{t('pending')}</div>
              <div className="stat-val">{records.filter(r => r.payment_status === 'pending').length}</div>
            </div>
            <div className="report-stat highlight">
              <div className="stat-label">{t('totalCollected')}</div>
              <div className="stat-val">${fmt(calc.total)}</div>
            </div>
          </div>

          {/* Table */}
          <div className="card-title">{t('serviceRecords')}</div>
          <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('customer')}</th>
                  <th>{t('car')}</th>
                  <th>{t('service')}</th>
                  <th>{t('description')}</th>
                  <th style={{ textAlign: 'right' }}>{t('price')}</th>
                  <th style={{ textAlign: 'center' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: '#999' }}>{i + 1}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.car_model}</td>
                    <td>{r.service_type}</td>
                    <td style={{ maxWidth: 200 }}>{r.service_description}</td>
                    <td style={{ textAlign: 'right' }}>${fmt(r.price)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${r.payment_status}`}>{t(r.payment_status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 500, padding: '10px 12px', borderTop: '0.5px solid rgba(0,0,0,0.15)' }}>
                    {t('total')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500, padding: '10px 12px', borderTop: '0.5px solid rgba(0,0,0,0.15)' }}>
                    ${fmt(calc.total)}
                  </td>
                  <td style={{ borderTop: '0.5px solid rgba(0,0,0,0.15)' }} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Calculations */}
          <div className="card-title">{t('paymentSummary')}</div>
          <div className="calc-section">
            <div className="calc-row">
              <span className="calc-label">{t('totalWithIVA')}</span>
              <span>${fmt(calc.total)}</span>
            </div>
            <div className="calc-row">
              <span className="calc-label">{t('baseNoIVA')}</span>
              <span>${fmt(calc.base)}</span>
            </div>
            <div className="calc-row">
              <span className="calc-label">{t('ivaAmount')}</span>
              <span>${fmt(calc.iva)}</span>
            </div>
            <div className="divider" />
            <div className="calc-row">
              <span className="calc-label">{t('commission30')}</span>
              <span style={{ color: '#A32D2D' }}>− ${fmt(calc.commission)}</span>
            </div>
            <div className="calc-row total-row">
              <span className="calc-label dark">{t('remaining')}</span>
              <span>${fmt(calc.remaining)}</span>
            </div>
            <div className="divider" />
            <div className="calc-split">
              <span className="calc-label dark">{t('svcPayment')}</span>
              <span style={{ fontWeight: 500, color: '#3B6D11' }}>${fmt(calc.svcPay)}</span>
            </div>
            <div className="calc-split">
              <span className="calc-label dark">{t('compPayment')}</span>
              <span style={{ fontWeight: 500, color: '#185FA5' }}>${fmt(calc.compPay)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="sig-row">
            <div className="sig-box">
              <div className="sig-line" />
              <div className="sig-name">{t('sigService')}</div>
              <div className="sig-date">{t('sigDate')}</div>
            </div>
            <div className="sig-box">
              <div className="sig-line" />
              <div className="sig-name">{t('sigAdmin')}</div>
              <div className="sig-date">{t('sigDate')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
