import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/auth';

import { Router } from 'express';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

//register user
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists' });
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
    message: 'Registered successfully',
    token,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = await generateToken(user.id);

  res.json({
    message: 'Login successful',
    token,
  });
});

export default router;
