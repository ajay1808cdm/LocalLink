// src/pages/shared/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { productsAPI, getImageUrl } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { FiShoppingCart, FiHeart, FiMapPin, FiStar, FiArrowLeft, FiTruck, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    productsAPI.get(id).then(r => setProduct(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user || user.role !== "vendor") { toast.error("Login as vendor to add to cart"); return; }
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      toast.success("Added to cart!");
    } finally { setAdding(false); }
  };

  const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80";

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="bg-gray-200 h-72 rounded-2xl animate-pulse mb-4" />
        <div className="bg-gray-200 h-8 rounded-xl animate-pulse mb-2 w-2/3" />
        <div className="bg-gray-200 h-6 rounded-xl animate-pulse w-1/3" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-24 text-center"><p className="text-gray-500">Product not found</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-2xl mx-auto">
        {/* Back */}
        <div className="px-4 mt-4">
          <Link to="/products" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-DEFAULT">
            <FiArrowLeft size={14} /> Back to Products
          </Link>
        </div>

        {/* Image */}
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden aspect-video bg-gray-200">
          <img src={getImageUrl(product.image_url)}
            alt={product.name} className="w-full h-full object-cover"
            onError={e => { e.target.src = getImageUrl(null); }} />
        </div>

        {/* Info */}
        <div className="px-4 mt-4">
          <div className="flex items-start gap-2 justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-800">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {product.is_organic && <span className="badge-green">🌿 Organic</span>}
                {product.is_featured && <span className="badge-orange">⭐ Featured</span>}
                <span className={`badge-${product.is_available ? "green" : "red"}`}>
                  {product.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-primary-DEFAULT">₹{parseFloat(product.price).toFixed(0)}</p>
              <p className="text-gray-400 text-xs">per {product.unit}</p>
            </div>
          </div>

          {/* Farmer */}
          <Link to={`/farmer/${product.farmer_id}`} className="mt-4 flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-primary-DEFAULT/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary-DEFAULT/10 flex items-center justify-center text-primary-DEFAULT font-bold">
              {product.farmer_name?.[0] || "F"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">{product.farm_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiMapPin size={10} /> {product.village}, {product.district}, {product.state}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-600 flex items-center gap-0.5 justify-end">
                <FiStar size={10} className="fill-amber-400 text-amber-400" />
                {parseFloat(product.farmer_rating||0).toFixed(1)}
              </p>
              <p className="text-xs text-primary-DEFAULT font-medium">View Profile</p>
            </div>
          </Link>

          {/* Details */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label:"Available Qty", value:`${product.available_qty} ${product.unit}` },
              { label:"Min. Order", value:`${product.min_order_qty} ${product.unit}` },
              { label:"Category", value:product.category_name },
              { label:"Delivery", value: product.delivery_option === "both" ? "Pickup & Delivery" : product.delivery_option },
              product.harvest_date && { label:"Harvest Date", value: new Date(product.harvest_date).toLocaleDateString("en-IN") },
            ].filter(Boolean).map(item => (
              <div key={item.label} className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-1.5">About this Product</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Reviews */}
          {product.reviews?.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiStar className="text-amber-400" />
                Reviews ({product.total_reviews})
              </p>
              <div className="space-y-3">
                {product.reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{r.reviewer_name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_,i) => (
                          <FiStar key={i} size={11} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-500">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add to Cart - Sticky Bottom */}
        {user?.role === "vendor" && product.is_available && (
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(product.min_order_qty, q-1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold">−</button>
                <span className="px-4 py-2 font-semibold text-gray-800 min-w-12 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.available_qty, q+1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={adding}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <FiShoppingCart size={16} />
                {adding ? "Adding..." : `Add to Cart — ₹${(qty * product.price).toFixed(0)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
