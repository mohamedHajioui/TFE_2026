import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Orders from '@/pages/orders';
import {UserRole} from "@/models";
import AdminDashboard from "@/pages/admin/AdminDashboard.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.EMPLOYEE) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <AppRoutes />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}