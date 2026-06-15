// src/pages/vendor/WishlistPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { vendorAPI, getImageUrl } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { FiHeart, FiShoppingCart, FiMapPin, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=70";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetch = () => vendorAPI.wishlist().then(r => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const removeFromWishlist = async (pid) => {
    await vendorAPI.toggleWishlist(pid);
    toast.success("Removed from wishlist");
    fetch();
  };

  const handleAddToCart = async (pid) => {
    await addToCart(pid, 1);
    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        <div className="mt-4 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiHeart className="text-red-500"/> My Wishlist
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} saved product{items.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_,i) => <div key={i} className="bg-gray-200 h-52 rounded-2xl animate-pulse"/>)}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-3">💔</div>
            <p className="text-gray-600 font-medium">Your wishlist is empty</p>
            <p className="text-gray-400 text-sm mt-1">Save products you love by tapping the heart icon</p>
            <Link to="/products" className="btn-primary text-sm mt-4 inline-block">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(item => (
              <div key={item.id} className="card overflow-hidden group">
                <Link to={`/products/${item.product_id}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={getImageUrl(item.image_url)}
                      alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = getImageUrl(null); }}/>
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/products/${item.product_id}`}>
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                      <FiMapPin size={9}/> {item.farmer_name}
                    </p>
                    <p className="text-primary-DEFAULT font-bold mt-1.5">
                      ₹{parseFloat(item.price).toFixed(0)}<span className="text-gray-400 text-xs font-normal ml-0.5">/{item.unit}</span>
                    </p>
                  </Link>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => handleAddToCart(item.product_id)}
                      disabled={!item.is_available}
                      className="flex-1 bg-primary-DEFAULT hover:bg-primary-dark text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
                      <FiShoppingCart size={11}/> Add
                    </button>
                    <button onClick={() => removeFromWishlist(item.product_id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 border border-red-100 rounded-lg transition-colors">
                      <FiTrash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
