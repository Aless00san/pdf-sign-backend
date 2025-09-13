"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jose_1 = require("jose");
const crypto_1 = require("crypto");
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret');
async function generateToken(userId) {
    return await new jose_1.SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti((0, crypto_1.randomUUID)())
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
}
async function verifyToken(token) {
    const { payload } = await (0, jose_1.jwtVerify)(token, secret);
    return payload;
}
