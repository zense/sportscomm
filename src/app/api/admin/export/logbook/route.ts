import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import { generateLogbookExcel } from '@/lib/excel';
import EquipmentTransaction from '@/models/EquipmentTransaction';
import { LogbookFilter } from '@/types';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        const url = new URL(request.url);

        // Filter parameters
        const student = url.searchParams.get('student');
        const sport = url.searchParams.get('sport');
        const equipment = url.searchParams.get('equipment');
        const status = url.searchParams.get('status');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

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
        const filter: LogbookFilter = {};

        if (student) {
            matchConditions.$or = [
                { 'student.name': { $regex: student, $options: 'i' } },
                { 'student.rollNumber': { $regex: student, $options: 'i' } }
            ];
            filter.student = student;
        }

        if (sport) {
            matchConditions['student.sport'] = sport;
            filter.sport = sport;
        }

        if (equipment) {
            matchConditions.equipment = { $regex: equipment, $options: 'i' };
            filter.equipment = equipment;
        }

        if (status) {
            matchConditions.status = status;
            filter.status = status;
        }

        if (startDate || endDate) {
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
            matchConditions.createdAt = dateRange;
        }

        if (Object.keys(matchConditions).length > 0) {
            // @ts-expect-error - MongoDB aggregation pipeline typing is complex
            pipeline.push({ $match: matchConditions });
        }

        // @ts-expect-error - MongoDB aggregation pipeline typing is complex
        pipeline.push({ $sort: { createdAt: -1 } });

        const transactions = await EquipmentTransaction.aggregate(pipeline);

        // Generate Excel file
        const excelBuffer = await generateLogbookExcel(transactions, filter);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `equipment-logbook-${timestamp}.xlsx`;

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
        console.error('Export logbook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isAdmin(handleRequest);
