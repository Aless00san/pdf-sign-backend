import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const storage = multer.diskStorage({
  destination: 'storage/docs',
  filename: (_req, file, cb) => {
    const docId = (_req as any).docId;
    const ext = path.extname(file.originalname);
    cb(null, `${docId}${ext}`);
  },
});

export const upload = multer({ storage });
