/* Supabase Initialization */
const SUPABASE_URL = 'https://zjpqfeetzvfxhfcgrgon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ExsK1_PS2ze09xODoatE6g_ErSFZRuF';

// Create a globally available client instance named supabaseClient
// This avoids shadowing the 'supabase' object provided by the CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("Supabase client initialized.");
