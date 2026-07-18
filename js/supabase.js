/* Supabase Initialization */
const SUPABASE_URL = 'https://zjpqfeetzyfxhfcgrgon.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcHFmZWV0enZmeGhmY2dyZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODAxODAsImV4cCI6MjA5OTk1NjE4MH0.yANoEbCVoF_s3WFjO3BSNVfANJoYf9Rl8IJC7nEdIJM';

let supabase;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized.");
} else {
    console.warn("Supabase credentials are not set in js/supabase.js!");
}
