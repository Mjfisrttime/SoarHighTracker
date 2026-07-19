-- Run this in your Supabase SQL Editor to create the new attendance_sessions table

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(group_id, date)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read sessions (so members can see if one is open)
CREATE POLICY "Enable read access for all authenticated users"
ON public.attendance_sessions FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert/update sessions (Admin control)
CREATE POLICY "Enable insert for authenticated users"
ON public.attendance_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON public.attendance_sessions FOR UPDATE
TO authenticated
USING (true);
