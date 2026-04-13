import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Single shared client — no config needed from the user
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'autoservice-session',
  },
})

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
