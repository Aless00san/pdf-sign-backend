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

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId))
    .get();

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // FRONTEND URL
  const url = `http://localhost:5173/sign/${docId}`;

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
    return res.status(403).json({ error: 'Forbidden' });

  const filePath = path.join('storage/docs', `${id}${path.extname(doc.name)}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File does not exist' });
  }

  res.download(filePath, doc.name, async err => {
    if (err) {
      console.error('Error during download:', err);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: 'Error downloading the document' });
      }
    } else {
      // Only delete after successful download
      if (doc.status === 'signed') {
        try {
          await fs.promises.unlink(filePath); // delete file
          await db.delete(documents).where(eq(documents.id, id)).run(); // delete DB entry
          console.log(`Document ${id} deleted after download.`);
        } catch (deleteErr) {
          console.error('Error deleting signed document:', deleteErr);
        }
      }
    }
  });
});

//Get all documents for a user
router.get('/documents', auth, async (req, res) => {
  const userId = (req as any).userId;
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .all();
  if (!docs) return res.status(404).json({ error: 'No documents found' });
  return res.status(200).json(docs);
});

// Route for downloading the file
router.get('/documents/:id/file', auth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Search for the document in the database
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
});

//Route for updating a document
// Takes the document ID and the new file as a multipart/form-data
// and the new status as a query parameter
router.put('/documents/:id', auth, upload.single('pdf'), async (req, res) => {
  const { id } = req.params;
  const status = req.body.status as string;
  const file = req.file;

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.userId !== (req as any).userId)
    return res.status(403).json({
      error: 'Forbidden: You are not authorized to access this document',
    });

  if (!status || (status !== 'signed' && status !== 'rejected'))
    return res.status(400).json({ error: 'Invalid status' });

  const update = await db
    .update(documents)
    .set({ status })
    .where(eq(documents.id, id))
    .run();

  if (!update) return res.status(404).json({ error: 'Document not found' });

  if (file) {
    const oldFilePath = path.join(
      'storage/docs',
      `${id}${path.extname(doc.name)}`
    );
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    fs.renameSync(file.path, oldFilePath);
  }

  return res.status(200).json({ message: 'Document successfully updated' });
});

router.get('/documents/:id', auth, async (req, res) => {
  const { id } = req.params;
  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const signaturePath = path.join('storage/signatures', `${id}.png`);
  let signature: string | null = null;
  if (fs.existsSync(signaturePath)) {
    const data = fs.readFileSync(signaturePath);
    signature = `data:image/png;base64,${data.toString('base64')}`;
  }

  return res.json({ ...doc, signature });
});

router.post('/documents/:id/sign', auth, async (req, res) => {
  const { id } = req.params;
  const { signature } = req.body;
  const userId = (req as any).userId;

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.userId !== userId)
    return res.status(403).json({ error: 'Forbidden' });

  const base64Data = signature.replace(/^data:image\/png;base64,/, '');
  const filePath = path.join('storage/signatures', `${id}.png`);
  fs.writeFileSync(filePath, base64Data, 'base64');

  await db
    .update(documents)
    .set({ status: 'hasSignature' })
    .where(eq(documents.id, id))
    .run();

  res.status(200).json({ message: 'Signature saved' });
});

export default router;
