import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { AppError } from '../../shared/middleware/errorHandler.js';
const BUCKET_NAME = 'uploads';
let bucket = null;
function getBucket() {
    if (bucket)
        return bucket;
    const db = mongoose.connection.db;
    if (!db) {
        throw new AppError('Database not connected', 500, 'DB_NOT_READY');
    }
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
    return bucket;
}
export async function uploadBuffer(buffer, filename, contentType, metadata) {
    return new Promise((resolve, reject) => {
        const stream = getBucket().openUploadStream(filename, {
            metadata: { ...metadata, contentType },
        });
        stream.on('error', reject);
        stream.on('finish', () => resolve(stream.id));
        Readable.from(buffer).pipe(stream);
    });
}
export async function deleteFile(id) {
    const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
    try {
        await getBucket().delete(objectId);
    }
    catch {
        // best-effort cleanup; ignore missing
    }
}
export async function updateFileOwner(id, ownerId) {
    const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
    await getBucket().find({ _id: objectId }).limit(1).toArray();
    await mongoose.connection.db
        ?.collection(`${BUCKET_NAME}.files`)
        .updateOne({ _id: objectId }, { $set: { 'metadata.ownerId': ownerId } });
}
export async function getFileInfo(id) {
    const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
    const cursor = getBucket().find({ _id: objectId }).limit(1);
    const docs = await cursor.toArray();
    if (docs.length === 0)
        return null;
    const doc = docs[0];
    const meta = (doc.metadata ?? {});
    return {
        filename: doc.filename,
        contentType: meta.contentType ?? 'application/octet-stream',
        length: doc.length,
        metadata: meta,
    };
}
export function openDownloadStream(id) {
    const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
    return getBucket().openDownloadStream(objectId);
}
