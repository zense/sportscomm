import mongoose, { Schema } from 'mongoose';
import { IStudent } from '@/types';

const StudentSchema = new Schema<IStudent>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    sport: {
        type: String,
        required: true,
        trim: true,
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
StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({ sport: 1 });
StudentSchema.index({ microsoftId: 1 });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
