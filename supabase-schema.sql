-- MetroReserve Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS metro_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('general', 'women', 'elderly', 'disabled', 'pregnant')),
  has_luggage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seats table
CREATE TABLE IF NOT EXISTS metro_seats (
  id VARCHAR(20) PRIMARY KEY,
  cabin INTEGER NOT NULL CHECK (cabin BETWEEN 1 AND 5),
  seat_number INTEGER NOT NULL,
  row_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL CHECK (column_number BETWEEN 1 AND 2),
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES metro_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cabin, seat_number)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS metro_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES metro_users(id) ON DELETE CASCADE,
  seat_id VARCHAR(20) NOT NULL REFERENCES metro_seats(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(10,2) DEFAULT 25.00,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metro_seats_cabin ON metro_seats(cabin);
CREATE INDEX IF NOT EXISTS idx_metro_seats_booked ON metro_seats(is_booked);
CREATE INDEX IF NOT EXISTS idx_metro_bookings_user ON metro_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_metro_bookings_date ON metro_bookings(booking_date);

-- Enable Row Level Security (RLS)
ALTER TABLE metro_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Allow service role to do everything (for admin functions)
CREATE POLICY "Service role can do everything on metro_users" ON metro_users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on metro_seats" ON metro_seats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on metro_bookings" ON metro_bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon users to read seats (for public booking interface)
CREATE POLICY "Anyone can read seats" ON metro_seats
  FOR SELECT USING (true);

-- Insert initial seat data (100 seats across 5 cabins)
INSERT INTO metro_seats (id, cabin, seat_number, row_number, column_number, is_booked)
SELECT 
  cabin || '-' || seat_number as id,
  cabin,
  seat_number,
  ((seat_number - 1) / 2) + 1 as row_number,
  ((seat_number - 1) % 2) + 1 as column_number,
  CASE WHEN random() > 0.8 THEN true ELSE false END as is_booked
FROM (
  SELECT 
    cabin,
    generate_series(1, 20) as seat_number
  FROM generate_series(1, 5) as cabin
) seats_data;

-- Create a function to get cabin occupancy stats
CREATE OR REPLACE FUNCTION get_cabin_occupancy()
RETURNS TABLE (
  cabin INTEGER,
  total_seats BIGINT,
  booked_seats BIGINT,
  occupancy_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.cabin,
    COUNT(*) as total_seats,
    COUNT(*) FILTER (WHERE s.is_booked = true) as booked_seats,
    ROUND((COUNT(*) FILTER (WHERE s.is_booked = true) * 100.0 / COUNT(*)), 1) as occupancy_rate
  FROM metro_seats s
  GROUP BY s.cabin
  ORDER BY s.cabin;
END;
$$ LANGUAGE plpgsql;
