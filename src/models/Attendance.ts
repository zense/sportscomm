import mongoose, { Schema } from 'mongoose';
import { IAttendance } from '@/types';

const AttendanceSchema = new Schema<IAttendance>({
    studentId: {
        type: String,
        required: true,
        ref: 'Student',
    },
    sport: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
    },
    markedByRole: {
        type: String,
        enum: ['Coach', 'Admin'],
        required: true,
    },
    markedById: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

// Compound index to prevent duplicate attendance records
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Other indexes for better performance
AttendanceSchema.index({ sport: 1, date: -1 });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ markedById: 1 });

// Virtual for populating student details
AttendanceSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});

// Virtual for populating marker details (coach or admin)
AttendanceSchema.virtual('markedBy', {
    ref: function (this: IAttendance) {
        return this.markedByRole === 'Coach' ? 'Coach' : 'Admin';
    },
    localField: 'markedById',
    foreignField: '_id',
    justOne: true,
});

// Ensure virtual fields are serialized
AttendanceSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
