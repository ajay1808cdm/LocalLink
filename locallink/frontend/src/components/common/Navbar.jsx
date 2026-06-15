// src/components/common/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  FiHome, FiShoppingBag, FiHeart, FiUser, FiBell,
  FiLogOut, FiMenu, FiX, FiShoppingCart, FiGrid,
  FiPackage, FiBarChart2
} from "react-icons/fi";

const FARMER_NAV = [
  { to: "/farmer",          icon: FiBarChart2,   label: "Dashboard" },
  { to: "/farmer/products", icon: FiPackage,     label: "My Products" },
  { to: "/farmer/orders",   icon: FiShoppingBag, label: "Orders" },
  { to: "/notifications",   icon: FiBell,        label: "Alerts" },
  { to: "/profile",         icon: FiUser,        label: "Profile" },
];

const VENDOR_NAV = [
  { to: "/home",         icon: FiHome,        label: "Home" },
  { to: "/products",     icon: FiGrid,        label: "Products" },
  { to: "/cart",         icon: FiShoppingCart,label: "Cart", badge: true },
  { to: "/orders",       icon: FiShoppingBag, label: "Orders" },
  { to: "/profile",      icon: FiUser,        label: "Profile" },
];

const CUSTOMER_NAV = [
  { to: "/customer",     icon: FiBarChart2,   label: "Dashboard" },
  { to: "/home",         icon: FiHome,        label: "Home" },
  { to: "/products",     icon: FiGrid,        label: "Products" },
  { to: "/cart",         icon: FiShoppingCart,label: "Cart", badge: true },
  { to: "/orders",       icon: FiShoppingBag, label: "Orders" },
  { to: "/profile",      icon: FiUser,        label: "Profile" },
];

const ADMIN_NAV = [
  { to: "/admin",          icon: FiBarChart2,   label: "Dashboard" },
  { to: "/admin/users",    icon: FiUser,        label: "Users" },
  { to: "/admin/products", icon: FiPackage,     label: "Products" },
  { to: "/admin/orders",   icon: FiShoppingBag, label: "Orders" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "farmer" ? FARMER_NAV
                 : user?.role === "admin"  ? ADMIN_NAV
                 : user?.role === "customer" ? CUSTOMER_NAV
                 : VENDOR_NAV;

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-DEFAULT rounded-lg flex items-center justify-center text-white font-display font-bold text-sm">LL</div>
            <span className="font-display font-bold text-xl text-primary-DEFAULT hidden sm:block">Local<span className="text-secondary-DEFAULT">Link</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <Link key={to} to={to}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(to) ? "bg-primary-DEFAULT/10 text-primary-DEFAULT" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <Icon size={16} />
                {label}
                {badge && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-DEFAULT text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">{cartCount}</span>
                )}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {(user?.role === "vendor" || user?.role === "customer") && (
              <Link to="/notifications" className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <FiBell size={18} />
              </Link>
            )}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 bg-primary-DEFAULT/10 rounded-full flex items-center justify-center text-primary-DEFAULT font-semibold text-sm">
                {user?.full_name?.[0] || "U"}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{user?.full_name?.split(" ")[0]}</span>
              <button onClick={() => { logout(); navigate("/"); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <FiLogOut size={16} />
              </button>
            </div>
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(to) ? "bg-primary-DEFAULT/10 text-primary-DEFAULT" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <Icon size={17} />
                {label}
                {badge && cartCount > 0 && (
                  <span className="ml-auto bg-secondary-DEFAULT text-white text-xs rounded-full px-2 py-0.5 font-bold">{cartCount}</span>
                )}
              </Link>
            ))}
            <button onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
              <FiLogOut size={17} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Tab Bar (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-1 flex justify-around">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label, badge }) => (
          <Link key={to} to={to}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 ${
              isActive(to) ? "text-primary-DEFAULT" : "text-gray-400"
            }`}>
            <div className="relative">
              <Icon size={20} />
              {badge && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary-DEFAULT text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">{cartCount}</span>
              )}
            </div>
            <span className="text-xs truncate">{label}</span>
            {isActive(to) && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-DEFAULT rounded-full" />}
          </Link>
        ))}
      </div>
    </>
  );
}
