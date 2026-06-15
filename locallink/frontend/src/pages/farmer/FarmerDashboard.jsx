// src/pages/farmer/FarmerDashboard.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import { farmerAPI } from "../../services/api";
import { Link } from "react-router-dom";
import { FiPackage, FiShoppingBag, FiTrendingUp, FiPlus, FiChevronRight, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue",
  ready:"badge-green", out_for_delivery:"badge-green", delivered:"badge-green", cancelled:"badge-red"
};

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    farmerAPI.dashboard()
      .then(r => {
        setData(r.data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data?.detail
          || err.response?.data?.error
          || "Server error " + (err.response?.status || err.message);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-20 px-4 space-y-4">
        {[...Array(4)].map((_,i)=><div key={i} className="bg-gray-200 h-24 rounded-2xl animate-pulse"/>)}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 pb-12 max-w-md mx-auto px-4">
          <div className="card p-6 bg-white border border-red-100 shadow-xl rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <FiAlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Dashboard Error</h2>
            <p className="text-sm text-gray-600 bg-red-50/50 p-4 rounded-xl border border-red-100 text-left font-mono break-all leading-relaxed whitespace-pre-wrap">
              {error}
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
              💡 Try checking the database connection status at{" "}
              <a href="/api/debug/db" target="_blank" rel="noreferrer" className="underline font-semibold text-primary-DEFAULT hover:text-primary-dark">
                /api/debug/db
              </a>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-DEFAULT hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { 
    stats = { products: 0, active_products: 0, total_orders: 0, total_revenue: 0 },
    recent_orders = [],
    my_products = [],
    farmer = {}
  } = data || {};

  const STAT_CARDS = [
    { label:"Total Products", value: stats?.products || 0, icon:"🌾", color:"bg-green-50 text-green-700", sub:`${stats?.active_products || 0} active` },
    { label:"Total Orders",   value: stats?.total_orders || 0, icon:"📦", color:"bg-blue-50 text-blue-700", sub:"All time" },
    { label:"Total Revenue",  value:`₹${parseFloat(stats?.total_revenue||0).toFixed(0)}`, icon:"💰", color:"bg-orange-50 text-orange-700", sub:"All time earnings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        {/* Welcome */}
        <div className="mt-5 bg-gradient-to-r from-primary-dark to-primary-DEFAULT rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute right-4 top-4 text-5xl opacity-20">👨‍🌾</div>
          <p className="text-white/70 text-sm">Welcome back,</p>
          <h1 className="font-display text-2xl font-bold mt-0.5">{user?.full_name?.split(" ")[0]}</h1>
          <p className="text-white/70 text-sm mt-1">{farmer?.farm_name} · {farmer?.district}</p>
          <Link to="/farmer/products/add" className="inline-flex items-center gap-2 mt-3 bg-white text-primary-DEFAULT text-sm font-bold px-4 py-2 rounded-xl hover:shadow-md transition-shadow">
            <FiPlus size={15} /> Add New Product
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {STAT_CARDS.map(card => (
            <div key={card.label} className={`card p-4 text-center ${card.color} border-0`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <p className="font-bold text-xl">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { to:"/farmer/products", icon:"📦", label:"Manage Products", sub:"Add, edit, delete" },
            { to:"/farmer/orders",   icon:"📋", label:"View Orders",     sub:"Incoming orders" },
          ].map(action => (
            <Link key={action.to} to={action.to} className="card p-4 flex items-center gap-3 hover:shadow-pop">
              <span className="text-2xl">{action.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
                <p className="text-xs text-gray-400">{action.sub}</p>
              </div>
              <FiChevronRight size={14} className="text-gray-400 ml-auto" />
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/farmer/orders" className="text-primary-DEFAULT text-sm font-medium">View All</Link>
          </div>
          {recent_orders?.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent_orders?.map(order => (
                <div key={order.id || order.order_number} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-DEFAULT/10 rounded-xl flex items-center justify-center shrink-0">
                    <FiShoppingBag size={16} className="text-primary-DEFAULT" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-500 truncate">{order.vendor_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">₹{parseFloat(order.amount||0).toFixed(0)}</p>
                    <span className={STATUS_COLORS[order.status] || "badge-yellow"}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Products Preview */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">My Products</h2>
            <Link to="/farmer/products" className="text-primary-DEFAULT text-sm font-medium">Manage</Link>
          </div>
          {my_products?.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-gray-500 text-sm">No products added yet</p>
              <Link to="/farmer/products/add" className="btn-primary text-sm mt-3 inline-block">+ Add First Product</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {my_products?.map(p => (
                <div key={p.id || p.name} className="card p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{p.name}</p>
                    <span className={p.is_available ? "badge-green" : "badge-red"}>
                      {p.is_available ? "Live" : "Off"}
                    </span>
                  </div>
                  <p className="text-primary-DEFAULT font-bold">₹{parseFloat(p.price).toFixed(0)}/{p.unit}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.available_qty} {p.unit} left</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
