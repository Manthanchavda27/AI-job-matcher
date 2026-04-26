const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { protect } = require("../middleware/authMiddleware");
const passport = require("passport");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const finalRole = email.toLowerCase() === "admin@aijobmatcher.com" ? "admin" : "student";

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userToReturn = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    res.status(201).json({ message: "User registered successfully", user: userToReturn, token });
  } catch (err) {
    next(err);
  }
});

// GOOGLE OAUTH
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=auth_failed` }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?token=${token}`);
  }
);

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userToReturn = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills || [],
      bio: user.bio || "",
      profileComplete: user.profileComplete || false,
    };

    // log the login activity
    await ActivityLog.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      action: "login",
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    });

    res.status(200).json({ message: "Login successful", user: userToReturn, token });
  } catch (err) {
    next(err);
  }
});

// LOGOUT
router.post("/logout", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      await ActivityLog.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        action: "logout",
        ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// PROFILE ROUTES
router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, skills, bio } = req.body;

    const update = {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
    };

    if (skills) {
      update.skills = Array.isArray(skills)
        ? skills
        : String(skills)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    if (update.name || (update.skills && update.skills.length) || update.bio) {
      update.profileComplete = true;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    next(err);

  }
});

module.exports = router;