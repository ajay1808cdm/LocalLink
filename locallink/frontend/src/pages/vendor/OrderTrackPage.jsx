// src/pages/vendor/OrderTrackPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { ordersAPI, getImageUrl } from "../../services/api";
import { FiArrowLeft, FiCheckCircle, FiCircle, FiClock } from "react-icons/fi";

const STEPS = [
  { key:"pending",          label:"Order Placed",      emoji:"📝" },
  { key:"confirmed",        label:"Confirmed",         emoji:"✅" },
  { key:"processing",       label:"Processing",        emoji:"⚙️" },
  { key:"ready",            label:"Ready",             emoji:"📦" },
  { key:"out_for_delivery", label:"Out for Delivery",  emoji:"🚚" },
  { key:"delivered",        label:"Delivered",         emoji:"🎉" },
];

const STATUS_IDX = Object.fromEntries(STEPS.map((s,i)=>[s.key,i]));
const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=60";

export default function OrderTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ordersAPI.detail(id).then(r=>setOrder(r.data)).finally(()=>setLoading(false)); }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="pt-20 px-4"><div className="bg-gray-200 h-64 rounded-2xl animate-pulse"/></div></div>;

  if (!order) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="pt-24 text-center text-gray-500">Order not found</div></div>;

  const currentIdx = order.status === "cancelled" ? -1 : (STATUS_IDX[order.status] ?? 0);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-2xl mx-auto px-4">
        <div className="mt-4 flex items-center gap-3 mb-5">
          <Link to="/orders" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={18}/></Link>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-800">Order Tracking</h1>
            <p className="text-xs text-gray-400">{order.order_number}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-2xl p-5 text-white mb-5 ${isCancelled ? "bg-red-500" : "bg-gradient-to-r from-primary-dark to-primary-DEFAULT"}`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{isCancelled ? "❌" : STEPS[currentIdx]?.emoji}</div>
            <div>
              <p className="font-bold text-lg">{isCancelled ? "Order Cancelled" : STEPS[currentIdx]?.label}</p>
              <p className="text-white/70 text-sm">Total: ₹{parseFloat(order.total_amount).toFixed(0)} · {order.delivery_type}</p>
            </div>
          </div>
        </div>

        {/* Tracker */}
        {!isCancelled && (
          <div className="card p-5 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-4">Order Progress</p>
            <div className="relative">
              {/* Track line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"/>
              <div className="absolute left-4 top-4 w-0.5 bg-primary-DEFAULT transition-all duration-500"
                style={{height:`${(currentIdx/(STEPS.length-1))*100}%`}}/>
              <div className="space-y-4">
                {STEPS.map((step, i) => {
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-colors ${
                        done ? "bg-primary-DEFAULT border-primary-DEFAULT text-white" : "bg-white border-gray-300 text-gray-400"
                      }`}>
                        {done ? <FiCheckCircle size={14}/> : <FiCircle size={14}/>}
                      </div>
                      <div className={`${current?"text-primary-DEFAULT font-semibold":done?"text-gray-700":"text-gray-400"}`}>
                        <span className="mr-1.5">{step.emoji}</span>
                        <span className="text-sm">{step.label}</span>
                        {current && <span className="ml-2 badge-green text-[10px]">Current</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="card p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Items Ordered</p>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={getImageUrl(item.image_url)} alt={item.product_name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0" onError={e=>{e.target.src=getImageUrl(null)}}/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-400">{item.farm_name} · {item.farmer_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{item.quantity} {item.unit} × ₹{parseFloat(item.unit_price).toFixed(0)}</p>
                  <p className="font-semibold text-gray-800 text-sm">₹{parseFloat(item.subtotal).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="font-bold text-primary-DEFAULT">₹{parseFloat(order.total_amount).toFixed(0)}</span>
          </div>
        </div>

        {/* Status History */}
        {order.history?.length > 0 && (
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Status History</p>
            <div className="space-y-2">
              {order.history.map((h,i) => (
                <div key={i} className="flex items-start gap-3">
                  <FiClock size={13} className="text-gray-400 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-xs font-medium text-gray-700 capitalize">{h.status.replace(/_/g," ")}</p>
                    <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
