import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Handle invalid refresh token — clear storage and reload to login
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') return
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('autoservice_user')
  }
})

// Catch token refresh failures globally
const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
supabase.auth.getSession = async () => {
  try {
    const result = await originalGetSession()
    if (result.error?.message?.includes('Refresh Token')) {
      localStorage.clear()
      window.location.reload()
      return { data: { session: null }, error: null }
    }
    return result
  } catch (e) {
    localStorage.clear()
    window.location.reload()
    return { data: { session: null }, error: null }
  }
}

// Keep these for the optional Settings override (dev/admin use)
const STORAGE_KEY = 'autoservice_cfg'
export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
export function saveConfig(url, key) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, key }))
}
export function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

