// Auth middleware - checks JWT token or creates demo user

import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (token) {
      // Verify token and get user from database
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const userResult = await pool.query(
        "SELECT user_id, email, name FROM users WHERE email = $1",
        [decoded.email]
      );
      
      if (userResult.rows.length > 0) {
        req.user = {
          id: userResult.rows[0].user_id,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name,
          role: decoded.role || "viewer",
        };
        return next();
      }
      
      // User not found in database - continue to demo fallback
    }
    
    // If no valid token, user not found, or token error, create/find demo user
    const demoEmail = "tharunmellacheruvu@gmail.com";
    let demoUser = await pool.query("SELECT user_id, email, name FROM users WHERE email = $1", [demoEmail]);
    
    if (demoUser.rows.length === 0) {
      // Try default company user
      demoEmail = "demo@example.com";
      demoUser = await pool.query("SELECT user_id, email, name FROM users WHERE email = $1", [demoEmail]);
    }
    
    if (demoUser.rows.length === 0) {
      // Create demo user
      const companyUuid = "00000000-0000-0000-0000-000000000001";
      demoUser = await pool.query(
        "INSERT INTO users (user_id, email, name, company_id, is_active) VALUES (gen_random_uuid(), $1, $2, $3, true) RETURNING user_id, email, name",
        [demoEmail, "Demo User", companyUuid]
      );
    }
    
    req.user = {
      id: demoUser.rows[0].user_id,
      email: demoUser.rows[0].email,
      name: demoUser.rows[0].name,
      role: "admin",
    };
    
    next();
  } catch (err) {
    // Token invalid or error - still allow with demo user
    const demoEmail = "tharunmellacheruvu@gmail.com";
    let demoUser = await pool.query("SELECT user_id, email, name FROM users WHERE email = $1", [demoEmail]);
    
    if (demoUser.rows.length === 0) {
      demoUser = await pool.query("SELECT user_id, email, name FROM users WHERE email = $1", ["demo@example.com"]);
    }
    
    if (demoUser.rows.length > 0) {
      req.user = {
        id: demoUser.rows[0].user_id,
        email: demoUser.rows[0].email,
        name: demoUser.rows[0].name,
        role: "admin",
      };
    } else {
      req.user = {
        id: "demo-user",
        email: "demo@example.com",
        name: "Demo User",
        role: "admin",
      };
    }
    next();
  }
};