import ExcelJS from 'exceljs';
import { IEquipmentTransaction, IAttendance, LogbookFilter, AttendanceFilter } from '@/types';

export const generateLogbookExcel = async (
    transactions: IEquipmentTransaction[],
    filter?: LogbookFilter
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Equipment Logbook');

    // Set up headers
    worksheet.columns = [
        { header: 'Transaction ID', key: 'id', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 20 },
        { header: 'Roll Number', key: 'rollNumber', width: 15 },
        { header: 'Sport', key: 'sport', width: 15 },
        { header: 'Equipment', key: 'equipment', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Requested Date', key: 'requestedDate', width: 15 },
        { header: 'Taken Date', key: 'takenDate', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
        { header: 'Returned Date', key: 'returnedDate', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' },
    };

    // Add data rows
    transactions.forEach((transaction) => {
        worksheet.addRow({
            id: transaction._id,
            studentName: transaction.student?.name || 'N/A',
            rollNumber: transaction.student?.rollNumber || 'N/A',
            sport: transaction.student?.sport || 'N/A',
            equipment: transaction.equipment,
            quantity: transaction.quantity,
            requestedDate: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A',
            takenDate: transaction.takenAt ? new Date(transaction.takenAt).toLocaleDateString() : 'N/A',
            dueDate: new Date(transaction.dueDate).toLocaleDateString(),
            returnedDate: transaction.returnedAt ? new Date(transaction.returnedAt).toLocaleDateString() : 'N/A',
            status: transaction.status,
            notes: transaction.notes || 'N/A',
        });
    });

    // Add filter information if provided
    if (filter) {
        const filterWorksheet = workbook.addWorksheet('Filter Applied');
        filterWorksheet.addRow(['Filter Information']);
        filterWorksheet.getRow(1).font = { bold: true };

        if (filter.student) filterWorksheet.addRow(['Student', filter.student]);
        if (filter.sport) filterWorksheet.addRow(['Sport', filter.sport]);
        if (filter.equipment) filterWorksheet.addRow(['Equipment', filter.equipment]);
        if (filter.startDate) filterWorksheet.addRow(['Start Date', filter.startDate.toLocaleDateString()]);
        if (filter.endDate) filterWorksheet.addRow(['End Date', filter.endDate.toLocaleDateString()]);
        if (filter.status) filterWorksheet.addRow(['Status', filter.status]);

        filterWorksheet.addRow(['Generated Date', new Date().toLocaleDateString()]);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
        if (column.header) {
            column.width = Math.max(column.width || 10, column.header.toString().length + 2);
        }
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const generateAttendanceExcel = async (
    attendanceRecords: IAttendance[],
    filter?: AttendanceFilter
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Records');

    // Set up headers
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 20 },
        { header: 'Roll Number', key: 'rollNumber', width: 15 },
        { header: 'Sport', key: 'sport', width: 15 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Marked By Role', key: 'markedByRole', width: 15 },
        { header: 'Marked At', key: 'markedAt', width: 20 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
    };

    // Add data rows
    attendanceRecords.forEach((record) => {
        const row = worksheet.addRow({
            date: new Date(record.date).toLocaleDateString(),
            studentName: record.student?.name || 'N/A',
            rollNumber: record.student?.rollNumber || 'N/A',
            sport: record.sport,
            status: record.status,
            markedByRole: record.markedByRole,
            markedAt: record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A',
        });

        // Color code attendance status
        if (record.status === 'Present') {
            row.getCell('status').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6FFE6' },
            };
        } else {
            row.getCell('status').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE6E6' },
            };
        }
    });

    // Add summary statistics
    const summaryWorksheet = workbook.addWorksheet('Summary');
    summaryWorksheet.addRow(['Attendance Summary']);
    summaryWorksheet.getRow(1).font = { bold: true, size: 14 };

    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;

    summaryWorksheet.addRow(['Total Records', totalRecords]);
    summaryWorksheet.addRow(['Present', presentCount]);
    summaryWorksheet.addRow(['Absent', absentCount]);
    summaryWorksheet.addRow(['Attendance Rate', `${totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0}%`]);

    // Add filter information if provided
    if (filter) {
        summaryWorksheet.addRow([]);
        summaryWorksheet.addRow(['Filter Applied']);
        summaryWorksheet.getRow(summaryWorksheet.lastRow!.number).font = { bold: true };

        if (filter.sport) summaryWorksheet.addRow(['Sport', filter.sport]);
        if (filter.date) summaryWorksheet.addRow(['Date', filter.date.toLocaleDateString()]);
        if (filter.startDate) summaryWorksheet.addRow(['Start Date', filter.startDate.toLocaleDateString()]);
        if (filter.endDate) summaryWorksheet.addRow(['End Date', filter.endDate.toLocaleDateString()]);

        summaryWorksheet.addRow(['Generated Date', new Date().toLocaleDateString()]);
    }

    // Auto-fit columns
    [worksheet, summaryWorksheet].forEach(ws => {
        ws.columns.forEach((column) => {
            if (column.header) {
                column.width = Math.max(column.width || 10, column.header.toString().length + 2);
            }
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const formatExcelDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString();
};

export const formatExcelDateTime = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString();
};
