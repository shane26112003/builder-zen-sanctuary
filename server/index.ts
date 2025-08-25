import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleUpdateUserType, handleCreateProfile } from "./routes/auth";
import {
  handleGetSeats,
  handleBookSeats,
  handleGetUserBookings,
  handleGetCabinInfo,
} from "./routes/booking";
import {
  handleGetAllPassengers,
  handleGetBookingStats,
  handleGetRecentBookings,
  handleSearchPassengers,
} from "./routes/admin";
import { initializeDatabase } from "./database";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  app.use("/public", express.static(path.join(process.cwd(), "public")));

  // Also serve public files at root for convenience
  app.use("/styles", express.static(path.join(process.cwd(), "public/styles")));
  app.use(
    "/scripts",
    express.static(path.join(process.cwd(), "public/scripts")),
  );

  // Initialize database
  initializeDatabase().catch(console.error);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/update-user-type", handleUpdateUserType);

  // Booking routes
  app.get("/api/seats", handleGetSeats);
  app.post("/api/seats/book", handleBookSeats);
  app.get("/api/bookings/:userId", handleGetUserBookings);
  app.get("/api/cabins/info", handleGetCabinInfo);

  // Admin routes
  app.get("/api/admin/passengers", handleGetAllPassengers);
  app.get("/api/admin/stats", handleGetBookingStats);
  app.get("/api/admin/recent-bookings", handleGetRecentBookings);
  app.get("/api/admin/search", handleSearchPassengers);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
