export const today = () => new Date().toISOString().split('T')[0]

export const nowTime = () => {
  const d = new Date()
  return d.toTimeString().slice(0, 5)
}

export const fmt = (n) => Number(n).toFixed(2)

export const fmtDate = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${m}/${d}/${y}`
}

export const calcPayments = (records) => {
  const total      = records.reduce((a, b) => a + parseFloat(b.price), 0)
  const base       = total / 1.16
  const iva        = total - base
  const commission = base * 0.30
  const remaining  = base - commission
  const svcPay     = remaining / 2
  const compPay    = remaining / 2
  return { total, base, iva, commission, remaining, svcPay, compPay }
}

let alertTimers = {}
export const showAlert = (setter, msg, type, dur = 3500) => {
  const key = type + msg
  if (alertTimers[key]) clearTimeout(alertTimers[key])
  setter({ msg, type })
  alertTimers[key] = setTimeout(() => setter(null), dur)
}
