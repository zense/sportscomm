import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import EquipmentTransaction from '@/models/EquipmentTransaction';
import Student from '@/models/Student';
import { DashboardStats } from '@/types';

async function handleRequest() {
    try {
        await connectDB();

        // Update overdue items first
        const now = new Date();
        await EquipmentTransaction.updateMany(
            {
                status: 'Taken',
                dueDate: { $lt: now }
            },
            { status: 'Overdue' }
        );

        // Get dashboard statistics
        const [
            activeBorrowings,
            pendingReturns,
            overdueEquipment,
            totalStudents,
            totalEquipment,
            recentTransactions
        ] = await Promise.all([
            EquipmentTransaction.countDocuments({ status: 'Taken' }),
            EquipmentTransaction.countDocuments({ status: 'ReturnedPendingApproval' }),
            EquipmentTransaction.countDocuments({ status: 'Overdue' }),
            Student.countDocuments(),
            EquipmentTransaction.countDocuments(),
            EquipmentTransaction.find()
                .populate('student', 'name rollNumber sport')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        const stats: DashboardStats = {
            activeBorrowings,
            pendingReturns,
            overdueEquipment,
            totalStudents,
            totalEquipment,
        };

        // Get equipment distribution by sport
        const equipmentBySport = await EquipmentTransaction.aggregate([
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
                    _id: '$student.sport',
                    count: { $sum: 1 },
                    active: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Taken'] }, 1, 0]
                        }
                    },
                    overdue: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get recent activity trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activityTrends = await EquipmentTransaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    requests: { $sum: 1 },
                    taken: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Taken'] }, 1, 0]
                        }
                    },
                    returned: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return NextResponse.json({
            success: true,
            stats,
            equipmentBySport,
            activityTrends,
            recentTransactions
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isAdmin(handleRequest);
