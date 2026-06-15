// src/pages/shared/CategoriesPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { productsAPI } from "../../services/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI.categories().then(r => setCategories(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        <div className="mt-4 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-400 text-sm mt-0.5">Browse by product type</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_,i) => <div key={i} className="bg-gray-200 h-32 rounded-2xl animate-pulse"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`}
                className="card p-6 flex flex-col items-center gap-3 hover:shadow-pop text-center group">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</div>
                <div>
                  <p className="font-semibold text-gray-800">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
