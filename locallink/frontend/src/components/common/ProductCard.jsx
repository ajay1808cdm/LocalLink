// src/components/common/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiMapPin, FiStar } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { vendorAPI, getImageUrl } from "../../services/api";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";

export default function ProductCard({ product, onWishlistChange }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(product.wishlisted || false);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "vendor") { toast.error("Login as vendor to add to cart"); return; }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      toast.success("Added to cart!");
    } catch { toast.error("Failed to add"); }
    finally { setAdding(false); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "vendor") return;
    try {
      const res = await vendorAPI.toggleWishlist(product.id);
      setWishlisted(res.data.wishlisted);
      onWishlistChange?.();
    } catch {}
  };

  const isOutOfStock = product.available_qty <= 0;

  return (
    <Link to={`/products/${product.id}`} className="card group block overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = getImageUrl(null); }}
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_organic  && <span className="badge-green text-[10px]">🌿 Organic</span>}
          {product.is_featured && <span className="badge-orange text-[10px]">⭐ Featured</span>}
          {isOutOfStock        && <span className="badge-red text-[10px]">Out of Stock</span>}
        </div>
        {/* Wishlist */}
        {user?.role === "vendor" && (
          <button onClick={handleWishlist}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
            <FiHeart size={13} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-1">{product.name}</h3>
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold shrink-0">
              <FiStar size={10} className="fill-amber-400 text-amber-400" />
              {parseFloat(product.rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <FiMapPin size={10} className="shrink-0" />
          <span className="truncate">{product.location || product.farm_name || product.farmer_name} · {product.village || product.district}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary-DEFAULT font-bold text-base">₹{parseFloat(product.price).toFixed(0)}</span>
            <span className="text-gray-400 text-xs ml-0.5">/{product.unit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">{product.available_qty} {product.unit}</span>
            {user?.role === "vendor" && !isOutOfStock && (
              <button onClick={handleAddToCart} disabled={adding}
                className="bg-primary-DEFAULT hover:bg-primary-dark text-white rounded-lg p-1.5 transition-colors disabled:opacity-60">
                <FiShoppingCart size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
