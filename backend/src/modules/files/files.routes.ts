import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { authGuard } from '../../shared/middleware/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { getFileInfo, openDownloadStream } from './files.service.js';

const router = Router();

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
