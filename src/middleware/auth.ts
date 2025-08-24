import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearerToken } from '@/lib/auth';
import { UserRole, JWTPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

export const withAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: AuthenticatedRequest): Promise<NextResponse> => {
        try {
            const authHeader = req.headers.get('authorization');
            const token = extractBearerToken(authHeader || undefined);

            if (!token) {
                return NextResponse.json(
                    { error: 'Authorization token required' },
                    { status: 401 }
                );
            }

            const payload = verifyToken(token);
            if (!payload) {
                return NextResponse.json(
                    { error: 'Invalid or expired token' },
                    { status: 401 }
                );
            }

            req.user = payload;
            return await handler(req);
        } catch (error) {
            console.error('Auth middleware error:', error);
            return NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            );
        }
    };
};

export const withRole = (allowedRoles: UserRole[]) => {
    return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
        return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
            if (!req.user) {
                return NextResponse.json(
                    { error: 'User not authenticated' },
                    { status: 401 }
                );
            }

            if (!allowedRoles.includes(req.user.role)) {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }

            return await handler(req);
        });
    };
};

export const isStudent = withRole(['Student']);
export const isCoach = withRole(['Coach']);
export const isAdmin = withRole(['Admin']);
export const isCoachOrAdmin = withRole(['Coach', 'Admin']);
export const isAdminOnly = withRole(['Admin']);

// Utility function to check if user can access specific sport data
export const canAccessSport = (userRole: UserRole, userSport: string | undefined, targetSport: string): boolean => {
    // Admins can access all sports
    if (userRole === 'Admin') {
        return true;
    }

    // Coaches can only access their assigned sport
    if (userRole === 'Coach') {
        return userSport === targetSport;
    }

    // Students can only access their own sport
    if (userRole === 'Student') {
        return userSport === targetSport;
    }

    return false;
};

// Utility function to check if user can access specific student data
export const canAccessStudent = (
    userRole: UserRole,
    userId: string,
    userSport: string | undefined,
    targetStudentId: string,
    targetStudentSport?: string
): boolean => {
    // Users can always access their own data
    if (userId === targetStudentId) {
        return true;
    }

    // Admins can access all student data
    if (userRole === 'Admin') {
        return true;
    }

    // Coaches can access students from their sport
    if (userRole === 'Coach' && userSport && targetStudentSport) {
        return userSport === targetStudentSport;
    }

    return false;
};
