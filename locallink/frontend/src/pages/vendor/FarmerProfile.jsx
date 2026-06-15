// src/pages/vendor/FarmerProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ProductCard from "../../components/common/ProductCard";
import { farmerAPI } from "../../services/api";
import { FiMapPin, FiStar, FiArrowLeft, FiPhone, FiPackage } from "react-icons/fi";

export default function FarmerProfile() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    farmerAPI.publicProfile(id).then(r => setFarmer(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-20 px-4">
        <div className="bg-gray-200 h-32 rounded-2xl animate-pulse mb-4"/>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_,i) => <div key={i} className="bg-gray-200 h-48 rounded-2xl animate-pulse"/>)}
        </div>
      </div>
    </div>
  );

  if (!farmer) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-24 text-center text-gray-500">Farmer not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        <div className="mt-4 mb-4">
          <Link to="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-DEFAULT mb-4">
            <FiArrowLeft size={14}/> Back
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-primary-dark to-primary-DEFAULT rounded-2xl p-6 text-white mb-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 translate-x-10 -translate-y-10"/>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-display font-bold shrink-0">
              {farmer.full_name?.[0] || "F"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold">{farmer.farm_name}</h1>
              <p className="text-white/80 text-sm">{farmer.full_name}</p>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <FiMapPin size={10}/> {farmer.village}, {farmer.district}, {farmer.state}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-white/90">
              <FiStar size={13} className="fill-amber-300 text-amber-300"/>
              <span className="text-sm font-semibold">{parseFloat(farmer.rating||0).toFixed(1)}</span>
              <span className="text-white/60 text-xs">({farmer.total_reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-white/90">
              <FiPackage size={13}/>
              <span className="text-sm font-semibold">{farmer.products?.length || 0} products</span>
            </div>
          </div>
          {farmer.land_area && (
            <p className="text-white/60 text-xs mt-1">🌾 {farmer.land_area} acres of farmland</p>
          )}
        </div>

        {/* Description */}
        {farmer.description && (
          <div className="card p-4 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">About the Farm</p>
            <p className="text-sm text-gray-600 leading-relaxed">{farmer.description}</p>
          </div>
        )}

        {/* Products */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🌾 Products from {farmer.farm_name}
            <span className="badge-green">{farmer.products?.length || 0}</span>
          </h2>
          {!farmer.products?.length ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-500 text-sm">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {farmer.products.map(p => <ProductCard key={p.id} product={{...p, farm_name: farmer.farm_name, farmer_name: farmer.full_name, village: farmer.village, district: farmer.district}}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
