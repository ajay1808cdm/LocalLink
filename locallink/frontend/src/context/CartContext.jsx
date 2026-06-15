// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { cartAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartCount, setCartCount] = useState(0);

  const fetchCart = async () => {
    if (!user || user.role !== "vendor") return;
    try {
      const res = await cartAPI.get();
      setCart(res.data);
      setCartCount(res.data.items.length);
    } catch {}
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (product_id, quantity = 1) => {
    await cartAPI.add({ product_id, quantity });
    fetchCart();
  };

  const removeFromCart = async (pid) => {
    await cartAPI.remove(pid);
    fetchCart();
  };

  const updateQty = async (pid, quantity) => {
    if (quantity <= 0) { removeFromCart(pid); return; }
    await cartAPI.update(pid, { quantity });
    fetchCart();
  };

  const clearCart = async () => {
    await cartAPI.clear();
    setCart({ items: [], total: 0 });
    setCartCount(0);
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, updateQty, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
