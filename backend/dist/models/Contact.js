import mongoose, { Schema } from 'mongoose';
const contactSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    relation: {
        type: String,
        trim: true,
    },
    isPrimary: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
export const Contact = mongoose.model('Contact', contactSchema);
