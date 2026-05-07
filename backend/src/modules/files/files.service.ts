import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { AppError } from '../../shared/middleware/errorHandler.js';

const BUCKET_NAME = 'uploads';

let bucket: mongoose.mongo.GridFSBucket | null = null;

function getBucket(): mongoose.mongo.GridFSBucket {
  if (bucket) return bucket;
  const db = mongoose.connection.db;
  if (!db) {
    throw new AppError('Database not connected', 500, 'DB_NOT_READY');
  }
  bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
  return bucket;
}

export interface UploadMetadata {
  ownerType: 'user' | 'responder' | 'emergency' | 'ambulance_request';
  ownerId?: string;
  purpose: 'face_capture' | 'proof_of_residency' | 'valid_id' | 'credential' | 'other';
}

interface StoredFileMetadata extends UploadMetadata {
  contentType: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: UploadMetadata,
): Promise<mongoose.Types.ObjectId> {
  return new Promise((resolve, reject) => {
    const stream = getBucket().openUploadStream(filename, {
      metadata: { ...metadata, contentType } as StoredFileMetadata,
    });
    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id as mongoose.Types.ObjectId));
    Readable.from(buffer).pipe(stream);
  });
}

export async function deleteFile(id: mongoose.Types.ObjectId | string): Promise<void> {
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  try {
    await getBucket().delete(objectId);
  } catch {
    // best-effort cleanup; ignore missing
  }
}

export async function getFileInfo(
  id: mongoose.Types.ObjectId | string,
): Promise<{ filename: string; contentType: string; length: number } | null> {
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  const cursor = getBucket().find({ _id: objectId }).limit(1);
  const docs = await cursor.toArray();
  if (docs.length === 0) return null;
  const doc = docs[0]!;
  const meta = (doc.metadata ?? {}) as Partial<StoredFileMetadata>;
  return {
    filename: doc.filename,
    contentType: meta.contentType ?? 'application/octet-stream',
    length: doc.length,
  };
}

export function openDownloadStream(
  id: mongoose.Types.ObjectId | string,
): NodeJS.ReadableStream {
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return getBucket().openDownloadStream(objectId);
}
