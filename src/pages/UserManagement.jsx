import { useState, useEffect } from 'react'
import Alert from '../components/Alert'
import { fmt as _fmt, showAlert } from '../lib/utils'
import { useLang } from '../lib/LangContext'

const ROLES = ['admin', 'taller']

export default function UserManagement({ sb }) {
  const { t } = useLang()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [alert, setAlert]       = useState(null)
  const [editingId, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: 'taller' })
  const [showAdd, setShowAdd]   = useState(false)
  const [addForm, setAddForm]   = useState({ email: '', full_name: '', role: 'taller' })

  const loadUsers = async () => {
    if (!sb) return
    setLoading(true)
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); setLoading(false); return }
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [sb])

  // ── Edit existing user ──
  const startEdit = (u) => {
    setEditing(u.id)
    setEditForm({ full_name: u.full_name || '', role: u.role })
    setShowAdd(false)
  }

  const cancelEdit = () => { setEditing(null) }

  const saveEdit = async (id) => {
    if (!editForm.full_name.trim()) { showAlert(setAlert, t('errFullName'), 'error'); return }
    const { error } = await sb
      .from('profiles')
      .update({ full_name: editForm.full_name.trim(), role: editForm.role })
      .eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('userUpdated'), 'success')
    setEditing(null)
    loadUsers()
  }

  // ── Remove access (delete profile row) ──
  const removeAccess = async (id, email) => {
    if (!window.confirm(t('confirmRemove') + ' ' + email + '?')) return
    const { error } = await sb.from('profiles').delete().eq('id', id)
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('userRemoved'), 'success')
    loadUsers()
  }

  // ── Add profile for existing auth user ──
  const saveAdd = async () => {
    if (!addForm.email.trim())     { showAlert(setAlert, t('errEmail'),    'error'); return }
    if (!addForm.full_name.trim()) { showAlert(setAlert, t('errFullName'), 'error'); return }

    // Look up the auth user by email via profiles — we need their UUID
    // Admin must have already created them in Supabase Auth dashboard
    // Here we just insert the profile row with the UUID they paste
    if (!addForm.id || !addForm.id.trim()) {
      showAlert(setAlert, t('errUserId'), 'error'); return
    }

    const { error } = await sb.from('profiles').insert({
      id:        addForm.id.trim(),
      email:     addForm.email.trim(),
      full_name: addForm.full_name.trim(),
      role:      addForm.role,
    })
    if (error) { showAlert(setAlert, `Error: ${error.message}`, 'error'); return }
    showAlert(setAlert, t('userAdded'), 'success')
    setShowAdd(false)
    setAddForm({ email: '', full_name: '', role: 'taller', id: '' })
    loadUsers()
  }

  const roleBadgeStyle = (role) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    background: role === 'admin' ? '#FAEEDA' : '#E6F1FB',
    color:      role === 'admin' ? '#BA7517' : '#185FA5',
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('userMgmtTitle')}</h1>
        <div className="page-sub">{t('userMgmtSub')}</div>
      </div>

      <Alert alert={alert} />

      {/* Add profile panel */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: '#EF9F27' }}>
          <div className="card-title">{t('addUserProfile')}</div>
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            {t('addUserNote')}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('userUUID')} *</label>
              <input
                value={addForm.id || ''}
                onChange={e => setAddForm(f => ({ ...f, id: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label>{t('loginEmail')} *</label>
              <input
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label>{t('fullName')} *</label>
              <input
                value={addForm.full_name}
                onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder={t('phName')}
              />
            </div>
            <div className="form-group">
              <label>{t('role')} *</label>
              <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={saveAdd}>{t('addUserProfile')}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>{t('registeredUsers')}</div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setShowAdd(true); setEditing(null) }}
          >
            + {t('addUserProfile')}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('fullName')}</th>
                <th>{t('loginEmail')}</th>
                <th>{t('role')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="empty-state">
                  <div className="loading"><div className="spinner" />{t('loading')}</div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">{t('noUsers')}</td></tr>
              ) : users.map(u => (
                editingId === u.id ? (
                  <tr key={u.id} style={{ background: '#FAEEDA22' }}>
                    <td>
                      <input
                        value={editForm.full_name}
                        onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                        style={{ width: '100%' }}
                        placeholder={t('fullName')}
                      />
                    </td>
                    <td style={{ color: '#888', fontSize: 12 }}>{u.email}</td>
                    <td>
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveEdit(u.id)}>
                          {t('save')}
                        </button>
                        <button className="btn btn-sm" onClick={cancelEdit}>
                          {t('cancel')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name || '—'}</td>
                    <td style={{ color: '#888', fontSize: 13 }}>{u.email}</td>
                    <td><span style={roleBadgeStyle(u.role)}>{u.role}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" onClick={() => startEdit(u)}>
                          {t('editRole')}
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: '#A32D2D', borderColor: '#F7C1C1' }}
                          onClick={() => removeAccess(u.id, u.email)}
                        >
                          {t('removeAccess')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="card" style={{ marginTop: '1rem', background: '#f5f4f1', border: 'none' }}>
        <div className="card-title">{t('howToAddUser')}</div>
        <ol style={{ fontSize: 13, color: '#666', lineHeight: 2, paddingLeft: '1.25rem' }}>
          <li>{t('step1')}</li>
          <li>{t('step2')}</li>
          <li>{t('step3')}</li>
          <li>{t('step4')}</li>
        </ol>
      </div>
    </div>
  )
}
