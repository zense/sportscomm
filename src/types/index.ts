import { Document } from 'mongoose';

export interface IStudent extends Document {
    _id: string;
    name: string;
    rollNumber: string;
    email: string;
    sport: string;
    microsoftId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICoach extends Document {
    _id: string;
    name: string;
    email: string;
    sport: string;
    passwordHash: string;
    microsoftId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdmin extends Document {
    _id: string;
    name: string;
    email: string;
    passwordHash: string;
    microsoftId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEquipmentTransaction extends Document {
    _id: string;
    studentId: string;
    student?: IStudent;
    equipment: string;
    quantity: number;
    takenAt?: Date;
    dueDate: Date;
    returnedAt?: Date;
    status: 'Requested' | 'Taken' | 'ReturnedPendingApproval' | 'Approved' | 'Rejected' | 'Overdue';
    approvedBy?: string;
    approvedByRole?: 'Admin' | 'Coach';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAttendance extends Document {
    _id: string;
    studentId: string;
    student?: IStudent;
    sport: string;
    date: Date;
    status: 'Present' | 'Absent';
    markedByRole: 'Coach' | 'Admin';
    markedById: string;
    markedBy?: ICoach | IAdmin;
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = 'Student' | 'Coach' | 'Admin';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    sport?: string;
    microsoftId: string;
}

export interface DashboardStats {
    activeBorrowings: number;
    pendingReturns: number;
    overdueEquipment: number;
    totalStudents: number;
    totalEquipment: number;
}

export interface LogbookFilter {
    student?: string;
    sport?: string;
    equipment?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
}

export interface AttendanceFilter {
    sport?: string;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
}

export interface CreateCoachRequest {
    name: string;
    email: string;
    sport: string;
    password: string;
    microsoftId: string;
}

export interface EquipmentRequest {
    equipment: string;
    quantity: number;
    returnDate: Date;
    notes?: string;
}

export interface AttendanceMarkRequest {
    studentId: string;
    date: Date;
    status: 'Present' | 'Absent';
}

export interface MicrosoftUserInfo {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
}

export interface JWTPayload {
    userId: string;
    role: UserRole;
    email: string;
    sport?: string;
    iat?: number;
    exp?: number;
}
