// src/services/api.js
import axios from "axios";

import { getApiBaseUrl, getBackendBaseUrl } from "../config";

const baseURL = getApiBaseUrl();
const API = axios.create({ baseURL });

// Helper to resolve image URLs based on platform (web vs Capacitor)
export const getImageUrl = (url) => {
  const PLACEHOLDER = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";
  if (!url) return PLACEHOLDER;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  
  return `${getBackendBaseUrl()}${url}`;
};

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh / logout on 401
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // CRITICAL FIX: Use HashRouter-compatible redirect.
      // "/login" does NOT work in Capacitor Android APK (no server routing).
      // "/#/" takes user to the RoleSelectionPage via HashRouter.
      window.location.hash = "#/";
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login:    (data) => API.post("/auth/login",    data),
  me:       ()     => API.get("/auth/me"),
};

// ── PRODUCTS ──────────────────────────────────────────────────
export const productsAPI = {
  list:       (params) => API.get("/products/",         { params }),
  get:        (id)     => API.get(`/products/${id}`),
  categories: ()       => API.get("/products/categories/all"),
  add:        (data)   => API.post("/products/",        data),
  update:     (id, d)  => API.put(`/products/${id}`,    d),
  delete:     (id)     => API.delete(`/products/${id}`),
  uploadImage:(id, fd) => API.post(`/products/${id}/upload-image`, fd, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
};

// ── ORDERS ────────────────────────────────────────────────────
export const ordersAPI = {
  place:          (data) => API.post("/orders/place",        data),
  myOrders:       ()     => API.get("/orders/my"),
  detail:         (id)   => API.get(`/orders/${id}`),
  updateStatus:   (id,d) => API.put(`/orders/${id}/status`,  d),
  farmerIncoming: ()     => API.get("/orders/farmer/incoming"),
};

// ── CART ──────────────────────────────────────────────────────
export const cartAPI = {
  get:    ()        => API.get("/cart/"),
  add:    (data)    => API.post("/cart/add",       data),
  update: (pid, d)  => API.put(`/cart/${pid}`,     d),
  remove: (pid)     => API.delete(`/cart/${pid}`),
  clear:  ()        => API.delete("/cart/clear"),
};

// ── FARMER ────────────────────────────────────────────────────
export const farmerAPI = {
  dashboard:   ()   => API.get("/farmer/dashboard"),
  myProducts:  ()   => API.get("/farmer/products"),
  publicProfile:(id)=> API.get(`/farmer/profile/${id}`),
};

// ── VENDOR ────────────────────────────────────────────────────
export const vendorAPI = {
  dashboard:      ()    => API.get("/vendor/dashboard"),
  nearbyFarmers:  (p)   => API.get("/vendor/nearby-farmers", { params: p }),
  wishlist:       ()    => API.get("/vendor/wishlist"),
  toggleWishlist: (pid) => API.post(`/vendor/wishlist/${pid}`),
  addReview:      (pid, d) => API.post(`/vendor/review/${pid}`, d),
};

// ── ADMIN ─────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:     ()       => API.get("/admin/dashboard"),
  users:         (params) => API.get("/admin/users",    { params }),
  toggleUser:    (id)     => API.put(`/admin/users/${id}/toggle`),
  products:      ()       => API.get("/admin/products"),
  deleteProduct: (id)     => API.delete(`/admin/products/${id}`),
  orders:        (params) => API.get("/admin/orders",   { params }),
  toggleFeature: (id)     => API.put(`/admin/products/${id}/feature`),
};

// ── NOTIFICATIONS ─────────────────────────────────────────────
export const notifAPI = {
  get:       ()   => API.get("/notifications/"),
  markRead:  (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put("/notifications/read-all"),
};

export default API;
