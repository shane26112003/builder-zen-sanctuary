import { RequestHandler } from "express";
import { db } from "../database";

// Admin authorization middleware
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const authHeader = req.headers.authorization;

    // For demo purposes, allow admin access with specific email patterns
    // In production, you'd want proper role-based authentication
    
    let isAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If using bearer token, validate it here
      // For now, we'll accept any bearer token as admin
      isAdmin = true;
    } else if (userId) {
      // Check if user has admin role in database
      const user = await db.supabase
        .from("metro_users")
        .select("email, user_type")
        .eq("id", userId)
        .single();

      if (user.data && (
        user.data.email.includes("admin") || 
        user.data.email.includes("manager") ||
        user.data.user_type === "admin"
      )) {
        isAdmin = true;
      }
    }

    // For demo purposes, also allow admin access from specific email patterns in query
    const { adminEmail } = req.query;
    if (adminEmail && (
      adminEmail.toString().includes("admin") || 
      adminEmail.toString().includes("manager")
    )) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({
      success: false,
      error: "Authorization check failed"
    });
  }
};

// Check if user is admin (non-blocking)
export const checkAdminStatus: RequestHandler = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.json({
        success: true,
        isAdmin: false
      });
    }

    const emailStr = email.toString().toLowerCase();
    const isAdmin = emailStr.includes("admin") || 
                   emailStr.includes("manager") ||
                   emailStr.endsWith("@metroreserve.admin");

    res.json({
      success: true,
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error("Admin status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check admin status"
    });
  }
};
