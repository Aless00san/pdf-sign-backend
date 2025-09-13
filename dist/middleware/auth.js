"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const auth_1 = require("../utils/auth");
async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid Authorization header' });
    }
    try {
        const payload = await (0, auth_1.verifyToken)(token);
        req.userId = payload.userId;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
