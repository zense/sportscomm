import mongoose, { Schema } from 'mongoose';
import { IAdmin } from '@/types';

const AdminSchema = new Schema<IAdmin>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    microsoftId: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

// Indexes for better performance
AdminSchema.index({ email: 1 });
AdminSchema.index({ microsoftId: 1 });

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
