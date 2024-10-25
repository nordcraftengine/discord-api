import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

export const getSupabaseClient = (env: Env) => {
	console.log(env)
	return createClient<Database>(env.SUPABASE_API_URL, env.SUPABASE_ANON_KEY)
}
