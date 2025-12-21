import { createClient } from '@supabase/supabase-js';

/**
 * Configuration for the Supabase client.
 * Environment variables must be set in the deployment environment.
 * SUPABASE_URL: The API URL of your project (e.g., https://xyz.supabase.co)
 * SUPABASE_ANON_KEY: The public 'anon' key for your project.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Validates if the required environment variables are present and correctly formatted.
 */
export const isSupabaseConfigured = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.length > 0 && 
  supabaseUrl.startsWith('http') &&
  typeof supabaseAnonKey === 'string' && 
  supabaseAnonKey.length > 0;

/**
 * The Supabase client instance.
 * It is only instantiated if the environment variables are valid to prevent "supabaseUrl is required" errors.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/**
 * Helper function to test the connection status.
 */
export const checkConnection = async () => {
  if (!supabase) {
    return { status: 'error', message: 'Supabase environment variables are missing.' };
  }
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return { status: 'ok', message: 'Supabase connection established.' };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
};
