import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isStudent } from '@/middleware/auth';
import { generateNoDuesPDF, validatePDFGeneration } from '@/lib/pdf';
import EquipmentTransaction from '@/models/EquipmentTransaction';
import Student from '@/models/Student';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // @ts-expect-error - NextJS request typing - user is set by middleware
        const userId = request.user.userId;

        // Get student details
        const student = await Student.findById(userId);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Get all transactions for this student
        const transactions = await EquipmentTransaction.find({ studentId: userId });

        // Validate that student can get no dues certificate
        const validationError = validatePDFGeneration(student, transactions);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        // Get only approved transactions for the certificate
        const approvedTransactions = transactions.filter(t => t.status === 'Approved');

        // Generate PDF
        const pdfBuffer = await generateNoDuesPDF(student, approvedTransactions);

        // Set response headers for PDF download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="no-dues-${student.rollNumber}.pdf"`);
        headers.set('Content-Length', pdfBuffer.length.toString());

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('No dues PDF generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isStudent(handleRequest);
