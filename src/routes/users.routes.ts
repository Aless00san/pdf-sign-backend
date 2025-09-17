import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken, verifyToken } from "../utils/auth";

import { Router } from "express";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

//register user
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existingUser) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const hashedPassword = await hashPassword(password);
  const newUserId = randomUUID();

  db.insert(users)
    .values({
      id: newUserId,
      email,
      password: hashedPassword,
    })
    .run();

  const token = await generateToken(newUserId);

  return res.status(201).json({
    message: "Registered successfully",
    token,
    userData: {
      id: newUserId,
      email: email
    }
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return res.status(403).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = await generateToken(user.id);

  res.cookie("authToken", token, {
    httpOnly: true,
    secure: false,
    maxAge: 3600000,
  });

  res.json({
    message: "Login successful",
    token,
    userData: {
      id: user.id,
      email: user.email,
    },
  });
});

//logout user, delete cookie
router.post("/logout", async (req, res) => {
  res.clearCookie("authToken");
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/auto-login", async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, auto login failed" });
  }

  try {
    const payload = await verifyToken(token);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .get();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Auto login successful",
      userData: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during auto-login:", error);
    return res
      .status(401)
      .json({ message: "Invalid or expired token, auto login failed" });
  }
});

export default router;
