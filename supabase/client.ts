import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const development = true;
export const JWT_SECRET = 'ncjn3kqBv9eODXXpKYW9GbvZcT6gswzg9w+6/Jbty+DcQvxz9ZUDr0UpmBet6tFV4CwAVB7lmNiI71r5JC1h7g==';

export const SUPABASE_SERVICE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW1kY3J5Z2NlZXBheWJvcGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTI0OTI5NywiZXhwIjoyMDQ0ODI1Mjk3fQ.8hgwf4OWuqC6rj9Fj3tbICLt7BgAom9h08-cXUZxl1M';

export const SUPABASE_ANON_KEY = development
	? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
	: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW1kY3J5Z2NlZXBheWJvcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNDkyOTcsImV4cCI6MjA0NDgyNTI5N30.MLWBkkBnDNmeMAT5MsdA7pexOW5h4dMSw_zAWJlhtZc';
export const SUPABASE_API_URL = development ? 'http://127.0.0.1:54421' : 'https://nsymdcrygceepaybopcr.supabase.co';

export const getSupabaseClient = () => createClient<Database>(SUPABASE_API_URL, SUPABASE_ANON_KEY);
