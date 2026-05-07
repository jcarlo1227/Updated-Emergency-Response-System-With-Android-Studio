import mongoose, { Schema } from 'mongoose';
const adminSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 120 },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: { type: Date },
}, { timestamps: true });
export const Admin = mongoose.model('Admin', adminSchema);
