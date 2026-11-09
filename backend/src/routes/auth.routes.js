import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();
function tokenFor(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password || password.length < 8) {
      return res
        .status(400)
        .json({
          message: "Username, email, and password (8+ characters) are required",
        });
    }
    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (exists)
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    const user = await User.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res
      .status(201)
      .json({
        token: tokenFor(user),
        user: { id: user._id, username: user.username, email: user.email },
      });
  } catch (err) {
    next(err);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      token: tokenFor(user),
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});
router.get("/me", protect, (req, res) => res.json({ user: req.user }));
export default router;
