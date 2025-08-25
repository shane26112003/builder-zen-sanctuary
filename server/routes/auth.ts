import { RequestHandler } from "express";
import { db } from "../database";
import crypto from "crypto";

// Simple password hashing (for demo purposes - use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'metro-salt', 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  const testHash = hashPassword(password);
  return testHash === hash;
}

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    let user = await db.getUserByEmail(email);
    
    if (user) {
      // Verify password
      if (!verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Create new user (auto-registration for demo)
      const passwordHash = hashPassword(password);
      user = await db.createUser(email, passwordHash, 'general', false);
    }

    // Return user data (excluding password)
    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleUpdateUserType: RequestHandler = async (req, res) => {
  try {
    const { userId, userType, hasLuggage } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    // Update user type
    const result = await db.pool.query(
      'UPDATE metro_users SET user_type = $1, has_luggage = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [userType, hasLuggage || false, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = result.rows[0];
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Update user type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
