// src/pages/shared/ProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ProductCard from "../../components/common/ProductCard";
import { productsAPI } from "../../services/api";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search:   searchParams.get("search")   || "",
    category: searchParams.get("category") || "",
    organic:  searchParams.get("organic")  || "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) };
      const res = await productsAPI.list(params);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { productsAPI.categories().then(r=>setCategories(r.data)); }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applyFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search:"", category:"", organic:"" });
    setPage(1);
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 md:pb-6 max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={filters.search}
              onChange={e => applyFilter("search", e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/30" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors ${
              showFilters || activeFilters ? "bg-primary-DEFAULT text-white border-primary-DEFAULT" : "bg-white border-gray-200 text-gray-600"}`}>
            <FiFilter size={15} />
            Filters
            {activeFilters > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-DEFAULT text-white rounded-full text-xs flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Filter Products</h3>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <FiX size={12} /> Clear All
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => applyFilter("category","")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!filters.category ? "bg-primary-DEFAULT text-white border-primary-DEFAULT" : "bg-white text-gray-600 border-gray-200 hover:border-primary-DEFAULT"}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => applyFilter("category", cat.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filters.category===cat.slug ? "bg-primary-DEFAULT text-white border-primary-DEFAULT" : "bg-white text-gray-600 border-gray-200 hover:border-primary-DEFAULT"}`}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Organic toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">🌿 Organic Only</p>
                <p className="text-xs text-gray-400">Show certified organic products</p>
              </div>
              <button onClick={() => applyFilter("organic", filters.organic ? "" : "1")}
                className={`w-11 h-6 rounded-full transition-colors ${filters.organic ? "bg-primary-DEFAULT" : "bg-gray-300"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${filters.organic ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""} found`}
          </p>
          {filters.category && (
            <span className="flex items-center gap-1 text-xs bg-primary-DEFAULT/10 text-primary-DEFAULT px-2 py-1 rounded-full font-medium">
              {categories.find(c=>c.slug===filters.category)?.icon} {categories.find(c=>c.slug===filters.category)?.name}
              <button onClick={() => applyFilter("category","")}><FiX size={10} /></button>
            </span>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(12)].map((_,i) => <div key={i} className="bg-gray-200 rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="text-5xl mb-3">🌾</div>
            <p className="text-gray-600 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="mt-4 btn-outline text-sm">Clear Filters</button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && !loading && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">
              ← Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total/12)}</span>
            <button disabled={page*12>=total} onClick={()=>setPage(p=>p+1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
