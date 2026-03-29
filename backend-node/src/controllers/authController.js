import jwt from "jsonwebtoken";

// In-memory user store (persists during server runtime)
const users = new Map();

// Seed demo users
const seedUsers = [
  { email: "arjun@acme.com", role: "employee", name: "Arjun Sharma", initials: "AS", color: "#c84b2f", status: "active", datasets: 7 },
  { email: "priya@acme.com", role: "employee", name: "Priya Mehta", initials: "PM", color: "#1d4ed8", status: "active", datasets: 3 },
  { email: "rohan@acme.com", role: "viewer", name: "Rohan Kumar", initials: "RK", color: "#2d6a4f", status: "inactive", datasets: 0 },
  { email: "neha@acme.com", role: "employee", name: "Neha Kapoor", initials: "NK", color: "#b45309", status: "active", datasets: 12 },
  { email: "admin@acme.com", role: "admin", name: "Admin User", initials: "AD", color: "#58a6ff", status: "active", datasets: 0 },
];

seedUsers.forEach(u => {
  users.set(u.email, { ...u, createdAt: new Date().toISOString() });
});

function generateInitials(email) {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#c84b2f", "#1d4ed8", "#2d6a4f", "#b45309", "#7c3aed", "#0891b2", "#dc2626", "#059669"];

export const login = (req, res) => {
  const { email, password, role } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // If user exists, use their stored role; otherwise use provided role
  const existing = users.get(email);
  const resolvedRole = existing ? existing.role : (role || "user");

  if (!existing) {
    const initials = generateInitials(email);
    const color = AVATAR_COLORS[users.size % AVATAR_COLORS.length];
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    users.set(email, {
      email, role: resolvedRole, name, initials, color,
      status: "active", datasets: 0, createdAt: new Date().toISOString(),
    });
  }

  // Mark as active on login
  const user = users.get(email);
  user.status = "active";

  const token = jwt.sign({ email, role: resolvedRole }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
  res.json({ token, role: resolvedRole, name: user.name, email });
};

export const signup = (req, res) => {
  const { email, password, role } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Don't overwrite existing user's role
  if (users.has(email)) {
    const existing = users.get(email);
    const token = jwt.sign({ email, role: existing.role }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
    return res.json({ token, role: existing.role, name: existing.name, email });
  }

  const resolvedRole = role || "user";

  const initials = generateInitials(email);
  const color = AVATAR_COLORS[users.size % AVATAR_COLORS.length];
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  users.set(email, {
    email, role: resolvedRole, name, initials, color,
    status: "active", datasets: 0, createdAt: new Date().toISOString(),
  });

  const token = jwt.sign({ email, role: resolvedRole }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
  res.json({ token, role: resolvedRole, name, email });
};

// Get all users (admin only)
export const getAllUsers = (req, res) => {
  const roleFilter = req.query.role;
  let allUsers = Array.from(users.values()).map(u => ({ ...u, password: undefined }));

  if (roleFilter && roleFilter !== "all") {
    allUsers = allUsers.filter(u => u.role === roleFilter);
  }

  res.json({ success: true, users: allUsers, count: allUsers.length });
};

// Update user role (admin only)
export const updateUserRole = (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  const validRoles = ["employee", "admin", "viewer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
  }

  const user = users.get(email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const oldRole = user.role;
  user.role = role;

  res.json({ success: true, message: `Role updated from ${oldRole} to ${role}`, user: { ...user, password: undefined } });
};

// Update user status (admin only)
export const updateUserStatus = (req, res) => {
  const { email } = req.params;
  const { status } = req.body;

  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const user = users.get(email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.status = status;
  res.json({ success: true, message: `Status updated to ${status}`, user: { ...user, password: undefined } });
};

// Delete user (admin only)
export const deleteUser = (req, res) => {
  const { email } = req.params;
  if (!users.has(email)) return res.status(404).json({ success: false, message: "User not found" });

  users.delete(email);
  res.json({ success: true, message: "User deleted" });
};

// Get user stats
export const getUserStats = (req, res) => {
  const allUsers = Array.from(users.values());
  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === "active").length,
    inactive: allUsers.filter(u => u.status === "inactive").length,
    byRole: {
      admin: allUsers.filter(u => u.role === "admin").length,
      employee: allUsers.filter(u => u.role === "employee").length,
      viewer: allUsers.filter(u => u.role === "viewer").length,
    },
  };
  res.json({ success: true, stats });
};

// Get current user info from token (syncs role after admin changes)
export const getMe = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = users.get(decoded.email);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user: { ...user, password: undefined } });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
