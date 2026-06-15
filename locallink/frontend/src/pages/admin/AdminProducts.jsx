// src/pages/admin/AdminProducts.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import { adminAPI, getImageUrl } from "../../services/api";
import { FiSearch, FiTrash2, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=50";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch = () => adminAPI.products().then(r => setProducts(r.data)).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await adminAPI.deleteProduct(id);
    toast.success("Product deleted");
    fetch();
  };

  const toggleFeature = async (id) => {
    await adminAPI.toggleFeature(id);
    toast.success("Updated");
    fetch();
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.farmer_name?.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-6 max-w-6xl mx-auto px-4">
        <div className="mt-4 mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-400 text-sm">{products.length} total products</p>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products or farmers..."
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/30"/>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Product","Farmer","Category","Price","Stock","Status","Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(8)].map((_,i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3">
                    <div className="bg-gray-200 h-6 rounded animate-pulse"/>
                  </td></tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No products found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={getImageUrl(p.image_url)} alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0" onError={e=>{e.target.src=getImageUrl(null)}}/>
                        <div>
                          <p className="text-sm font-medium text-gray-800 max-w-32 truncate">{p.name}</p>
                          {p.is_featured && <span className="text-xs text-amber-600">⭐ Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.farmer_name}<br/><span className="text-xs text-gray-400">{p.farm_name}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.category_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-DEFAULT">₹{parseFloat(p.price).toFixed(0)}/{p.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.available_qty} {p.unit}</td>
                    <td className="px-4 py-3">
                      <span className={p.is_available ? "badge-green" : "badge-red"}>
                        {p.is_available ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleFeature(p.id)} title="Toggle Featured"
                          className={`p-1.5 rounded-lg transition-colors ${p.is_featured?"text-amber-500 bg-amber-50":"text-gray-400 hover:bg-gray-100"}`}>
                          <FiStar size={14}/>
                        </button>
                        <button onClick={() => deleteProduct(p.id, p.name)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
