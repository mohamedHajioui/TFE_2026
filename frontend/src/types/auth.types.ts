import { UserModel } from '@/models/user.model';

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