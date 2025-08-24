import PDFDocument from 'pdfkit';
import { IStudent, IEquipmentTransaction } from '@/types';

export const generateNoDuesPDF = async (
    student: IStudent,
    approvedTransactions: IEquipmentTransaction[]
): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Header
            doc.fontSize(20).text('NO DUES CERTIFICATE', { align: 'center' });
            doc.moveDown();

            // College/Institution details
            doc.fontSize(14).text('Sports Equipment Department', { align: 'center' });
            doc.text('College Name', { align: 'center' });
            doc.moveDown(2);

            // Certificate content
            doc.fontSize(12);
            doc.text(`This is to certify that Mr./Ms. ${student.name}`, { continued: false });
            doc.text(`Roll Number: ${student.rollNumber}`, { continued: false });
            doc.text(`Email: ${student.email}`, { continued: false });
            doc.text(`Sport: ${student.sport}`, { continued: false });
            doc.moveDown();

            doc.text('has returned all the sports equipment borrowed and has no pending dues with the Sports Equipment Department.');
            doc.moveDown(2);

            // Equipment details table
            if (approvedTransactions.length > 0) {
                doc.text('Equipment Return History:', { underline: true });
                doc.moveDown();

                // Table headers
                const tableTop = doc.y;
                const itemX = 50;
                const quantityX = 200;
                const takenDateX = 280;
                const returnDateX = 400;

                doc.text('Equipment', itemX, tableTop, { width: 140 });
                doc.text('Qty', quantityX, tableTop, { width: 60 });
                doc.text('Taken Date', takenDateX, tableTop, { width: 100 });
                doc.text('Return Date', returnDateX, tableTop, { width: 100 });

                // Draw header line
                doc.moveTo(itemX, tableTop + 15).lineTo(500, tableTop + 15).stroke();

                let currentY = tableTop + 25;

                // Table rows
                approvedTransactions.forEach((transaction) => {
                    doc.text(transaction.equipment, itemX, currentY, { width: 140 });
                    doc.text(transaction.quantity.toString(), quantityX, currentY, { width: 60 });
                    doc.text(
                        transaction.takenAt ? new Date(transaction.takenAt).toLocaleDateString() : 'N/A',
                        takenDateX,
                        currentY,
                        { width: 100 }
                    );
                    doc.text(
                        transaction.returnedAt ? new Date(transaction.returnedAt).toLocaleDateString() : 'N/A',
                        returnDateX,
                        currentY,
                        { width: 100 }
                    );
                    currentY += 20;
                });

                doc.y = currentY + 20;
            }

            // Footer
            doc.moveDown(3);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
            doc.moveDown(2);

            doc.text('_____________________', 400, doc.y);
            doc.text('Authorized Signature', 400, doc.y + 15);
            doc.text('Sports Equipment Department', 400, doc.y + 30);

            // Add watermark or logo if needed
            doc.fontSize(8).fillColor('gray');
            doc.text('Generated automatically by Sports Equipment Management System', 50, doc.page.height - 50);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export const validatePDFGeneration = (student: IStudent, transactions: IEquipmentTransaction[]): string | null => {
    if (!student.name || !student.rollNumber || !student.email) {
        return 'Student information is incomplete';
    }

    const hasOverdueItems = transactions.some(t => t.status === 'Overdue');
    if (hasOverdueItems) {
        return 'Cannot generate No Dues certificate: Student has overdue equipment';
    }

    const hasPendingItems = transactions.some(t =>
        t.status === 'Taken' || t.status === 'ReturnedPendingApproval'
    );
    if (hasPendingItems) {
        return 'Cannot generate No Dues certificate: Student has pending equipment returns';
    }

    return null;
};
