import { Router } from 'express';
import { db } from '../db';
import { documents } from '../schema';
import { randomUUID } from 'crypto';
import { upload } from '../multer';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { auth } from '../middleware/auth';

const router = Router();

// This route is used to upload a new document to the server
// It generates a random ID for the document and creates an entry in the database
router.post(
  '/documents',
  auth,
  (req, res, next) => {
    (req as any).docId = randomUUID();
    next();
  },
  upload.single('pdf'),
  (req, res) => {
    console.log(req.file);

    if (!req.file)
      return res.status(400).json({ error: 'Error uploading file' });

    const docId = (req as any).docId;
    const userId = (req as any).userId;

    db.insert(documents)
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
  }
);

// This route generates a QR code for signing the document on the client-side
router.get('/documents/:id/qr', async (req, res) => {
  const docId = req.params.id;

  // Verificar que el documento existe
  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId))
    .get();

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // FRONTEND URL
  const url = `https://mi-app.com/sign/${docId}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(url);

    res.json({
      docId,
      qr: qrDataUrl,
    });
  } catch (err) {
    console.error('Error generando QR:', err);
    res.status(500).json({ error: 'Error generating QR code' });
  }
});

router.delete('/documents/:id', auth, async (req, res) => {
  const docId = req.params.id;

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId))
    .get();

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(
    'storage/docs',
    `${docId}${path.extname(doc.name)}`
  );

  // Delete file from disk
  fs.unlinkSync(filePath);
  // Delete entry from database
  db.delete(documents).where(eq(documents.id, docId)).run();

  return res.status(200).json({ message: 'Document successfully deleted' });
});

router.get('/documents/:id/download', auth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.userId !== userId)
    return res.status(403).json({
      error: 'Forbidden: You are not authorized to access this document',
    });

  const filePath = path.join('storage/docs', `${id}${path.extname(doc.name)}`);

  res.download(filePath, doc.name, err => {
    if (err) {
      res
        .status(500)
        .json({ error: 'Something went wrong while downloading the document' });
    }
  });

  if (doc.status === 'signed') {
    await fs.unlinkSync(filePath);
    db.delete(documents).where(eq(documents.id, id)).run();
  }
});

export default router;
