"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../utils/hash");
const auth_1 = require("../utils/auth");
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
//register user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const existingUser = await db_1.db
        .select()
        .from(db_1.users)
        .where((0, drizzle_orm_1.eq)(db_1.users.email, email))
        .get();
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await (0, hash_1.hashPassword)(password);
    const newUserId = (0, crypto_1.randomUUID)();
    db_1.db.insert(db_1.users)
        .values({
        id: newUserId,
        email,
        password: hashedPassword,
    })
        .run();
    const token = await (0, auth_1.generateToken)(newUserId);
    return res.status(201).json({
        message: 'Registered successfully',
        token,
    });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db_1.db
        .select()
        .from(db_1.users)
        .where((0, drizzle_orm_1.eq)(db_1.users.email, email))
        .get();
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await (0, hash_1.comparePassword)(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = await (0, auth_1.generateToken)(user.id);
    res.json({
        message: 'Login successful',
        token,
    });
});
exports.default = router;
