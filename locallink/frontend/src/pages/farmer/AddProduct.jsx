// src/pages/farmer/AddProduct.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { productsAPI } from "../../services/api";
import { FiArrowLeft, FiUpload } from "react-icons/fi";
import toast from "react-hot-toast";

const UNITS = ["kg","gram","litre","ml","dozen","piece","bundle","bag","box","quintal"];

export default function AddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    availability: true,
    location: "",
    min_order_qty: "1",
    is_organic: false,
    delivery_option: "both",
    harvest_date: ""
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { productsAPI.categories().then(r=>setCategories(r.data)); }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.quantity || !form.unit) {
      toast.error("Please fill all required fields"); return;
    }
    setLoading(true);
    try {
      const res = await productsAPI.add({
        name: form.name,
        category: form.category,
        category_id: form.category,
        price: parseFloat(form.price),
        unit: form.unit,
        quantity: parseFloat(form.quantity),
        available_qty: parseFloat(form.quantity),
        description: form.description,
        availability: form.availability,
        is_available: form.availability ? 1 : 0,
        location: form.location,
        min_order_qty: parseFloat(form.min_order_qty || 1),
        is_organic: form.is_organic ? 1 : 0,
        delivery_option: form.delivery_option,
        harvest_date: form.harvest_date
      });
      const pid = res.data.id;
      if (imageFile) {
        const fd = new FormData(); fd.append("image", imageFile);
        await productsAPI.uploadImage(pid, fd);
      }
      toast.success("Product added successfully!");
      navigate("/farmer/products");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add product");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-6 max-w-2xl mx-auto px-4">
        <div className="mt-4 flex items-center gap-3 mb-5">
          <Link to="/farmer/products" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-800">Add New Product</h1>
            <p className="text-gray-400 text-xs">Fill details to list your product</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Product Image</p>
            <label className="block">
              <div className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors h-40 overflow-hidden ${
                preview ? "border-primary-DEFAULT" : "border-gray-300 hover:border-primary-DEFAULT"}`}>
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FiUpload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 16MB</p>
                  </>
                )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImage} />
            </label>
          </div>

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Product Information</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name *</label>
              <input required className="input-field" placeholder="e.g. Fresh Tomatoes" value={form.name} onChange={e=>set("name",e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
              <select required className="input-field" value={form.category} onChange={e=>set("category",e.target.value)}>
                <option value="">Select a category</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea className="input-field resize-none" rows={3} placeholder="Describe your product, farming method, quality..."
                value={form.description} onChange={e=>set("description",e.target.value)} />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Pricing & Stock</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price (₹) *</label>
                <input type="number" required min="0" step="0.01" className="input-field" placeholder="0.00"
                  value={form.price} onChange={e=>set("price",e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit *</label>
                <select className="input-field" value={form.unit} onChange={e=>set("unit",e.target.value)}>
                  {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity *</label>
                <input type="number" required min="0" step="0.01" className="input-field" placeholder="0"
                  value={form.quantity} onChange={e=>set("quantity",e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min. Order Qty</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="1"
                  value={form.min_order_qty} onChange={e=>set("min_order_qty",e.target.value)} />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Additional Options</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
              <input className="input-field" placeholder="e.g. Coimbatore North Farm" value={form.location} onChange={e=>set("location",e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delivery Option</label>
              <div className="grid grid-cols-3 gap-2">
                {[["both","Both"],["pickup","Pickup Only"],["delivery","Delivery Only"]].map(([val,label])=>(
                  <button key={val} type="button" onClick={()=>set("delivery_option",val)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${form.delivery_option===val?"bg-primary-DEFAULT text-white border-primary-DEFAULT":"bg-white text-gray-600 border-gray-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">🌿 Organic Product</p>
                <p className="text-xs text-gray-400">Mark if grown without chemicals</p>
              </div>
              <button type="button" onClick={()=>set("is_organic",!form.is_organic)}
                className={`w-11 h-6 rounded-full transition-colors ${form.is_organic?"bg-primary-DEFAULT":"bg-gray-300"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${form.is_organic?"translate-x-5":"translate-x-0"}`}/>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">🟢 Available Status</p>
                <p className="text-xs text-gray-400">Make this product live and visible</p>
              </div>
              <button type="button" onClick={()=>set("availability",!form.availability)}
                className={`w-11 h-6 rounded-full transition-colors ${form.availability?"bg-primary-DEFAULT":"bg-gray-300"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${form.availability?"translate-x-5":"translate-x-0"}`}/>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Harvest Date</label>
              <input type="date" className="input-field" value={form.harvest_date} onChange={e=>set("harvest_date",e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
            {loading ? "Adding Product..." : "✅ Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
