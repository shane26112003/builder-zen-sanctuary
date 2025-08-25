import { RequestHandler } from "express";
import { db } from "../database";

export const handleGetAllPassengers: RequestHandler = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({
      success: true,
      passengers: users.map(user => ({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        has_luggage: user.has_luggage,
        total_bookings: parseInt(user.total_bookings) || 0,
        total_spent: parseFloat(user.total_spent) || 0,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get all passengers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleGetBookingStats: RequestHandler = async (req, res) => {
  try {
    const stats = await db.getBookingStats();
    const cabinOccupancy = await db.getCabinOccupancy();
    
    res.json({
      success: true,
      stats: {
        total_bookings: parseInt(stats.total_bookings) || 0,
        unique_passengers: parseInt(stats.unique_passengers) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0,
        bookings_today: parseInt(stats.bookings_today) || 0,
        cabin_occupancy: cabinOccupancy
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleGetRecentBookings: RequestHandler = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT 
        b.id,
        b.booking_date,
        b.amount,
        u.email,
        u.user_type,
        s.cabin,
        s.seat_number
      FROM metro_bookings b
      JOIN metro_users u ON b.user_id = u.id
      JOIN metro_seats s ON b.seat_id = s.id
      WHERE b.status = 'confirmed'
      ORDER BY b.booking_date DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      recent_bookings: result.rows
    });
  } catch (error) {
    console.error('Get recent bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleSearchPassengers: RequestHandler = async (req, res) => {
  try {
    const { query, userType } = req.query;
    
    let sqlQuery = `
      SELECT 
        u.*,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.amount), 0) as total_spent
      FROM metro_users u
      LEFT JOIN metro_bookings b ON u.id = b.user_id AND b.status = 'confirmed'
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (query) {
      sqlQuery += ` AND u.email ILIKE $${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (userType && userType !== 'all') {
      sqlQuery += ` AND u.user_type = $${paramIndex}`;
      params.push(userType);
      paramIndex++;
    }

    sqlQuery += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT 100`;

    const result = await db.pool.query(sqlQuery, params);
    
    res.json({
      success: true,
      passengers: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        has_luggage: user.has_luggage,
        total_bookings: parseInt(user.total_bookings) || 0,
        total_spent: parseFloat(user.total_spent) || 0,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Search passengers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
