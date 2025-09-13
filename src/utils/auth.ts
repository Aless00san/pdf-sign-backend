import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret'
);

export async function generateToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: string; iat: number; exp: number; jti: string };
}
