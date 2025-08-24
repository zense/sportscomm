import mongoose, { Schema } from 'mongoose';
import { IEquipmentTransaction } from '@/types';

const EquipmentTransactionSchema = new Schema<IEquipmentTransaction>({
    studentId: {
        type: String,
        required: true,
        ref: 'Student',
    },
    equipment: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    takenAt: {
        type: Date,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    returnedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Requested', 'Taken', 'ReturnedPendingApproval', 'Approved', 'Rejected', 'Overdue'],
        default: 'Requested',
    },
    approvedBy: {
        type: String,
    },
    approvedByRole: {
        type: String,
        enum: ['Admin', 'Coach'],
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Indexes for better performance
EquipmentTransactionSchema.index({ studentId: 1 });
EquipmentTransactionSchema.index({ status: 1 });
EquipmentTransactionSchema.index({ dueDate: 1 });
EquipmentTransactionSchema.index({ equipment: 1 });
EquipmentTransactionSchema.index({ createdAt: -1 });

// Virtual for populating student details
EquipmentTransactionSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});

// Ensure virtual fields are serialized
EquipmentTransactionSchema.set('toJSON', { virtuals: true });

export default mongoose.models.EquipmentTransaction || mongoose.model<IEquipmentTransaction>('EquipmentTransaction', EquipmentTransactionSchema);
