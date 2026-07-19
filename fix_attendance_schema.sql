-- Run this in your Supabase SQL Editor to fix the attendance table schema

-- 1. Add the missing group_id column
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 2. Add the unique constraint we need for the upsert to work correctly
-- (This ensures a user can't be marked present twice for the same group on the same day)
ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_user_id_date_key; -- Drops the old one if it exists

ALTER TABLE public.attendance
ADD CONSTRAINT attendance_user_id_group_id_date_key UNIQUE (user_id, group_id, date);
