import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Auth pages
import RoleSelectionPage from "./pages/auth/RoleSelectionPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Shared pages
import HomePage from "./pages/shared/HomePage";
import ProductsPage from "./pages/shared/ProductsPage";
import ProductDetailPage from "./pages/shared/ProductDetailPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import ProfilePage from "./pages/shared/ProfilePage";
import CategoriesPage from "./pages/shared/CategoriesPage";

// Vendor pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import CartPage from "./pages/vendor/CartPage";
import OrdersPage from "./pages/vendor/OrdersPage";
import OrderTrackPage from "./pages/vendor/OrderTrackPage";
import WishlistPage from "./pages/vendor/WishlistPage";
import FarmerProfile from "./pages/vendor/FarmerProfile";

// Farmer pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import ManageProducts from "./pages/farmer/ManageProducts";
import AddProduct from "./pages/farmer/AddProduct";
import FarmerOrders from "./pages/farmer/FarmerOrders";

// Customer pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";

// Route guards
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "farmer") return <Navigate to="/farmer" replace />;
    if (user.role === "customer") return <Navigate to="/customer" replace />;
    if (user.role === "vendor") return <Navigate to="/vendor" replace />;
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: "12px", fontFamily: "Plus Jakarta Sans", fontSize: "14px" } }} />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><RoleSelectionPage /></PublicRoute>} />
            <Route path="/login/:role" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Shared (authenticated) */}
            <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
            <Route path="/products/:id" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* Vendor */}
            <Route path="/vendor" element={<PrivateRoute roles={["vendor"]}><VendorDashboard /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute roles={["vendor"]}><CartPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute roles={["vendor"]}><OrdersPage /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute roles={["vendor"]}><OrderTrackPage /></PrivateRoute>} />
            <Route path="/wishlist" element={<PrivateRoute roles={["vendor"]}><WishlistPage /></PrivateRoute>} />
            <Route path="/farmer/:id" element={<PrivateRoute roles={["vendor"]}><FarmerProfile /></PrivateRoute>} />

            {/* Farmer */}
            <Route path="/farmer" element={<PrivateRoute roles={["farmer"]}><FarmerDashboard /></PrivateRoute>} />
            <Route path="/farmer/products" element={<PrivateRoute roles={["farmer"]}><ManageProducts /></PrivateRoute>} />
            <Route path="/farmer/products/add" element={<PrivateRoute roles={["farmer"]}><AddProduct /></PrivateRoute>} />
            <Route path="/farmer/orders" element={<PrivateRoute roles={["farmer"]}><FarmerOrders /></PrivateRoute>} />

            {/* Customer */}
            <Route path="/customer" element={<PrivateRoute roles={["customer"]}><CustomerDashboard /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<PrivateRoute roles={["admin"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={["admin"]}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute roles={["admin"]}><AdminProducts /></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute roles={["admin"]}><AdminOrders /></PrivateRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
}
