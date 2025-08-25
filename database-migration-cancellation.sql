-- Database Migration: Add Booking Cancellation Support
-- Run this SQL in your Supabase SQL Editor to add cancellation functionality

-- Add cancelled_at field to metro_bookings table
ALTER TABLE metro_bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update status check constraint to include cancelled
ALTER TABLE metro_bookings 
DROP CONSTRAINT IF EXISTS metro_bookings_status_check;

ALTER TABLE metro_bookings 
ADD CONSTRAINT metro_bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled'));

-- Create indexes for better performance on cancelled bookings
CREATE INDEX IF NOT EXISTS idx_metro_bookings_status 
ON metro_bookings(status);

CREATE INDEX IF NOT EXISTS idx_metro_bookings_cancelled_at 
ON metro_bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'metro_bookings' 
ORDER BY ordinal_position;
