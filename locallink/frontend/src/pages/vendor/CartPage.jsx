// src/pages/vendor/CartPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useCart } from "../../context/CartContext";
import { ordersAPI, getImageUrl } from "../../services/api";
import { FiTrash2, FiShoppingCart, FiArrowLeft, FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=60";

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, fetchCart } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ delivery_type:"pickup", payment_method:"cod", delivery_address:"", notes:"" });

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) { toast.error("Cart is empty"); return; }
    if (form.delivery_type === "delivery" && !form.delivery_address.trim()) {
      toast.error("Please enter delivery address"); return;
    }
    setPlacing(true);
    try {
      const items = cart.items.map(i => ({ product_id: i.product_id, quantity: parseFloat(i.quantity) }));
      const res = await ordersAPI.place({ items, ...form });
      await clearCart();
      toast.success(`Order ${res.data.order_number} placed!`);
      navigate(`/orders/${res.data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to place order");
    } finally { setPlacing(false); }
  };

  if (cart.items.length === 0) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-24 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Browse fresh products from local farmers</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-40 md:pb-6 max-w-2xl mx-auto px-4">
        <div className="mt-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/products" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={18}/></Link>
            <h1 className="font-display text-xl font-bold text-gray-800">My Cart</h1>
          </div>
          <span className="badge-green">{cart.items.length} item{cart.items.length > 1 ? "s" : ""}</span>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-5">
          {cart.items.map(item => (
            <div key={item.product_id} className="card p-4 flex items-center gap-3">
              <img src={getImageUrl(item.image_url)} alt={item.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0" onError={e=>{e.target.src=getImageUrl(null)}} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiMapPin size={9}/> {item.farmer_name}
                </p>
                <p className="text-primary-DEFAULT font-bold text-sm mt-0.5">₹{parseFloat(item.price).toFixed(0)}/{item.unit}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                  <FiTrash2 size={14}/>
                </button>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={()=>updateQty(item.product_id, parseFloat(item.quantity)-1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold">−</button>
                  <span className="px-2 text-sm font-semibold text-gray-800 min-w-8 text-center">{item.quantity}</span>
                  <button onClick={()=>updateQty(item.product_id, parseFloat(item.quantity)+1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold">+</button>
                </div>
                <p className="text-xs font-bold text-gray-700">₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Options */}
        <div className="card p-5 space-y-4 mb-4">
          <p className="font-semibold text-gray-800 text-sm">Order Options</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Delivery Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[["pickup","🏪 Pickup"],["delivery","🚚 Delivery"]].map(([val,label])=>(
                <button key={val} type="button" onClick={()=>setForm(f=>({...f,delivery_type:val}))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${form.delivery_type===val?"bg-primary-DEFAULT text-white border-primary-DEFAULT":"bg-white text-gray-600 border-gray-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.delivery_type === "delivery" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delivery Address *</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Enter your complete delivery address..."
                value={form.delivery_address} onChange={e=>setForm(f=>({...f,delivery_address:e.target.value}))} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[["cod","💵 Cash"],["upi","📱 UPI"],["bank","🏦 Bank"]].map(([val,label])=>(
                <button key={val} type="button" onClick={()=>setForm(f=>({...f,payment_method:val}))}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.payment_method===val?"bg-primary-DEFAULT text-white border-primary-DEFAULT":"bg-white text-gray-600 border-gray-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (Optional)</label>
            <input className="input-field" placeholder="Any special instructions..." value={form.notes}
              onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          </div>
        </div>

        {/* Order Summary sticky */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm">{cart.items.length} items</span>
            <span className="font-bold text-lg text-gray-800">Total: ₹{cart.total.toFixed(0)}</span>
          </div>
          <button onClick={handlePlaceOrder} disabled={placing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
            {placing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Placing Order...</>
                     : <><FiShoppingCart size={16}/> Place Order — ₹{cart.total.toFixed(0)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
