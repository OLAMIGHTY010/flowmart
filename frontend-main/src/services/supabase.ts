import { createClient } from '@supabase/supabase-js';

// Replace with actual keys or use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aws-1-eu-central-1.pooler.supabase.com'; // User's URL from earlier logs
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
