import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { authGuard } from '../../shared/middleware/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { getFileInfo, openDownloadStream } from './files.service.js';

const router = Router();

function canAccessFile(req: Request, info: Awaited<ReturnType<typeof getFileInfo>>): boolean {
  if (!info || !req.auth) return false;
  if (req.auth.role === 'admin') return true;

  const metadata = info.metadata ?? {};
  const sensitivePurpose = ['face_capture', 'proof_of_residency', 'valid_id', 'credential'].includes(
    metadata.purpose ?? '',
  );
  if (!sensitivePurpose) return true;

  if (!metadata.ownerId) return false;
  if (metadata.ownerType !== req.auth.role) return false;
  return metadata.ownerId === req.auth.accountId;
}

router.get(
  '/:id',
  authGuard,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid file id', 400, 'INVALID_FILE_ID');
      }
      const info = await getFileInfo(id);
      if (!info) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }
      if (!canAccessFile(req, info)) {
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
      }
      res.setHeader('Content-Type', info.contentType);
      res.setHeader('Content-Length', String(info.length));
      res.setHeader('Cache-Control', 'private, max-age=300');
      const stream = openDownloadStream(id);
      stream.on('error', (err) => next(err));
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
