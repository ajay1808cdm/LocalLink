// src/pages/shared/ProfilePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";
import { FiUser, FiMail, FiPhone, FiLogOut, FiShield, FiStar, FiChevronRight } from "react-icons/fi";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  const ROLE_BADGE = {
    farmer: { label:"Farmer", color:"bg-green-100 text-green-700", emoji:"👨‍🌾" },
    vendor: { label:"Vendor", color:"bg-orange-100 text-orange-700", emoji:"🏪" },
    customer: { label:"Customer", color:"bg-purple-100 text-purple-700", emoji:"🛍️" },
    admin:  { label:"Admin",  color:"bg-blue-100 text-blue-700",   emoji:"⚙️" },
  };
  const role = ROLE_BADGE[user?.role] || ROLE_BADGE.vendor;

  const MENU_ITEMS = [
    { icon:"📦", label: user?.role === "farmer" ? "My Products" : "My Orders",
      to: user?.role === "farmer" ? "/farmer/products" : "/orders" },
    { icon:"🔔", label:"Notifications", to:"/notifications" },
    ...(user?.role === "vendor" || user?.role === "customer" ? [{ icon:"❤️", label:"My Wishlist", to:"/wishlist" }] : []),
    ...(user?.role === "farmer" ? [{ icon:"📋", label:"Incoming Orders", to:"/farmer/orders" }] : []),
    ...(user?.role === "customer" ? [{ icon:"📊", label:"Customer Dashboard", to:"/customer" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="mt-5 card p-6 flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-primary-DEFAULT/10 flex items-center justify-center text-primary-DEFAULT font-display font-bold text-3xl mb-3">
            {user?.full_name?.[0] || "U"}
          </div>
          <h1 className="font-display text-xl font-bold text-gray-800">{user?.full_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`${role.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
              {role.emoji} {role.label}
            </span>
            {user?.is_verified && <span className="badge-blue">✓ Verified</span>}
          </div>
        </div>

        {/* Info */}
        <div className="card p-5 mb-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-1">Account Details</p>
          {[
            { icon: FiMail,  label:"Email",  value: user?.email },
            { icon: FiPhone, label:"Phone",  value: user?.phone || "Not set" },
            { icon: FiShield, label:"Role",  value: user?.role },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <item.icon size={14} className="text-gray-500"/>
              </div>
              <div>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="card p-2 mb-4">
          {MENU_ITEMS.map(item => (
            <a key={item.label} href={item.to}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
              <FiChevronRight size={14} className="text-gray-400"/>
            </a>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-2xl font-semibold hover:bg-red-100 transition-colors">
          <FiLogOut size={16}/> Sign Out
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">LocalLink v1.0 · Supporting local agriculture 🌾</p>
      </div>
    </div>
  );
}
