// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: u } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      toast.success(`Welcome back, ${u.full_name.split(" ")[0]}!`);
      return u;
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
      throw err;
    } finally { setLoading(false); }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(formData);
      const { access_token, role } = res.data;
      localStorage.setItem("token", access_token);
      const me = await authAPI.me();
      localStorage.setItem("user", JSON.stringify(me.data));
      setUser(me.data);
      toast.success("Account created successfully!");
      return me.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
      throw err;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
