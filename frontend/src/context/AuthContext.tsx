import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { UserModel, type LoginCredentials, type RegisterData } from '@/models/user.model';
import { authApi } from '@/api/auth.api';

interface AuthContextValue {
    user: UserModel | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const profile = await authApi.getProfile();
                setUser(profile);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const { user } = await authApi.login(credentials);
        setUser(user);
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const { user } = await authApi.register(data);
        setUser(user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // Même si le backend refuse (token expiré), on déconnecte côté client
        }
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const profile = await authApi.getProfile();
        setUser(profile);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: user !== null,
            login,
            register,
            logout,
            refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
    return context;
}