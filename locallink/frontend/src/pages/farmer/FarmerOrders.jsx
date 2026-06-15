// src/pages/farmer/FarmerOrders.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import { ordersAPI } from "../../services/api";
import { FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const STATUS_FLOW = ["pending","confirmed","processing","ready","out_for_delivery","delivered"];
const STATUS_COLORS = {
  pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue",
  ready:"badge-green", out_for_delivery:"badge-green", delivered:"badge-green", cancelled:"badge-red"
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetch = () => ordersAPI.farmerIncoming().then(r=>setOrders(r.data)).finally(()=>setLoading(false));
  useEffect(() => { fetch(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetch();
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-3xl mx-auto px-4">
        <div className="mt-4 flex items-center gap-3 mb-5">
          <Link to="/farmer" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={18}/></Link>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-800">Incoming Orders</h1>
            <p className="text-xs text-gray-400">{orders.length} orders total</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="bg-gray-200 h-24 rounded-2xl animate-pulse"/>)}</div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Orders from vendors will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const isExpanded = expanded === order.id;
              const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
              return (
                <div key={order.id} className="card overflow-hidden">
                  <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={()=>setExpanded(isExpanded?null:order.id)}>
                    <div className="w-10 h-10 bg-secondary-DEFAULT/10 rounded-xl flex items-center justify-center text-secondary-DEFAULT font-bold text-sm shrink-0">
                      #{order.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                        <span className={STATUS_COLORS[order.status]}>{order.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{order.vendor_name} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                      <FiChevronDown size={14} className={`text-gray-400 ml-auto transition-transform ${isExpanded?"rotate-180":""}`}/>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Delivery:</span> {order.delivery_type} · {order.payment_method}</p>
                      {order.delivery_address && <p className="text-xs text-gray-500 mb-3"><span className="font-semibold">Address:</span> {order.delivery_address}</p>}

                      {/* Status Update */}
                      {order.status !== "delivered" && order.status !== "cancelled" && nextStatus && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={()=>updateStatus(order.id, nextStatus)}
                            className="btn-primary text-xs py-2 px-4">
                            Mark as {nextStatus.replace(/_/g," ")} →
                          </button>
                          {order.status === "pending" && (
                            <button onClick={()=>updateStatus(order.id,"cancelled")}
                              className="text-xs px-4 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50">
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
