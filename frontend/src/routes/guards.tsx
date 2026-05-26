import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/models';

const Spinner = () => (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
    </div>
);

/** Route accessible uniquement aux utilisateurs connectés */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <Spinner />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

/** Route accessible à ADMIN et EMPLOYEE */
export function DashboardRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <Spinner />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.EMPLOYEE)
        return <Navigate to="/" replace />;
    return <>{children}</>;
}

/** Route accessible à ADMIN uniquement */
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <Spinner />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== UserRole.ADMIN) return <Navigate to="/admin" replace />;
    return <>{children}</>;
}

/** Route accessible uniquement aux visiteurs non connectés */
export function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}
