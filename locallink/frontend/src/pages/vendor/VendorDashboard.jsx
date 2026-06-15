// src/pages/vendor/VendorDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { vendorAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { FiShoppingBag, FiHeart, FiShoppingCart, FiChevronRight, FiMapPin } from "react-icons/fi";

const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue",
  ready:"badge-green", out_for_delivery:"badge-green", delivered:"badge-green", cancelled:"badge-red"
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorAPI.dashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-20 px-4 space-y-4">
        {[...Array(4)].map((_,i) => <div key={i} className="bg-gray-200 h-24 rounded-2xl animate-pulse"/>)}
      </div>
    </div>
  );

  const { stats, recent_orders, vendor } = data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        {/* Welcome Banner */}
        <div className="mt-5 bg-gradient-to-r from-secondary-dark to-secondary-DEFAULT rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute right-4 top-4 text-5xl opacity-20">🏪</div>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10"/>
          <p className="text-white/70 text-sm">Welcome back,</p>
          <h1 className="font-display text-2xl font-bold mt-0.5">{user?.full_name?.split(" ")[0]}</h1>
          <p className="text-white/70 text-sm mt-1">{vendor?.shop_name} · {vendor?.district}</p>
          <Link to="/products" className="inline-flex items-center gap-2 mt-3 bg-white text-secondary-DEFAULT text-sm font-bold px-4 py-2 rounded-xl hover:shadow-md transition-shadow">
            🛒 Browse Products
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Orders",   value: stats?.total_orders  || 0,  icon:"📦", bg:"bg-blue-50 text-blue-700" },
            { label:"Total Spent",    value:`₹${parseFloat(stats?.total_spent||0).toFixed(0)}`, icon:"💸", bg:"bg-orange-50 text-orange-700" },
            { label:"Pending Orders", value: stats?.pending_orders || 0,  icon:"⏳", bg:"bg-yellow-50 text-yellow-700" },
            { label:"Wishlist Items", value: stats?.wishlist_count || 0,  icon:"❤️", bg:"bg-red-50 text-red-700" },
          ].map(card => (
            <div key={card.label} className={`card p-4 text-center ${card.bg} border-0`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <p className="font-bold text-xl">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to:"/products",  icon:"🥦", label:"Browse Products" },
            { to:"/cart",      icon:"🛒", label:"My Cart" },
            { to:"/orders",    icon:"📋", label:"My Orders" },
            { to:"/wishlist",  icon:"❤️", label:"Wishlist" },
          ].map(a => (
            <Link key={a.to} to={a.to} className="card p-4 flex flex-col items-center gap-2 hover:shadow-pop text-center">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/orders" className="text-primary-DEFAULT text-sm font-medium flex items-center gap-1">
              View All <FiChevronRight size={13}/>
            </Link>
          </div>
          {!recent_orders?.length ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link to="/products" className="btn-primary text-sm mt-3 inline-block">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent_orders.map(order => (
                <Link key={order.id} to={`/orders/${order.id}`} className="card p-4 flex items-center gap-3 hover:shadow-pop">
                  <div className="w-10 h-10 bg-secondary-DEFAULT/10 rounded-xl flex items-center justify-center text-secondary-DEFAULT font-bold text-sm shrink-0">
                    {order.order_number?.slice(-3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                    <span className={STATUS_COLORS[order.status] || "badge-yellow"}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
