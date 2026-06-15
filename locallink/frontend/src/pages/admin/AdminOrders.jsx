// src/pages/admin/AdminOrders.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { adminAPI } from "../../services/api";
import { FiSearch, FiExternalLink } from "react-icons/fi";

const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue",
  ready:"badge-green", out_for_delivery:"badge-green", delivered:"badge-green", cancelled:"badge-red"
};

const STATUS_FILTERS = ["all","pending","confirmed","processing","ready","delivered","cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetch = (status) => {
    setLoading(true);
    adminAPI.orders(status && status !== "all" ? { status } : {})
      .then(r => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(statusFilter); }, [statusFilter]);

  const filtered = search
    ? orders.filter(o => o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.vendor_name?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-6 max-w-6xl mx-auto px-4">
        <div className="mt-4 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800">Order Management</h1>
          <p className="text-gray-400 text-sm">{orders.length} orders</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or vendor..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/30"/>
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s ? "bg-primary-DEFAULT text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
                {s.replace(/_/g," ")}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order #","Vendor","Amount","Payment","Delivery","Status","Date","View"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(8)].map((_,i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3">
                    <div className="bg-gray-200 h-6 rounded animate-pulse"/>
                  </td></tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">No orders found</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-800">{o.order_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{o.vendor_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-DEFAULT">₹{parseFloat(o.total_amount).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{o.payment_method} · <span className={o.payment_status==="paid"?"text-green-600":"text-yellow-600"}>{o.payment_status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{o.delivery_type}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_COLORS[o.status] || "badge-yellow"}>{o.status.replace(/_/g," ")}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o.id}`} className="p-1.5 text-primary-DEFAULT hover:bg-primary-DEFAULT/10 rounded-lg inline-flex" title="View Order">
                        <FiExternalLink size={13}/>
                      </Link>
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
