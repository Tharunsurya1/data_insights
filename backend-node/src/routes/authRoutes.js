import express from "express";
import {
  login, signup,
  getAllUsers, updateUserRole, updateUserStatus, deleteUser, getUserStats,
  getMe, getPendingUsers, approveUser,
} from "../controllers/authController.js";

const router = express.Router();

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
