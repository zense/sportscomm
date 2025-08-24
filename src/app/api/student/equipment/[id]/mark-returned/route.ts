import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isStudent } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // Extract ID from URL
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/');
        const id = pathSegments[pathSegments.indexOf('equipment') + 1];

        // @ts-expect-error - NextJS dynamic params typing - user is set by middleware
        const userId = request.user.userId;

        // Find the transaction
        const transaction = await EquipmentTransaction.findOne({
            _id: id,
            studentId: userId,
            status: 'Taken'
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Equipment not found or not in taken status' },
                { status: 404 }
            );
        }

        // Update status to returned pending approval
        transaction.status = 'ReturnedPendingApproval';
        transaction.returnedAt = new Date();
        await transaction.save();

        // Populate student details for response
        await transaction.populate('student', 'name rollNumber email sport');

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Equipment return submitted for approval'
        });

    } catch (error) {
        console.error('Mark returned error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isStudent(handleRequest);
