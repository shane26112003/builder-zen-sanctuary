import { RequestHandler } from "express";
import { db } from "../database";

export const handleGetAllPassengers: RequestHandler = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({
      success: true,
      passengers: users.map((user) => ({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        has_luggage: user.has_luggage,
        total_bookings: parseInt(user.total_bookings) || 0,
        total_spent: parseFloat(user.total_spent) || 0,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error("Get all passengers error:", error);
    res.status(500).json({ error: "Internal server error" });
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
        cabin_occupancy: cabinOccupancy,
      },
    });
  } catch (error) {
    console.error("Get booking stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetRecentBookings: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("metro_bookings")
      .select(
        `
        id,
        booking_date,
        amount,
        metro_users(email, user_type),
        metro_seats(cabin, seat_number)
      `,
      )
      .eq("status", "confirmed")
      .order("booking_date", { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      recent_bookings: data.map((booking) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        amount: booking.amount,
        email: booking.metro_users?.email,
        user_type: booking.metro_users?.user_type,
        cabin: booking.metro_seats?.cabin,
        seat_number: booking.metro_seats?.seat_number,
      })),
    });
  } catch (error) {
    console.error("Get recent bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSearchPassengers: RequestHandler = async (req, res) => {
  try {
    const { query, userType } = req.query;

    let supabaseQuery = supabase
      .from("metro_users")
      .select(
        `
        *,
        metro_bookings(id, amount, status)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (query) {
      supabaseQuery = supabaseQuery.ilike("email", `%${query}%`);
    }

    if (userType && userType !== "all") {
      supabaseQuery = supabaseQuery.eq("user_type", userType);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;

    res.json({
      success: true,
      passengers: data.map((user) => ({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        has_luggage: user.has_luggage,
        total_bookings:
          user.metro_bookings?.filter((b) => b.status === "confirmed").length ||
          0,
        total_spent:
          user.metro_bookings
            ?.filter((b) => b.status === "confirmed")
            .reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error("Search passengers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
