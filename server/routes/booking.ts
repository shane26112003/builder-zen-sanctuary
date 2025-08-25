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

    // Verify user exists
    const user = await db.pool.query(
      "SELECT * FROM metro_users WHERE id = $1",
      [userId],
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user can access the selected seats
    const userData = user.rows[0];
    const seatDetails = await db.pool.query(
      "SELECT * FROM metro_seats WHERE id = ANY($1)",
      [seatIds],
    );

    for (const seat of seatDetails.rows) {
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
