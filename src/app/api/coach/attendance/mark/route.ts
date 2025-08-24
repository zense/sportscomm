import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isCoach } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { AttendanceMarkRequest } from '@/types';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // @ts-expect-error - NextJS request body typing - user is set by middleware
        const { userId, sport } = request.user;

        if (!sport) {
            return NextResponse.json(
                { error: 'Coach sport not found' },
                { status: 400 }
            );
        }

        const { studentId, date, status }: AttendanceMarkRequest = await request.json();

        if (!studentId || !date || !status) {
            return NextResponse.json(
                { error: 'Student ID, date, and status are required' },
                { status: 400 }
            );
        }

        if (!['Present', 'Absent'].includes(status)) {
            return NextResponse.json(
                { error: 'Status must be Present or Absent' },
                { status: 400 }
            );
        }

        // Verify student exists and is in coach's sport
        const student = await Student.findOne({ _id: studentId, sport });
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found or not in your sport' },
                { status: 404 }
            );
        }

        const attendanceDate = new Date(date);

        // Check if attendance already marked for this date
        const existingAttendance = await Attendance.findOne({
            studentId,
            date: {
                $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
                $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
            }
        });

        if (existingAttendance) {
            // Update existing attendance
            existingAttendance.status = status;
            existingAttendance.markedByRole = 'Coach';
            existingAttendance.markedById = userId;
            await existingAttendance.save();

            await existingAttendance.populate('student', 'name rollNumber sport');

            return NextResponse.json({
                success: true,
                attendance: existingAttendance,
                message: 'Attendance updated successfully'
            });
        } else {
            // Create new attendance record
            const attendance = new Attendance({
                studentId,
                sport,
                date: new Date(date),
                status,
                markedByRole: 'Coach',
                markedById: userId,
            });

            await attendance.save();
            await attendance.populate('student', 'name rollNumber sport');

            return NextResponse.json({
                success: true,
                attendance,
                message: 'Attendance marked successfully'
            });
        }

    } catch (error) {
        console.error('Mark attendance error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isCoach(handleRequest);
