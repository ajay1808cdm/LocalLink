// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { adminAPI } from "../../services/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { FiUsers, FiPackage, FiShoppingBag, FiTrendingUp, FiChevronRight } from "react-icons/fi";

const COLORS = ["#2d7a3a","#f97316","#fbbf24","#3b82f6","#ef4444","#a855f7","#10b981","#d97706"];

const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", delivered:"badge-green", cancelled:"badge-red"
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-20 px-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(8)].map((_,i) => <div key={i} className="bg-gray-200 h-24 rounded-2xl animate-pulse"/>)}
      </div>
    </div>
  );

  const { stats, monthly_data, category_data, recent_users } = data || {};

  const STAT_CARDS = [
    { label:"Farmers",       value: stats?.farmers,       icon:"👨‍🌾", color:"bg-green-50 text-green-700",  to:"/admin/users?role=farmer" },
    { label:"Vendors",       value: stats?.vendors,       icon:"🏪",  color:"bg-orange-50 text-orange-700", to:"/admin/users?role=vendor" },
    { label:"Products",      value: stats?.products,      icon:"🌾",  color:"bg-yellow-50 text-yellow-700", to:"/admin/products" },
    { label:"Total Orders",  value: stats?.orders,        icon:"📦",  color:"bg-blue-50 text-blue-700",    to:"/admin/orders" },
    { label:"Pending Orders",value: stats?.pending_orders,icon:"⏳",  color:"bg-amber-50 text-amber-700",  to:"/admin/orders" },
    { label:"Revenue",       value:`₹${parseFloat(stats?.revenue||0).toLocaleString("en-IN")}`, icon:"💰", color:"bg-emerald-50 text-emerald-700", to:"/admin/orders" },
  ];

  const chartData = (monthly_data || []).reverse().map(m => ({
    month: m.month?.slice(5),
    orders: m.count,
    revenue: parseFloat(m.revenue || 0)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-6 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mt-5 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">LocalLink platform overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {STAT_CARDS.map(card => (
            <Link key={card.label} to={card.to} className={`card p-4 text-center ${card.color} border-0 hover:shadow-pop`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <p className="font-bold text-xl">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.label}</p>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Monthly Orders + Revenue */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-4">Monthly Orders & Revenue</h2>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}/>
                  <Tooltip formatter={(val, name) => name === "revenue" ? `₹${val.toLocaleString()}` : val}/>
                  <Legend/>
                  <Bar yAxisId="left" dataKey="orders" fill="#2d7a3a" name="Orders" radius={[4,4,0,0]}/>
                  <Bar yAxisId="right" dataKey="revenue" fill="#f97316" name="Revenue ₹" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Pie */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Products by Category</h2>
            {!category_data?.length ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={category_data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {category_data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Users</h2>
              <Link to="/admin/users" className="text-primary-DEFAULT text-sm font-medium flex items-center gap-0.5">
                View All <FiChevronRight size={13}/>
              </Link>
            </div>
            <div className="space-y-3">
              {recent_users?.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-DEFAULT/10 flex items-center justify-center text-primary-DEFAULT font-bold text-sm shrink-0">
                    {u.full_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.role==="farmer"?"bg-green-100 text-green-700"
                      :u.role==="admin"?"bg-blue-100 text-blue-700"
                      :u.role==="customer"?"bg-purple-100 text-purple-700"
                      :"bg-orange-100 text-orange-700"}`}>
                      {u.role}
                    </span>
                    <span className={`text-xs ${u.is_active?"text-green-500":"text-red-400"}`}>
                      {u.is_active?"Active":"Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to:"/admin/users",    icon:"👥", label:"Manage All Users",    sub:"View, activate/deactivate" },
                { to:"/admin/products", icon:"🌾", label:"Manage Products",     sub:"Feature, delete products" },
                { to:"/admin/orders",   icon:"📦", label:"Monitor Orders",      sub:"Track all orders" },
              ].map(a => (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.sub}</p>
                  </div>
                  <FiChevronRight size={14} className="text-gray-400"/>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
