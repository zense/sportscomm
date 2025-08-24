import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isStudent } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // @ts-expect-error - NextJS request typing - user is set by middleware
        const userId = request.user.userId;

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const status = url.searchParams.get('status');

        const skip = (page - 1) * limit;

        // Build query
        const query = { studentId: userId } as Record<string, unknown>;
        if (status) {
            query.status = status;
        }

        // Update overdue items
        const now = new Date();
        await EquipmentTransaction.updateMany(
            {
                studentId: userId,
                status: 'Taken',
                dueDate: { $lt: now }
            },
            { status: 'Overdue' }
        );

        // Get transactions
        const transactions = await EquipmentTransaction.find(query)
            .populate('student', 'name rollNumber email sport')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await EquipmentTransaction.countDocuments(query);

        return NextResponse.json({
            success: true,
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isStudent(handleRequest);
