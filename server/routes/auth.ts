import { RequestHandler } from "express";
import { db } from "../database";
import crypto from "crypto";

// Login with database validation
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Get user from database
    const user = await db.getUserByEmail(email);

    if (!user) {
      // Create a new user if they don't exist (demo mode)
      const hashedPassword = hashPassword(password);
      const newUser = await db.createUser(
        email,
        hashedPassword,
        "general",
        false,
      );

      return res.json({
        success: true,
        user: newUser,
      });
    }

    // Verify password (simple comparison for demo)
    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Update user type
export const handleUpdateUserType: RequestHandler = async (req, res) => {
  try {
    const { userId, userType, hasLuggage } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        error: "User ID and user type are required",
      });
    }

    // For now, we'll update via a direct database query
    // In a real app, you'd want proper user authentication here
    const { error } = await db.supabase
      .from("metro_users")
      .update({
        user_type: userType,
        has_luggage: hasLuggage || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Update user type error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update user type",
      });
    }

    // Get the updated user
    const { data: updatedUser } = await db.supabase
      .from("metro_users")
      .select("*")
      .eq("id", userId)
      .single();

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user type error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Create user profile for Supabase auth users
export const handleCreateProfile: RequestHandler = async (req, res) => {
  try {
    const {
      userId,
      email,
      userType = "general",
      hasLuggage = false,
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: "User ID and email are required",
      });
    }

    // Check if user already exists
    const { data: existingUser } = await db.supabase
      .from("metro_users")
      .select("*")
      .eq("id", userId)
      .single();

    if (existingUser) {
      return res.json({
        success: true,
        user: existingUser,
      });
    }

    // Create new user profile
    const { data: newUser, error } = await db.supabase
      .from("metro_users")
      .insert([
        {
          id: userId,
          email,
          password_hash: "supabase_auth", // Placeholder since Supabase handles auth
          user_type: userType,
          has_luggage: hasLuggage,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create profile error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create user profile",
      });
    }

    res.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Simple hash function for demo purposes
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}
