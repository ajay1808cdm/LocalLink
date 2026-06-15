// src/pages/shared/HomePage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ProductCard from "../../components/common/ProductCard";
import { productsAPI, vendorAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { FiSearch, FiChevronRight, FiMapPin, FiStar } from "react-icons/fi";

const BANNERS = [
  { bg:"from-primary-dark to-primary-DEFAULT", emoji:"🌾", title:"Fresh from the Farm", sub:"Direct from 200+ local farmers" },
  { bg:"from-orange-500 to-secondary-DEFAULT", emoji:"🍅", title:"Seasonal Specials", sub:"Best prices this harvest season" },
  { bg:"from-emerald-700 to-emerald-500",       emoji:"🥦", title:"100% Organic", sub:"Certified organic produce available" },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [nearbyFarmers, setNearbyFarmers] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.categories(),
      productsAPI.list({ per_page: 8 }),
      vendorAPI.nearbyFarmers(),
    ]).then(([cats, prods, farmers]) => {
      setCategories(cats.data);
      setFeaturedProducts(prods.data.products);
      setNearbyFarmers(farmers.data.slice(0, 6));
    }).finally(() => setLoading(false));

    const t = setInterval(() => setBannerIdx(i => (i+1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`);
  };

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 md:pb-6">
        {/* Hero Banner */}
        <div className={`bg-gradient-to-r ${banner.bg} mx-4 mt-4 rounded-2xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-30">{banner.emoji}</div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-white/10" />
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">LocalLink Marketplace</p>
          <h2 className="font-display text-2xl font-bold mb-1">{banner.title}</h2>
          <p className="text-white/80 text-sm">{banner.sub}</p>
          <Link to="/products" className="inline-block mt-3 bg-white text-primary-DEFAULT text-xs font-bold px-4 py-1.5 rounded-lg hover:shadow-md transition-shadow">
            Shop Now →
          </Link>
          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1">
            {BANNERS.map((_,i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i===bannerIdx?"bg-white w-3":"bg-white/40"}`}/>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="px-4 mt-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search vegetables, fruits, grains..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/30" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-DEFAULT text-white text-xs font-semibold px-3 py-1.5 rounded-xl">
              Search
            </button>
          </div>
        </form>

        {/* Categories */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-base">Categories</h2>
            <Link to="/categories" className="text-primary-DEFAULT text-sm font-medium flex items-center gap-0.5">
              All <FiChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" style={{scrollbarWidth:"none"}}>
            {loading ? [...Array(6)].map((_,i) => (
              <div key={i} className="flex-shrink-0 w-16 h-20 bg-gray-200 rounded-2xl animate-pulse" />
            )) : categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 w-16 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-base">Fresh Products</h2>
            <Link to="/products" className="text-primary-DEFAULT text-sm font-medium flex items-center gap-0.5">
              View All <FiChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_,i) => <div key={i} className="bg-gray-200 rounded-2xl h-48 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>

        {/* Nearby Farmers */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-base">Nearby Farmers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyFarmers.map(f => (
              <Link key={f.id} to={`/farmer/${f.id}`} className="card p-4 flex items-center gap-3 hover:shadow-pop">
                <div className="w-12 h-12 rounded-xl bg-primary-DEFAULT/10 flex items-center justify-center text-xl font-bold text-primary-DEFAULT shrink-0">
                  {f.full_name?.[0] || "F"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{f.farm_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FiMapPin size={10} /> {f.village}, {f.district}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-600 flex items-center gap-0.5">
                      <FiStar size={9} className="fill-amber-400 text-amber-400" />
                      {parseFloat(f.rating||0).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">{f.product_count} products</span>
                  </div>
                </div>
                <FiChevronRight size={14} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
