import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // Also serve public files at root for convenience
  app.use('/styles', express.static(path.join(process.cwd(), 'public/styles')));
  app.use('/scripts', express.static(path.join(process.cwd(), 'public/scripts')));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
