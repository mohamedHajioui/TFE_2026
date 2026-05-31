import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, DashboardRoute, AdminOnlyRoute, GuestRoute } from './guards';

import Home from '@/pages/client/home/home';
import Menus from '@/pages/client/menu/menu';
import Products from '@/pages/client/products/products';
import Cart from '@/pages/client/cart/cart';
import Checkout from '@/pages/client/checkout/checkout';
import CheckoutSuccess from '@/pages/client/checkout/checkout-success';
import CheckoutCancel from '@/pages/client/checkout/checkout-cancel';
import Login from '@/pages/client/auth/login';
import Register from '@/pages/client/auth/register';
import Profile from '@/pages/client/profile/profile';
import Orders from '@/pages/client/orders/orders';
import Dashboard from '@/pages/dashboard/home/home';
import DashboardPOS from '@/pages/dashboard/pos/pos';
import DashboardOrders from '@/pages/dashboard/orders/orders';
import DashboardMenus from '@/pages/dashboard/menus/menus';
import DashboardProducts from '@/pages/dashboard/products/products';
import DashboardIngredients from '@/pages/dashboard/ingredients/ingredients';
import DashboardTimeSlots from '@/pages/dashboard/time-slots/time-slots';
import DashboardUsers from '@/pages/dashboard/users/users';
import DashboardStatistics from '@/pages/dashboard/statistics/statistics';
import DashboardKitchen from '@/pages/dashboard/kitchen/kitchen';

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />

            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

            <Route path="/admin" element={<DashboardRoute><Dashboard /></DashboardRoute>} />
            <Route path="/admin/pos" element={<DashboardRoute><DashboardPOS /></DashboardRoute>} />
            <Route path="/admin/orders" element={<DashboardRoute><DashboardOrders /></DashboardRoute>} />
            <Route path="/admin/menus" element={<DashboardRoute><DashboardMenus /></DashboardRoute>} />
            <Route path="/admin/products" element={<DashboardRoute><DashboardProducts /></DashboardRoute>} />
            <Route path="/admin/ingredients" element={<DashboardRoute><DashboardIngredients /></DashboardRoute>} />
            <Route path="/admin/timeslots" element={<DashboardRoute><DashboardTimeSlots /></DashboardRoute>} />
            <Route path="/admin/kitchen" element={<DashboardRoute><DashboardKitchen /></DashboardRoute>} />

            <Route path="/admin/statistics" element={<AdminOnlyRoute><DashboardStatistics /></AdminOnlyRoute>} />
            <Route path="/admin/users" element={<AdminOnlyRoute><DashboardUsers /></AdminOnlyRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
