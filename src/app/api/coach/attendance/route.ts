import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isCoach } from '@/middleware/auth';
import Attendance from '@/models/Attendance';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // @ts-expect-error - NextJS request typing - user is set by middleware
        const { sport } = request.user;

        if (!sport) {
            return NextResponse.json(
                { error: 'Coach sport not found' },
                { status: 400 }
            );
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const date = url.searchParams.get('date');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        const skip = (page - 1) * limit;

        // Build query for attendance in coach's sport
        const query = { sport } as Record<string, unknown>;

        if (date) {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query.date = {
                $gte: targetDate,
                $lt: nextDay
            };
        } else if (startDate || endDate) {
            const dateRange = {} as Record<string, Date>;
            if (startDate) {
                dateRange.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateRange.$lte = end;
            }
            query.date = dateRange;
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find(query)
            .populate('student', 'name rollNumber email')
            .sort({ date: -1, 'student.name': 1 })
            .skip(skip)
            .limit(limit);

        const total = await Attendance.countDocuments(query);

        // Get attendance summary for the period
        const summaryQuery = { ...query };
        delete summaryQuery.date; // Remove date filter for summary

        if (startDate || endDate || date) {
            summaryQuery.date = query.date;
        }

        const summary = await Attendance.aggregate([
            { $match: summaryQuery },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    presentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                    },
                    absentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                    }
                }
            }
        ]);

        const stats = summary.length > 0 ? summary[0] : {
            totalRecords: 0,
            presentCount: 0,
            absentCount: 0
        };

        return NextResponse.json({
            success: true,
            attendanceRecords,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats,
            sport
        });

    } catch (error) {
        console.error('Get coach attendance error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isCoach(handleRequest);
