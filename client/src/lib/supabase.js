import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Supabase env missing:', { url, hasKey: !!key })
}

export const supabase = createClient(url || 'http://localhost', key || 'missing-key')