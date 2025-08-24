import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdmin } from '@/middleware/auth';
import { hashPassword } from '@/lib/auth';
import Coach from '@/models/Coach';
import { CreateCoachRequest } from '@/types';

async function handleCreateCoach(request: NextRequest) {
    try {
        await connectDB();

        const { name, email, sport, password, microsoftId }: CreateCoachRequest = await request.json();

        if (!name || !email || !sport || !password || !microsoftId) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if coach already exists
        const existingCoach = await Coach.findOne({
            $or: [{ email }, { microsoftId }]
        });

        if (existingCoach) {
            return NextResponse.json(
                { error: 'Coach with this email or Microsoft ID already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create new coach
        const coach = new Coach({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            sport: sport.trim(),
            passwordHash,
            microsoftId,
        });

        await coach.save();

        // Return coach data without password hash
        const { passwordHash: removedPasswordHash, ...coachData } = coach.toObject();
        // Explicitly ignore passwordHash
        void removedPasswordHash;

        return NextResponse.json({
            success: true,
            coach: coachData,
            message: 'Coach created successfully'
        });
    } catch (error) {
        console.error('Create coach error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handleGetCoaches(request: NextRequest) {
    try {
        await connectDB();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const sport = url.searchParams.get('sport');

        const skip = (page - 1) * limit;

        // Build query
        const query: Record<string, string> = {};
        if (sport) {
            query.sport = sport;
        }

        // Get coaches
        const coaches = await Coach.find(query)
            .select('-passwordHash') // Exclude password hash
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Coach.countDocuments(query);

        // Get unique sports for filter
        const sportsResult = await Coach.aggregate([
            {
                $group: {
                    _id: '$sport'
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const sports = sportsResult.map(s => s._id).filter(Boolean);

        return NextResponse.json({
            success: true,
            coaches,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            sports
        });

    } catch (error) {
        console.error('Get coaches error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handleUpdateCoach(request: NextRequest) {
    try {
        await connectDB();

        const { id, name, email, sport, password } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Coach ID is required' },
                { status: 400 }
            );
        }

        const coach = await Coach.findById(id);
        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        // Update fields if provided
        if (name) coach.name = name.trim();
        if (email) coach.email = email.toLowerCase().trim();
        if (sport) coach.sport = sport.trim();
        if (password) {
            coach.passwordHash = await hashPassword(password);
        }

        await coach.save();

        // Return coach data without password hash
        const { passwordHash: updatedPasswordHash, ...coachData } = coach.toObject();
        // Explicitly ignore passwordHash
        void updatedPasswordHash;

        return NextResponse.json({
            success: true,
            coach: coachData,
            message: 'Coach updated successfully'
        });

    } catch (error) {
        console.error('Update coach error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handleDeleteCoach(request: NextRequest) {
    try {
        await connectDB();

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Coach ID is required' },
                { status: 400 }
            );
        }

        const coach = await Coach.findByIdAndDelete(id);
        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Coach deleted successfully'
        });

    } catch (error) {
        console.error('Delete coach error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = isAdmin(handleCreateCoach);
export const GET = isAdmin(handleGetCoaches);
export const PUT = isAdmin(handleUpdateCoach);
export const DELETE = isAdmin(handleDeleteCoach);
