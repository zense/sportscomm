import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // Extract ID from URL
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/');
        const id = pathSegments[pathSegments.indexOf('returns') + 1];

        // @ts-expect-error - NextJS dynamic params typing - user is set by middleware
        const { userId, role } = request.user;

        // Find the transaction
        const transaction = await EquipmentTransaction.findOne({
            _id: id,
            status: 'ReturnedPendingApproval'
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Return request not found or not in pending approval status' },
                { status: 404 }
            );
        }

        // Update status to approved
        transaction.status = 'Approved';
        transaction.approvedBy = userId;
        transaction.approvedByRole = role;
        await transaction.save();

        // Populate student details for response
        await transaction.populate('student', 'name rollNumber email sport');

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Equipment return approved successfully'
        });

    } catch (error) {
        console.error('Approve return error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isAdmin(handleRequest);
