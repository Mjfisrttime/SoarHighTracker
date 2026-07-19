import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjpqfeetzvfxhfcgrgon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ExsK1_PS2ze09xODoatE6g_ErSFZRuF';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
