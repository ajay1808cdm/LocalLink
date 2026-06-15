// src/pages/vendor/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { ordersAPI } from "../../services/api";
import { FiChevronRight, FiShoppingBag } from "react-icons/fi";

const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue",
  ready:"badge-green", out_for_delivery:"badge-green", delivered:"badge-green", cancelled:"badge-red"
};

const FILTERS = ["all","pending","confirmed","processing","delivered","cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    ordersAPI.myOrders().then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-3xl mx-auto px-4">
        <div className="mt-4 mb-4">
          <h1 className="font-display text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{orders.length} orders total</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4" style={{scrollbarWidth:"none"}}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary-DEFAULT text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary-DEFAULT"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="bg-gray-200 h-20 rounded-2xl animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">No {filter !== "all" ? filter : ""} orders found</p>
            {filter === "all" && (
              <Link to="/products" className="btn-primary text-sm mt-4 inline-block">Browse Products</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-pop">
                <div className="w-10 h-10 bg-primary-DEFAULT/10 rounded-xl flex items-center justify-center shrink-0">
                  <FiShoppingBag size={16} className="text-primary-DEFAULT"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("en-IN")} · {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="font-bold text-gray-800 text-sm">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                  <span className={STATUS_COLORS[order.status] || "badge-yellow"}>{order.status.replace(/_/g," ")}</span>
                </div>
                <FiChevronRight size={14} className="text-gray-400 shrink-0"/>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
