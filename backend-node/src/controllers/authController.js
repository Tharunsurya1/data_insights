import jwt from "jsonwebtoken";

export const login = (req, res) => {
  const { email, password, role } = req.body;
  // demo login
  const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
  res.json({ token, role: role || "user" });
};

export const signup = (req, res) => {
  const { email, password, role } = req.body;
  // demo signup
  const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
  res.json({ token, role: role || "user" });
};
