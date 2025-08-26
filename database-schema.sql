-- MetroReserve Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create metro_users table
CREATE TABLE IF NOT EXISTS metro_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'general',
    has_luggage BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metro_seats table
CREATE TABLE IF NOT EXISTS metro_seats (
    id VARCHAR(20) PRIMARY KEY,
    cabin INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    row_number INTEGER NOT NULL,
    column_number INTEGER NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    booked_by UUID REFERENCES metro_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metro_bookings table
CREATE TABLE IF NOT EXISTS metro_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES metro_users(id) ON DELETE CASCADE,
    seat_id VARCHAR(20) NOT NULL REFERENCES metro_seats(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    status VARCHAR(20) DEFAULT 'confirmed',
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metro_users_email ON metro_users(email);
CREATE INDEX IF NOT EXISTS idx_metro_seats_cabin ON metro_seats(cabin);
CREATE INDEX IF NOT EXISTS idx_metro_seats_booked ON metro_seats(is_booked);
CREATE INDEX IF NOT EXISTS idx_metro_bookings_user ON metro_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_metro_bookings_seat ON metro_bookings(seat_id);
CREATE INDEX IF NOT EXISTS idx_metro_bookings_date ON metro_bookings(booking_date);

-- Insert initial seat data
INSERT INTO metro_seats (id, cabin, seat_number, row_number, column_number, is_booked)
SELECT 
    cabin || '-' || seat_number as id,
    cabin,
    seat_number,
    ((seat_number - 1) / 2) + 1 as row_number,
    ((seat_number - 1) % 2) + 1 as column_number,
    CASE WHEN random() > 0.8 THEN true ELSE false END as is_booked
FROM 
    generate_series(1, 5) as cabin,
    generate_series(1, 20) as seat_number
ON CONFLICT (id) DO NOTHING;

-- Create RLS (Row Level Security) policies for security
ALTER TABLE metro_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_bookings ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data (for backend operations)
CREATE POLICY "Service role can access metro_users" ON metro_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access metro_seats" ON metro_seats
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access metro_bookings" ON metro_bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read seat data
CREATE POLICY "Users can read seats" ON metro_seats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to view their own bookings
CREATE POLICY "Users can view own bookings" ON metro_bookings
    FOR SELECT USING (auth.uid()::text = user_id::text);
