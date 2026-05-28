import { Expose, Transform } from 'class-transformer';


export enum UserRole {
    CLIENT = 'CLIENT',
    EMPLOYEE = 'EMPLOYEE',
    ADMIN = 'ADMIN',
}

export const UserRoleLabel: Record<UserRole, string> = {
    [UserRole.ADMIN]:    'Administrateur',
    [UserRole.EMPLOYEE]: 'Employé',
    [UserRole.CLIENT]:   'Client',
};

export class UserModel {
    @Expose()
    id: number;

    @Expose()
    email: string;

    @Expose()
    displayName: string;

    @Expose()
    phoneNumber: string | null;

    @Expose()
    role: UserRole;

    @Expose()
    isActive: boolean;

    @Expose()
    hasPassword: boolean;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    get isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    get isEmployee(): boolean {
        return this.role === UserRole.EMPLOYEE;
    }

    get isClient(): boolean {
        return this.role === UserRole.CLIENT;
    }

    get hasStaffAccess(): boolean {
        return this.role === UserRole.ADMIN || this.role === UserRole.EMPLOYEE;
    }
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    displayName: string;
    password: string;
    phoneNumber?: string;
}

export interface AuthResponse {
    user: UserModel;
}