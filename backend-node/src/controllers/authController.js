import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { logEmployeeLogin } from "./activityController.js";

// ── Utility: dynamic bcrypt import (falls back gracefully) ──
let bcryptLib = null;
const loadBcrypt = async () => {
  if (bcryptLib) return bcryptLib;
  try {
    bcryptLib = (await import("bcryptjs")).default;
  } catch {
    try {
      bcryptLib = (await import("bcrypt")).default;
    } catch {
      // Fallback: no hashing available — plaintext comparison (dev only)
      bcryptLib = {
        hash: async (pw) => pw,
        compare: async (pw, hash) => pw === hash,
      };
      console.warn("⚠ bcrypt/bcryptjs not installed — passwords stored in plaintext (DEV ONLY)");
    }
  }
  return bcryptLib;
};

const SALT_ROUNDS = 12;

function generateInitials(name) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#c84b2f", "#1d4ed8", "#2d6a4f", "#b45309", "#7c3aed", "#0891b2", "#dc2626", "#059669"];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SIGNUP — Enterprise (firstName, lastName, phone, email, password)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const signup = async (req, res) => {
  const { email, password, role, firstName, lastName, phone, name, companyId } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });
  if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const bcrypt = await loadBcrypt();

    // Check if user already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      // Verify password for existing users
      if (user.password_hash) {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return res.status(401).json({ message: "Account already exists. Please sign in instead." });
        }
      }

      const userRoles = await pool.query(
        "SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1",
        [user.user_id]
      );
      const resolvedRole = userRoles.rows.length > 0 ? userRoles.rows[0].role_name : "viewer";
      const token = jwt.sign(
        { email, role: resolvedRole, userId: user.user_id },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1d" }
      );
      return res.json({ token, role: resolvedRole, name: user.name, email });
    }

    // Build full name
    const fullName = (firstName && lastName)
      ? `${firstName.trim()} ${lastName.trim()}`
      : name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    const companyUuid = companyId || "00000000-0000-0000-0000-000000000001";

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // For employee/signup, default to inactive (pending approval)
    // For admin, default to active
    const isActive = role === "admin" ? true : false;

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (user_id, email, name, first_name, last_name, phone, password_hash, company_id, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, name`,
      [email, fullName, firstName || null, lastName || null, phone || null, passwordHash, companyUuid, isActive]
    );

    // Map role — "employee" maps to "analyst" in DB, "admin" stays "admin"
    const dbRole = role === "employee" ? "analyst" : (role || "viewer");
    const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [dbRole]);
    if (roleResult.rows.length > 0) {
      await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
        [newUser.rows[0].user_id, roleResult.rows[0].role_id]
      );
    }

    const resolvedRole = role === "admin" ? "admin" : "employee";
    const token = jwt.sign(
      { email, role: resolvedRole, userId: newUser.rows[0].user_id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );
    res.json({
      token,
      role: resolvedRole,
      name: fullName,
      email,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LOGIN — Enterprise (email + password with bcrypt)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  if (!password) return res.status(400).json({ message: "Password is required" });

  try {
    const bcrypt = await loadBcrypt();

    const result = await pool.query(
      `SELECT u.*, r.role_name FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Verify password
    if (user.password_hash) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    }

    // Check if account is active - for non-admin users, check if they're pending approval
    if (!user.is_active) {
      // Check if it's a new user pending approval
      const userRoles = await pool.query(
        "SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1",
        [user.user_id]
      );
      const dbRole = userRoles.rows.length > 0 ? userRoles.rows[0].role_name : "viewer";

      if (dbRole !== "admin") {
        return res.status(403).json({
          message: "Account pending approval. Please contact your administrator to activate your account.",
          pending: true
        });
      }
      return res.status(403).json({ message: "Account is deactivated. Contact your administrator." });
    }

    // Resolve role
    const userRoles = await pool.query(
      "SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1",
      [user.user_id]
    );

    const dbRole = userRoles.rows.length > 0 ? userRoles.rows[0].role_name : "viewer";

    // Map DB roles to frontend roles: admin stays admin, everything else = employee
    const frontendRole = dbRole === "admin" ? "admin" : "employee";

    // If user tried admin login but isn't admin
    if (role === "admin" && frontendRole !== "admin") {
      return res.status(403).json({ message: "This account is not authorized for admin access" });
    }

    const token = jwt.sign(
      { email, role: frontendRole, userId: user.user_id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    try {
      await pool.query(
        `INSERT INTO user_sessions (user_id, user_email, is_active) VALUES ($1, $2, true)`,
        [user.user_id, user.email]
      );
    } catch (sessErr) {
      console.warn("Session creation error:", sessErr.message);
    }

    await logEmployeeLogin(user.user_id, user.name, user.email);

    res.json({
      token,
      role: frontendRole,
      name: user.name,
      email,
      userId: user.user_id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET ALL USERS (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllUsers = async (req, res) => {
  const roleFilter = req.query.role;
  try {
    let query = `
      SELECT u.user_id, u.email, u.name, u.first_name, u.last_name, u.phone,
             u.is_active, u.created_at,
             r.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
    `;

    if (roleFilter && roleFilter !== "all") {
      query += ` WHERE r.role_name = $1`;
      const result = await pool.query(query, [roleFilter]);
      return res.json({ success: true, users: formatUsers(result.rows), count: result.rows.length });
    }

    const result = await pool.query(query);
    res.json({ success: true, users: formatUsers(result.rows), count: result.rows.length });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

function formatUsers(rows) {
  return rows.map(u => ({
    ...u,
    initials: generateInitials(u.name || u.email),
    color: AVATAR_COLORS[Math.abs(hashCode(u.email)) % AVATAR_COLORS.length],
    role: u.role_name === "admin" ? "admin" : "employee",
  }));
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UPDATE USER ROLE (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const updateUserRole = async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  const validRoles = ["admin", "analyst", "viewer", "employee"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
  }

  // Map "employee" → "analyst" for DB
  const dbRole = role === "employee" ? "analyst" : role;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [dbRole]);
    if (roleResult.rows.length === 0) return res.status(400).json({ success: false, message: "Role not found in database" });

    await pool.query("DELETE FROM user_roles WHERE user_id = $1", [user.rows[0].user_id]);
    await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [user.rows[0].user_id, roleResult.rows[0].role_id]
    );

    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UPDATE USER STATUS (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const updateUserStatus = async (req, res) => {
  const { email } = req.params;
  const { status } = req.body;

  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET is_active = $1 WHERE email = $2 RETURNING *",
      [status === "active", email]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE USER (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const deleteUser = async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE email = $1 RETURNING *", [email]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  USER STATS (Admin Dashboard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getUserStats = async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) as count FROM users");
    const active = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = true");
    const inactive = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = false");
    const byRole = await pool.query(`
      SELECT r.role_name, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.role_id = ur.role_id
      GROUP BY r.role_name
    `);

    res.json({
      success: true,
      stats: {
        total: parseInt(total.rows[0].count),
        active: parseInt(active.rows[0].count),
        inactive: parseInt(inactive.rows[0].count),
        byRole: Object.fromEntries(byRole.rows.map(r => [r.role_name, parseInt(r.count) || 0])),
      },
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET ME (Token-based identity)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMe = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await pool.query(
      "SELECT user_id, email, name, first_name, last_name, phone, is_active, created_at FROM users WHERE email = $1",
      [decoded.email]
    );
    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const userRoles = await pool.query(
      "SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1",
      [user.rows[0].user_id]
    );

    const dbRole = userRoles.rows.length > 0 ? userRoles.rows[0].role_name : "viewer";
    const frontendRole = dbRole === "admin" ? "admin" : "employee";

    res.json({
      success: true,
      user: {
        ...user.rows[0],
        role: frontendRole,
        initials: generateInitials(user.rows[0].name || user.rows[0].email),
      },
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET PENDING USERS (Admin - for approval queue)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.email, u.name, u.first_name, u.last_name, u.phone, 
             u.is_active, u.created_at, r.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.is_active = false
      ORDER BY u.created_at DESC
    `);
    res.json({
      success: true,
      users: formatUsers(result.rows).map(u => ({ ...u, status: 'pending' })),
      count: result.rows.length
    });
  } catch (err) {
    console.error("getPendingUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  APPROVE USER (Admin - activate account)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const approveUser = async (req, res) => {
  const { email } = req.params;
  const { approved } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (approved) {
      // Activate the user
      await pool.query(
        "UPDATE users SET is_active = true WHERE email = $1",
        [email]
      );
      res.json({ success: true, message: "User approved and activated" });
    } else {
      // Reject - delete the user
      await pool.query("DELETE FROM user_roles WHERE user_id = $1", [user.rows[0].user_id]);
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
      res.json({ success: true, message: "User registration rejected and removed" });
    }
  } catch (err) {
    console.error("approveUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
