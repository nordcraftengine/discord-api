import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const SUPABASE_API_URL = 'https://nsymdcrygceepaybopcr.supabase.co'
const SUPABASE_SECRET_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW1kY3J5Z2NlZXBheWJvcGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg0Nzk4NCwiZXhwIjoyMDQ1NDIzOTg0fQ.xA3srlnG1LGenz-uQwGtakphMJZpzwMKNrrmRwsQcJ0'

export const getSupabaseClient = (env: Env) => {
	return createClient<Database>(SUPABASE_API_URL, SUPABASE_SECRET_KEY)
}
