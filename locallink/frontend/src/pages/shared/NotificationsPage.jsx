// src/pages/shared/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import { notifAPI } from "../../services/api";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";

const TYPE_ICONS = {
  order_placed: "📦", order_confirmed: "✅", order_delivered: "🎉",
  new_product: "🌾", price_drop: "💸", low_stock: "⚠️",
  review: "⭐", system: "🔔"
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = () => notifAPI.get().then(r => {
    setNotifs(r.data.notifications);
    setUnread(r.data.unread_count);
  }).finally(() => setLoading(false));

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await notifAPI.markRead(id);
    fetch();
  };

  const markAllRead = async () => {
    await notifAPI.markAllRead();
    toast.success("All notifications marked as read");
    fetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-2xl mx-auto px-4">
        <div className="mt-4 flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FiBell/> Notifications
            </h1>
            {unread > 0 && <p className="text-xs text-primary-DEFAULT font-medium mt-0.5">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-primary-DEFAULT font-medium hover:underline">
              <FiCheckCircle size={14}/> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="bg-gray-200 h-16 rounded-2xl animate-pulse"/>)}</div>
        ) : notifs.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-gray-600 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">We'll notify you about orders and updates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-all ${!n.is_read ? "border-l-4 border-l-primary-DEFAULT" : ""}`}>
                <div className="text-2xl shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? "text-gray-600" : "text-gray-800 font-semibold"}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-DEFAULT shrink-0 mt-1"/>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
