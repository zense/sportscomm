import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import { generateAttendanceExcel } from '@/lib/excel';
import Attendance from '@/models/Attendance';
import { AttendanceFilter } from '@/types';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        const url = new URL(request.url);

        // Filter parameters
        const sport = url.searchParams.get('sport');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const date = url.searchParams.get('date');

        // Build aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $unwind: '$student'
            }
        ];

        // Build match conditions
        const matchConditions = {} as Record<string, unknown>;
        const filter: AttendanceFilter = {};

        if (sport) {
            matchConditions.sport = sport;
            filter.sport = sport;
        }

        if (date) {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            matchConditions.date = {
                $gte: targetDate,
                $lt: nextDay
            };
            filter.date = targetDate;
        } else if (startDate || endDate) {
            const dateRange = {} as Record<string, Date>;
            if (startDate) {
                const start = new Date(startDate);
                dateRange.$gte = start;
                filter.startDate = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateRange.$lte = end;
                filter.endDate = end;
            }
            matchConditions.date = dateRange;
        }

        if (Object.keys(matchConditions).length > 0) {
            // @ts-expect-error - MongoDB aggregation pipeline typing is complex
            pipeline.push({ $match: matchConditions });
        }

        // @ts-expect-error - MongoDB aggregation pipeline typing is complex
        pipeline.push({ $sort: { date: -1, 'student.name': 1 } });

        const attendanceRecords = await Attendance.aggregate(pipeline);

        // Generate Excel file
        const excelBuffer = await generateAttendanceExcel(attendanceRecords, filter);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `attendance-report-${timestamp}.xlsx`;

        // Set response headers for Excel download
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Length', excelBuffer.length.toString());

        return new NextResponse(new Uint8Array(excelBuffer), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Export attendance error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isAdmin(handleRequest);
