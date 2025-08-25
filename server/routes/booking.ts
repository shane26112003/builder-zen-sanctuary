import { RequestHandler } from "express";
import { db } from "../database";

export const handleGetSeats: RequestHandler = async (req, res) => {
  try {
    const seats = await db.getAllSeats();
    res.json({
      success: true,
      seats: seats,
    });
  } catch (error) {
    console.error("Get seats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleBookSeats: RequestHandler = async (req, res) => {
  try {
    const { userId, seatIds } = req.body;

    if (
      !userId ||
      !seatIds ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "User ID and seat IDs are required" });
    }

    // Check if user can access the selected seats using Supabase
    const { data: seatDetails, error: seatError } = await db.supabase
      .from("metro_seats")
      .select("*")
      .in("id", seatIds);

    if (seatError) {
      return res.status(500).json({ error: "Error checking seats" });
    }

    // Get user data
    const { data: userData, error: userError } = await db.supabase
      .from("metro_users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    for (const seat of seatDetails) {
      if (seat.is_booked) {
        return res.status(400).json({
          error: `Seat ${seat.seat_number} in Cabin ${seat.cabin} is already booked`,
        });
      }

      // Check cabin restrictions
      if (
        seat.cabin === 1 &&
        userData.user_type !== "women" &&
        userData.user_type !== "pregnant"
      ) {
        return res.status(403).json({
          error: `Cabin 1 is women-only. Access denied for seat ${seat.seat_number}.`,
        });
      }

      if (seat.cabin === 2) {
        const allowedForPriorityCabin =
          userData.user_type === "pregnant" ||
          userData.user_type === "disabled" ||
          userData.user_type === "elderly" ||
          (userData.user_type === "women" && userData.has_luggage);

        if (!allowedForPriorityCabin) {
          return res.status(403).json({
            error: `Cabin 2 is for priority passengers only. Access denied for seat ${seat.seat_number}.`,
          });
        }
      }
    }

    // Book the seats
    const result = await db.bookSeats(userId, seatIds);

    res.json({
      success: true,
      message: `Successfully booked ${result.bookedSeats} seat(s)`,
      bookedSeats: result.bookedSeats,
    });
  } catch (error) {
    console.error("Book seats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetUserBookings: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const bookings = await db.getUserBookings(userId);
    res.json({
      success: true,
      bookings: bookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCancelBooking: RequestHandler = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body;

    if (!bookingId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: "Booking ID and User ID are required" 
      });
    }

    // Verify booking belongs to user and is not already cancelled
    const { data: booking, error: bookingError } = await db.supabase
      .from("metro_bookings")
      .select("*, metro_seats(*)")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ 
        success: false,
        error: "Booking not found or already cancelled" 
      });
    }

    // Start transaction: Cancel booking and free up seat
    const { error: cancelError } = await db.supabase
      .from("metro_bookings")
      .update({ 
        status: "cancelled",
        cancelled_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (cancelError) {
      return res.status(500).json({ 
        success: false,
        error: "Failed to cancel booking" 
      });
    }

    // Free up the seat
    const { error: seatError } = await db.supabase
      .from("metro_seats")
      .update({ 
        is_booked: false,
        booked_by: null
      })
      .eq("id", booking.seat_id);

    if (seatError) {
      console.error("Failed to free seat after cancellation:", seatError);
      // Note: In a real app, you'd want to rollback the booking cancellation
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      cancelledBooking: {
        id: booking.id,
        seat_id: booking.seat_id,
        amount: booking.amount,
        cancelled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

export const handleGetBookingTicket: RequestHandler = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.query;

    if (!bookingId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: "Booking ID and User ID are required" 
      });
    }

    // Get booking details with seat and user information
    const { data: booking, error: bookingError } = await db.supabase
      .from("metro_bookings")
      .select(`
        *,
        metro_seats(cabin, seat_number, row_number, column_number),
        metro_users(email, user_type, has_luggage)
      `)
      .eq("id", bookingId)
      .eq("user_id", userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ 
        success: false,
        error: "Booking not found" 
      });
    }

    // Format ticket data
    const ticket = {
      id: booking.id,
      bookingDate: booking.booking_date,
      status: booking.status,
      amount: booking.amount,
      passenger: {
        email: booking.metro_users.email,
        type: booking.metro_users.user_type,
        hasLuggage: booking.metro_users.has_luggage
      },
      seat: {
        id: booking.seat_id,
        cabin: booking.metro_seats.cabin,
        seatNumber: booking.metro_seats.seat_number,
        row: booking.metro_seats.row_number,
        column: booking.metro_seats.column_number
      },
      qrCode: `METRO-${booking.id}-${booking.seat_id}`,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    res.json({
      success: true,
      ticket: ticket
    });

  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

export const handleGetCabinInfo: RequestHandler = async (req, res) => {
  try {
    const occupancy = await db.getCabinOccupancy();
    res.json({
      success: true,
      cabins: occupancy,
    });
  } catch (error) {
    console.error("Get cabin info error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
