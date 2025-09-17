// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export async function auth(req: Request, res: Response, next: NextFunction) {

  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header' });
  }

  try {
    const payload = await verifyToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
