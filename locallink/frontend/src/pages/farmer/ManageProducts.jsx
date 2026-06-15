// src/pages/farmer/ManageProducts.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { farmerAPI, productsAPI, getImageUrl } from "../../services/api";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => farmerAPI.myProducts().then(r=>setProducts(r.data)).finally(()=>setLoading(false));
  useEffect(() => { fetch(); }, []);

  const toggleAvail = async (p) => {
    await productsAPI.update(p.id, { is_available: p.is_available ? 0 : 1 });
    toast.success(`Product ${p.is_available ? "hidden" : "activated"}`);
    fetch();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await productsAPI.delete(id);
    toast.success("Product deleted");
    fetch();
  };

  const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=60";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-4xl mx-auto px-4">
        <div className="mt-4 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to="/farmer" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={18}/></Link>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-800">My Products</h1>
              <p className="text-xs text-gray-400">{products.length} products listed</p>
            </div>
          </div>
          <Link to="/farmer/products/add" className="btn-primary flex items-center gap-2 text-sm">
            <FiPlus size={15}/> Add Product
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="bg-gray-200 h-20 rounded-2xl animate-pulse"/>)}</div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-gray-600 font-medium">No products yet</p>
            <Link to="/farmer/products/add" className="btn-primary text-sm mt-4 inline-block">+ Add Your First Product</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className={`card p-4 flex items-center gap-3 ${!p.is_available?"opacity-60":""}`}>
                <img src={getImageUrl(p.image_url)} alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0" onError={e=>{e.target.src=getImageUrl(null)}} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                    <span className={p.is_available ? "badge-green" : "badge-red"}>
                      {p.is_available ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{p.category_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-primary-DEFAULT font-bold text-sm">₹{parseFloat(p.price).toFixed(0)}/{p.unit}</span>
                    <span className="text-xs text-gray-400">{p.available_qty} {p.unit} left</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={()=>toggleAvail(p)}
                    className={`p-2 rounded-lg transition-colors ${p.is_available?"text-green-600 hover:bg-green-50":"text-gray-400 hover:bg-gray-100"}`}>
                    {p.is_available ? <FiToggleRight size={20}/> : <FiToggleLeft size={20}/>}
                  </button>
                  <button onClick={()=>deleteProduct(p.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
