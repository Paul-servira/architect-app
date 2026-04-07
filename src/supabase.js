import { createClient } from '@supabase/supabase-js'

// ============================================================
//  PASTE YOUR SUPABASE CREDENTIALS HERE (see SETUP.md step 1)
// ============================================================
const SUPABASE_URL = 'https://dosylcqbpigqjbkotsvp.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_avHzmMfv5fMZ62JmemiaMg_eAG0sf6n'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Drop-in replacement for window.storage
export const S = {
  async get(k) {
    try {
      const { data, error } = await supabase
        .from('architect_data')
        .select('value')
        .eq('key', k)
        .single()
      if (error || !data) return null
      return data.value
    } catch { return null }
  },
  async set(k, v) {
    try {
      await supabase
        .from('architect_data')
        .upsert({ key: k, value: v, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    } catch (e) { console.error('Storage error:', e) }
  },
}
