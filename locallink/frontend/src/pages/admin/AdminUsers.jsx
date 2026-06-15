// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import { adminAPI } from "../../services/api";
import { FiSearch, FiToggleRight, FiToggleLeft } from "react-icons/fi";
import toast from "react-hot-toast";

const ROLE_TABS = ["all","farmer","vendor","customer","admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetch = (role) => {
    setLoading(true);
    adminAPI.users(role && role !== "all" ? { role } : {})
      .then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(roleFilter); }, [roleFilter]);

  const toggleUser = async (id, name, isActive) => {
    await adminAPI.toggleUser(id);
    toast.success(`${name} ${isActive ? "deactivated" : "activated"}`);
    fetch(roleFilter);
  };

  const filtered = search
    ? users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-6 max-w-5xl mx-auto px-4">
        <div className="mt-4 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} total users</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/30"/>
          </div>
          <div className="flex gap-2">
            {ROLE_TABS.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  roleFilter === r ? "bg-primary-DEFAULT text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["User","Email","Role","Phone","Status","Action"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_,i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3">
                      <div className="bg-gray-200 h-6 rounded animate-pulse"/>
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-DEFAULT/10 flex items-center justify-center text-primary-DEFAULT font-bold text-xs">
                          {u.full_name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.role==="farmer"?"bg-green-100 text-green-700"
                        :u.role==="admin"?"bg-blue-100 text-blue-700"
                        :u.role==="customer"?"bg-purple-100 text-purple-700"
                        :"bg-orange-100 text-orange-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${u.is_active?"text-green-600":"text-red-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u.id, u.full_name, u.is_active)}
                        title={u.is_active ? "Deactivate" : "Activate"}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_active?"text-green-600 hover:bg-green-50":"text-gray-400 hover:bg-gray-100"}`}>
                        {u.is_active ? <FiToggleRight size={20}/> : <FiToggleLeft size={20}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
