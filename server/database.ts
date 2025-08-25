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

  // Insert seats using Supabase client
  const { data, error } = await supabase
    .from('metro_seats')
    .insert(seats);

  if (error) {
    console.error('Error inserting seats:', error);
  } else {
    console.log(`Initialized ${seats.length} seats`);
  }
}

// Database queries using Supabase client
export const db = {
  // User operations
  async createUser(email: string, passwordHash: string, userType: string, hasLuggage: boolean) {
    const { data, error } = await supabase
      .from('metro_users')
      .insert([{
        email,
        password_hash: passwordHash,
        user_type: userType,
        has_luggage: hasLuggage
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('metro_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('metro_users')
      .select(`
        *,
        metro_bookings(id, amount, status)
      `);

    if (error) throw error;

    // Calculate totals
    return data.map(user => ({
      ...user,
      total_bookings: user.metro_bookings?.filter(b => b.status === 'confirmed').length || 0,
      total_spent: user.metro_bookings?.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0
    }));
  },

  // Seat operations
  async getAllSeats() {
    const { data, error } = await supabase
      .from('metro_seats')
      .select(`
        *,
        booked_by_user:metro_users(email, user_type)
      `)
      .order('cabin')
      .order('seat_number');

    if (error) throw error;
    return data;
  },

  async getSeatsByCabin(cabin: number) {
    const { data, error } = await supabase
      .from('metro_seats')
      .select('*')
      .eq('cabin', cabin)
      .order('seat_number');

    if (error) throw error;
    return data;
  },

  async bookSeats(userId: string, seatIds: string[]) {
    try {
      // Update seats
      const { error: updateError } = await supabase
        .from('metro_seats')
        .update({ is_booked: true, booked_by: userId })
        .in('id', seatIds)
        .eq('is_booked', false);

      if (updateError) throw updateError;

      // Create bookings
      const bookings = seatIds.map(seatId => ({
        user_id: userId,
        seat_id: seatId,
        amount: 25.00
      }));

      const { error: bookingError } = await supabase
        .from('metro_bookings')
        .insert(bookings);

      if (bookingError) throw bookingError;

      return { success: true, bookedSeats: seatIds.length };
    } catch (error) {
      throw error;
    }
  },

  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('metro_bookings')
      .select(`
        *,
        metro_seats(cabin, seat_number, row_number, column_number)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Admin queries
  async getBookingStats() {
    const { data: bookings, error } = await supabase
      .from('metro_bookings')
      .select('*')
      .eq('status', 'confirmed');

    if (error) throw error;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = {
      total_bookings: bookings.length,
      unique_passengers: new Set(bookings.map(b => b.user_id)).size,
      total_revenue: bookings.reduce((sum, b) => sum + parseFloat(b.amount), 0),
      bookings_today: bookings.filter(b => new Date(b.booking_date) >= today).length
    };

    return stats;
  },

  async getCabinOccupancy() {
    const { data: seats, error } = await supabase
      .from('metro_seats')
      .select('*');

    if (error) throw error;

    const cabinStats = {};
    seats.forEach(seat => {
      if (!cabinStats[seat.cabin]) {
        cabinStats[seat.cabin] = { total: 0, booked: 0 };
      }
      cabinStats[seat.cabin].total++;
      if (seat.is_booked) {
        cabinStats[seat.cabin].booked++;
      }
    });

    return Object.keys(cabinStats).map(cabin => ({
      cabin: parseInt(cabin),
      total_seats: cabinStats[cabin].total,
      booked_seats: cabinStats[cabin].booked,
      occupancy_rate: ((cabinStats[cabin].booked / cabinStats[cabin].total) * 100).toFixed(1)
    }));
  }
};
