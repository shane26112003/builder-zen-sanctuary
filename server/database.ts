import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://raqgobqbkgrhvcucrbhk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcWdvYnFia2dyaHZjdWNyYmhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg0NjQ1OSwiZXhwIjoyMDcxNDIyNDU5fQ.oKq_BlIL1IDwIbV6kO4sbUS2W3tnULRfSmxaVU2NK_M';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use Supabase client for database operations (no need for separate pool)
export const pool = null; // Deprecated - using Supabase client instead

// Database initialization using Supabase
export async function initializeDatabase() {
  try {
    console.log('Initializing database with Supabase...');

    // Test connection
    const { data, error } = await supabase.from('metro_users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist, which is fine
      console.log('Database connection successful');
    }

    // Check if seats table exists and has data
    const { data: seatData, error: seatError } = await supabase
      .from('metro_seats')
      .select('id')
      .limit(1);

    if (seatError && seatError.code === 'PGRST116') {
      console.log('Tables need to be created manually in Supabase dashboard');
      console.log('Please create the tables using the SQL provided in the documentation');
    } else if (!seatData || seatData.length === 0) {
      console.log('Initializing seat data...');
      await initializeSeats();
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.log('Database may not be available. App will run with limited functionality.');
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
