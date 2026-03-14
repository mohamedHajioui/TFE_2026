import { Expose, Transform } from 'class-transformer';


export enum UserRole {
    CLIENT = 'CLIENT',
    EMPLOYEE = 'EMPLOYEE',
    ADMIN = 'ADMIN',
}

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
    @Transform(({ value }) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({ value }) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    // Helpers
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