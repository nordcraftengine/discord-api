import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const getSupabaseClient = (env: Env) => {
  return createClient<Database>(env.SUPABASE_API_URL, env.SUPABASE_SECRET_KEY)
}
