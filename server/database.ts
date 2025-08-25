import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://raqgobqbkgrhvcucrbhk.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcWdvYnFia2dyaHZjdWNyYmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDM2MTIsImV4cCI6MjA1MzExOTYxMn0.TGJ4LYWYHo6zFH0lG0jF5sEf-K5P0QKY_U7B_ZkR9Mc';

export const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL pool for direct database operations
export const pool = new Pool({
  host: 'db.raqgobqbkgrhvcucrbhk.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'S1u2p3!@',
  ssl: {
    rejectUnauthorized: false
  }
});

// Database initialization
export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Test connection first
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metro_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('general', 'women', 'elderly', 'disabled', 'pregnant')),
        has_luggage BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create seats table
    await pool.query(`
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
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metro_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES metro_users(id) ON DELETE CASCADE,
        seat_id VARCHAR(20) NOT NULL REFERENCES metro_seats(id) ON DELETE CASCADE,
        booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        amount DECIMAL(10,2) DEFAULT 25.00,
        status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled'))
      );
    `);

    // Initialize seats if empty
    const seatCount = await pool.query('SELECT COUNT(*) FROM metro_seats');
    if (parseInt(seatCount.rows[0].count) === 0) {
      console.log('Initializing seat data...');
      await initializeSeats();
    }

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.log('Database may not be available. App will run with limited functionality.');
    // Don't throw the error - let the app continue to run
  }
}

// Initialize seats data
async function initializeSeats() {
  const seats = [];
  
  for (let cabin = 1; cabin <= 5; cabin++) {
    let seatNumber = 1;
    for (let row = 1; row <= 10; row++) {
      for (let column = 1; column <= 2; column++) {
        seats.push({
          id: `${cabin}-${seatNumber}`,
          cabin,
          seat_number: seatNumber,
          row_number: row,
          column_number: column,
          is_booked: Math.random() > 0.8 // Randomly book some seats for demo
        });
        seatNumber++;
      }
    }
  }

  // Insert seats in batches
  for (const seat of seats) {
    await pool.query(
      'INSERT INTO metro_seats (id, cabin, seat_number, row_number, column_number, is_booked) VALUES ($1, $2, $3, $4, $5, $6)',
      [seat.id, seat.cabin, seat.seat_number, seat.row_number, seat.column_number, seat.is_booked]
    );
  }

  console.log(`Initialized ${seats.length} seats`);
}

// Database queries
export const db = {
  // User operations
  async createUser(email: string, passwordHash: string, userType: string, hasLuggage: boolean) {
    const result = await pool.query(
      'INSERT INTO metro_users (email, password_hash, user_type, has_luggage) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, passwordHash, userType, hasLuggage]
    );
    return result.rows[0];
  },

  async getUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM metro_users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(`
      SELECT 
        u.*,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.amount), 0) as total_spent
      FROM metro_users u
      LEFT JOIN metro_bookings b ON u.id = b.user_id AND b.status = 'confirmed'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  },

  // Seat operations
  async getAllSeats() {
    const result = await pool.query(`
      SELECT 
        s.*,
        u.email as booked_by_email,
        u.user_type as booked_by_type
      FROM metro_seats s
      LEFT JOIN metro_users u ON s.booked_by = u.id
      ORDER BY s.cabin, s.seat_number
    `);
    return result.rows;
  },

  async getSeatsByCabin(cabin: number) {
    const result = await pool.query(
      'SELECT * FROM metro_seats WHERE cabin = $1 ORDER BY seat_number',
      [cabin]
    );
    return result.rows;
  },

  async bookSeats(userId: string, seatIds: string[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update seats
      for (const seatId of seatIds) {
        await client.query(
          'UPDATE metro_seats SET is_booked = TRUE, booked_by = $1 WHERE id = $2 AND is_booked = FALSE',
          [userId, seatId]
        );
      }
      
      // Create bookings
      for (const seatId of seatIds) {
        await client.query(
          'INSERT INTO metro_bookings (user_id, seat_id) VALUES ($1, $2)',
          [userId, seatId]
        );
      }
      
      await client.query('COMMIT');
      return { success: true, bookedSeats: seatIds.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserBookings(userId: string) {
    const result = await pool.query(`
      SELECT 
        b.*,
        s.cabin,
        s.seat_number,
        s.row_number,
        s.column_number
      FROM metro_bookings b
      JOIN metro_seats s ON b.seat_id = s.id
      WHERE b.user_id = $1 AND b.status = 'confirmed'
      ORDER BY b.booking_date DESC
    `, [userId]);
    return result.rows;
  },

  // Admin queries
  async getBookingStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(DISTINCT user_id) as unique_passengers,
        SUM(amount) as total_revenue,
        COUNT(*) FILTER (WHERE booking_date >= NOW() - INTERVAL '24 hours') as bookings_today
      FROM metro_bookings
      WHERE status = 'confirmed'
    `);
    return result.rows[0];
  },

  async getCabinOccupancy() {
    const result = await pool.query(`
      SELECT 
        cabin,
        COUNT(*) as total_seats,
        COUNT(*) FILTER (WHERE is_booked = true) as booked_seats,
        ROUND((COUNT(*) FILTER (WHERE is_booked = true) * 100.0 / COUNT(*)), 1) as occupancy_rate
      FROM metro_seats
      GROUP BY cabin
      ORDER BY cabin
    `);
    return result.rows;
  }
};
