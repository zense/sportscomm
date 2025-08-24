import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isCoach } from '@/middleware/auth';
import Student from '@/models/Student';

async function handleRequest(request: NextRequest) {
    try {
        await connectDB();

        // @ts-expect-error - NextJS request typing - user is set by middleware
        const { sport } = request.user;

        if (!sport) {
            return NextResponse.json(
                { error: 'Coach sport not found' },
                { status: 400 }
            );
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search');

        const skip = (page - 1) * limit;

        // Build query for students in coach's sport
        const query = { sport } as Record<string, unknown>;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get students
        const students = await Student.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Student.countDocuments(query);

        return NextResponse.json({
            success: true,
            students,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            sport
        });

    } catch (error) {
        console.error('Get coach students error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = isCoach(handleRequest);
