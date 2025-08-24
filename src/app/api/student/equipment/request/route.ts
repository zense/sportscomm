import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isStudent } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';
import Student from '@/models/Student';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        const { equipment, quantity, returnDate, notes } = await request.json();

        if (!equipment || !quantity || !returnDate) {
            return NextResponse.json(
                { error: 'Equipment, quantity, and return date are required' },
                { status: 400 }
            );
        }

        if (quantity < 1) {
            return NextResponse.json(
                { error: 'Quantity must be at least 1' },
                { status: 400 }
            );
        }

        const dueDate = new Date(returnDate);
        if (dueDate <= new Date()) {
            return NextResponse.json(
                { error: 'Return date must be in the future' },
                { status: 400 }
            );
        }

        // @ts-expect-error - NextJS request body typing - user is set by middleware
        const userId = request.user.userId;

        // Verify student exists
        const student = await Student.findById(userId);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Check for any pending or overdue equipment for this student
        const pendingEquipment = await EquipmentTransaction.find({
            studentId: userId,
            status: { $in: ['Taken', 'ReturnedPendingApproval', 'Overdue'] }
        });

        if (pendingEquipment.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot request new equipment while you have pending returns or overdue items',
                    pendingItems: pendingEquipment.length
                },
                { status: 400 }
            );
        }

        // Create new equipment request
        const transaction = new EquipmentTransaction({
            studentId: userId,
            equipment: equipment.trim(),
            quantity: parseInt(quantity),
            dueDate,
            status: 'Requested',
            notes: notes?.trim(),
        });

        await transaction.save();

        // Populate student details for response
        await transaction.populate('student', 'name rollNumber email sport');

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Equipment request submitted successfully'
        });

    } catch (error) {
        console.error('Equipment request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isStudent(handleRequest);
