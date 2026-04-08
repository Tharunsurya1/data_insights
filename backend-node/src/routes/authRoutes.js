import express from "express";
import {
  login, signup,
  getAllUsers, updateUserRole, updateUserStatus, deleteUser, getUserStats,
  getMe, getPendingUsers, approveUser,
} from "../controllers/authController.js";
import { logEmployeeLogout } from "../controllers/activityController.js";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const jwt = await import("jsonwebtoken");
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || "secret");
      
      if (decoded.userId && decoded.email) {
        try {
          const sessionResult = await pool.query(
            `UPDATE user_sessions 
             SET logout_time = NOW(), 
                 total_duration_seconds = EXTRACT(EPOCH FROM (NOW() - login_time))::INT,
                 is_active = false 
             WHERE user_id = $1 AND is_active = true 
             RETURNING total_duration_seconds`,
            [decoded.userId]
          );
          
          const duration = sessionResult.rows[0]?.total_duration_seconds || 0;
          await logEmployeeLogout(decoded.userId, decoded.email.split('@')[0], decoded.email, duration);
        } catch (sessErr) {
          console.warn("Session update error:", sessErr.message);
          await logEmployeeLogout(decoded.userId, decoded.email.split('@')[0], decoded.email, 0);
        }
      }
    } catch (e) {}
  }
  res.json({ success: true, message: "Logged out" });
});

// Auth
router.post("/login", login);
router.post("/signup", signup);
router.get("/me", getMe);

// User management (admin)
router.get("/users", getAllUsers);
router.get("/users/stats", getUserStats);
router.get("/users/pending", getPendingUsers);
router.put("/users/:email/approve", approveUser);
router.put("/users/:email/role", updateUserRole);
router.put("/users/:email/status", updateUserStatus);
router.delete("/users/:email", deleteUser);

export default router;
