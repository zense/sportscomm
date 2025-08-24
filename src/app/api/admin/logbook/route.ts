import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        // Filter parameters
        const student = url.searchParams.get('student');
        const sport = url.searchParams.get('sport');
        const equipment = url.searchParams.get('equipment');
        const status = url.searchParams.get('status');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        const skip = (page - 1) * limit;

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

        if (student) {
            matchConditions.$or = [
                { 'student.name': { $regex: student, $options: 'i' } },
                { 'student.rollNumber': { $regex: student, $options: 'i' } }
            ];
        }

        if (sport) {
            matchConditions['student.sport'] = sport;
        }

        if (equipment) {
            matchConditions.equipment = { $regex: equipment, $options: 'i' };
        }

        if (status) {
            matchConditions.status = status;
        }

        if (startDate || endDate) {
            const dateRange = {} as Record<string, Date>;
            if (startDate) {
                dateRange.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateRange.$lte = end;
            }
            matchConditions.createdAt = dateRange;
        }

        if (Object.keys(matchConditions).length > 0) {
            // @ts-expect-error - MongoDB aggregation pipeline typing is complex
            pipeline.push({ $match: matchConditions });
        }

        // @ts-expect-error - MongoDB aggregation pipeline typing is complex
        pipeline.push({ $sort: { createdAt: -1 } });

        // Get total count for pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await EquipmentTransaction.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        // @ts-expect-error - MongoDB aggregation pipeline typing is complex
        pipeline.push({ $skip: skip });
        // @ts-expect-error - MongoDB aggregation pipeline typing is complex
        pipeline.push({ $limit: limit });

        const transactions = await EquipmentTransaction.aggregate(pipeline);

        // Get unique sports for filter options
        const sportsResult = await EquipmentTransaction.aggregate([
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
            },
            {
                $group: {
                    _id: '$student.sport'
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const sports = sportsResult.map(s => s._id).filter(Boolean);

        // Get unique equipment types
        const equipmentResult = await EquipmentTransaction.aggregate([
            {
                $group: {
                    _id: '$equipment'
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const equipmentTypes = equipmentResult.map(e => e._id).filter(Boolean);

        return NextResponse.json({
            success: true,
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                sports,
                equipmentTypes,
                statuses: ['Requested', 'Taken', 'ReturnedPendingApproval', 'Approved', 'Rejected', 'Overdue']
            }
        });

    } catch (error) {
        console.error('Logbook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isAdmin(handleRequest);
