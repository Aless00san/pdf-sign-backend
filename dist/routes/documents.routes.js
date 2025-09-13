"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const crypto_1 = require("crypto");
const multer_1 = require("../multer");
const drizzle_orm_1 = require("drizzle-orm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// This route is used to upload a new document to the server
// It generates a random ID for the document and creates an entry in the database
router.post('/documents', auth_1.auth, (req, res, next) => {
    req.docId = (0, crypto_1.randomUUID)();
    next();
}, multer_1.upload.single('pdf'), (req, res) => {
    console.log(req.file);
    if (!req.file)
        return res.status(400).json({ error: 'Error uploading file' });
    const docId = req.docId;
    const userId = req.userId;
    db_1.db.insert(db_1.documents)
        .values({
        id: docId,
        name: req.file.originalname,
        status: 'pending',
        userId: userId,
    })
        .run();
    res
        .status(201)
        .json({ docId, name: req.file.originalname, status: 'pending' });
});
// This route generates a QR code for signing the document on the client-side
router.get('/documents/:id/qr', async (req, res) => {
    const docId = req.params.id;
    // Verificar que el documento existe
    const doc = await db_1.db
        .select()
        .from(db_1.documents)
        .where((0, drizzle_orm_1.eq)(db_1.documents.id, docId))
        .get();
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    // FRONTEND URL
    const url = `https://mi-app.com/sign/${docId}`;
    try {
        const qrDataUrl = await qrcode_1.default.toDataURL(url);
        res.json({
            docId,
            qr: qrDataUrl,
        });
    }
    catch (err) {
        console.error('Error generando QR:', err);
        res.status(500).json({ error: 'Error generating QR code' });
    }
});
router.delete('/documents/:id', auth_1.auth, async (req, res) => {
    const docId = req.params.id;
    const doc = await db_1.db
        .select()
        .from(db_1.documents)
        .where((0, drizzle_orm_1.eq)(db_1.documents.id, docId))
        .get();
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    const filePath = path_1.default.join('storage/docs', `${docId}${path_1.default.extname(doc.name)}`);
    // Delete file from disk
    fs_1.default.unlinkSync(filePath);
    // Delete entry from database
    db_1.db.delete(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.id, docId)).run();
    return res.status(200).json({ message: 'Document successfully deleted' });
});
router.get('/documents/:id/download', auth_1.auth, async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const doc = await db_1.db
        .select()
        .from(db_1.documents)
        .where((0, drizzle_orm_1.eq)(db_1.documents.id, id))
        .get();
    if (!doc)
        return res.status(404).json({ error: 'Document not found' });
    if (doc.userId !== userId)
        return res.status(403).json({
            error: 'Forbidden: You are not authorized to access this document',
        });
    const filePath = path_1.default.join('storage/docs', `${id}${path_1.default.extname(doc.name)}`);
    res.download(filePath, doc.name, err => {
        if (err) {
            res
                .status(500)
                .json({ error: 'Something went wrong while downloading the document' });
        }
    });
    if (doc.status === 'signed') {
        await fs_1.default.unlinkSync(filePath);
        db_1.db.delete(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.id, id)).run();
    }
});
exports.default = router;
