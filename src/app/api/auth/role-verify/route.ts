import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { comparePassword, generateToken } from '@/lib/auth';
import Coach from '@/models/Coach';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { microsoftId, role, password } = await request.json();

        if (!microsoftId || !role || !password) {
            return NextResponse.json(
                { error: 'Microsoft ID, role, and password are required' },
                { status: 400 }
            );
        }

        if (role !== 'Coach' && role !== 'Admin') {
            return NextResponse.json(
                { error: 'Invalid role for password verification' },
                { status: 400 }
            );
        }

        let user;
        if (role === 'Coach') {
            user = await Coach.findOne({ microsoftId });
        } else {
            user = await Admin.findOne({ microsoftId });
        }

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            role: role as 'Coach' | 'Admin',
            email: user.email,
            sport: role === 'Coach' ? user.sport : undefined,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role,
                sport: role === 'Coach' ? user.sport : undefined,
                microsoftId: user.microsoftId,
            },
            token,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Role verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
