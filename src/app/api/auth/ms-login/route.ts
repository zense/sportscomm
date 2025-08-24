import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getMicrosoftUserInfo, extractRollNumberFromEmail, extractSportFromDepartment } from '@/lib/microsoft-auth';
import { generateToken } from '@/lib/auth';
import Student from '@/models/Student';
import Coach from '@/models/Coach';
import Admin from '@/models/Admin';
import { AuthUser } from '@/types';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { accessToken } = await request.json();

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Microsoft access token is required' },
                { status: 400 }
            );
        }

        // Get user info from Microsoft Graph
        const userInfo = await getMicrosoftUserInfo(accessToken);
        if (!userInfo) {
            return NextResponse.json(
                { error: 'Failed to fetch user information from Microsoft' },
                { status: 401 }
            );
        }

        const { id: microsoftId, displayName, mail } = userInfo;

        // Check if user exists in any of our collections
        const [existingStudent, existingCoach, existingAdmin] = await Promise.all([
            Student.findOne({ microsoftId }),
            Coach.findOne({ microsoftId }),
            Admin.findOne({ microsoftId })
        ]);

        let user: AuthUser;
        let role: 'Student' | 'Coach' | 'Admin';

        if (existingStudent) {
            user = {
                id: existingStudent._id.toString(),
                name: existingStudent.name,
                email: existingStudent.email,
                role: 'Student',
                sport: existingStudent.sport,
                microsoftId,
            };
            role = 'Student';
        } else if (existingCoach) {
            user = {
                id: existingCoach._id.toString(),
                name: existingCoach.name,
                email: existingCoach.email,
                role: 'Coach',
                sport: existingCoach.sport,
                microsoftId,
            };
            role = 'Coach';
        } else if (existingAdmin) {
            user = {
                id: existingAdmin._id.toString(),
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: 'Admin',
                microsoftId,
            };
            role = 'Admin';
        } else {
            // New user - determine if they should be auto-registered as a student
            const rollNumber = extractRollNumberFromEmail(mail);

            if (rollNumber) {
                // Auto-register as student if roll number can be extracted
                const sport = extractSportFromDepartment(userInfo.department, userInfo.jobTitle);

                const newStudent = new Student({
                    name: displayName,
                    rollNumber,
                    email: mail,
                    sport,
                    microsoftId,
                });

                await newStudent.save();

                user = {
                    id: newStudent._id.toString(),
                    name: newStudent.name,
                    email: newStudent.email,
                    role: 'Student',
                    sport: newStudent.sport,
                    microsoftId,
                };
                role = 'Student';
            } else {
                // Cannot auto-register - require manual registration
                return NextResponse.json(
                    {
                        error: 'User not found in system',
                        message: 'Please contact administrator to register your account',
                        userInfo: {
                            name: displayName,
                            email: mail,
                            microsoftId,
                        }
                    },
                    { status: 404 }
                );
            }
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            role: user.role,
            email: user.email,
            sport: user.sport,
        });

        // For Coach and Admin, they need additional password verification
        const requiresPasswordVerification = role === 'Coach' || role === 'Admin';

        return NextResponse.json({
            success: true,
            user,
            token: requiresPasswordVerification ? null : token,
            requiresPasswordVerification,
            message: requiresPasswordVerification
                ? 'Please enter your additional password to complete login'
                : 'Login successful'
        });

    } catch (error) {
        console.error('Microsoft login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
