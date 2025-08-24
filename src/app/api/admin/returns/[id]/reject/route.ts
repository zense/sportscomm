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

        const { reason } = await request.json();

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

        // Update status to rejected and set back to taken
        transaction.status = 'Rejected';
        transaction.approvedBy = userId;
        transaction.approvedByRole = role;
        transaction.notes = `${transaction.notes || ''}\n\nRejection reason: ${reason || 'No reason provided'}`.trim();
        await transaction.save();

        // Create a new transaction to reflect that item is still taken
        const newTransaction = new EquipmentTransaction({
            studentId: transaction.studentId,
            equipment: transaction.equipment,
            quantity: transaction.quantity,
            dueDate: transaction.dueDate,
            status: 'Taken',
            takenAt: transaction.takenAt,
            notes: `Return rejected. Reason: ${reason || 'No reason provided'}`
        });

        await newTransaction.save();

        // Populate student details for response
        await transaction.populate('student', 'name rollNumber email sport');

        return NextResponse.json({
            success: true,
            transaction,
            newTransaction,
            message: 'Equipment return rejected successfully'
        });

    } catch (error) {
        console.error('Reject return error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isAdmin(handleRequest);
