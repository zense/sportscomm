import mongoose, { Schema } from 'mongoose';
import { ICoach } from '@/types';

const CoachSchema = new Schema<ICoach>({
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
    sport: {
        type: String,
        required: true,
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
CoachSchema.index({ email: 1 });
CoachSchema.index({ sport: 1 });
CoachSchema.index({ microsoftId: 1 });

export default mongoose.models.Coach || mongoose.model<ICoach>('Coach', CoachSchema);
