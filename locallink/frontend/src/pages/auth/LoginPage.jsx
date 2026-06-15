// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

const ROLE_CONFIG = {
  customer: { emoji: "🛍️", title: "Customer", gradient: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#7c3aed" },
  vendor:   { emoji: "🏪", title: "Vendor",   gradient: "linear-gradient(135deg, #ea6c0a, #f97316)", color: "#f97316" },
  farmer:   { emoji: "👨‍🌾", title: "Farmer",   gradient: "linear-gradient(135deg, #1e5228, #2d7a3a)", color: "#2d7a3a" },
  admin:    { emoji: "👑", title: "Admin",    gradient: "linear-gradient(135deg, #1e293b, #334155)", color: "#334155" },
};

const DEMO_ACCOUNTS = [
  { label: "Admin",    email: "admin@locallink.com",    pw: "Admin@123",    emoji: "👑" },
  { label: "Customer", email: "customer@locallink.com", pw: "Customer@123", emoji: "🛍️" },
  { label: "Vendor",   email: "vendor@locallink.com",   pw: "Vendor@123",   emoji: "🏪" },
  { label: "Farmer",   email: "farmer@locallink.com",   pw: "Farmer@123",   emoji: "👨‍🌾" },
];

export default function LoginPage() {
  const { role } = useParams();
  const roleConf = ROLE_CONFIG[role];

  // If role is invalid, redirect back to role selection landing page (/)
  if (!roleConf) {
    return <Navigate to="/" replace />;
  }

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { login, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      if (user.role !== role) {
        logout();
        toast.error(`Invalid login. This page is only for ${roleConf.title} accounts.`);
        return;
      }
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "farmer") navigate("/farmer", { replace: true });
      else if (user.role === "customer") navigate("/customer", { replace: true });
      else if (user.role === "vendor") navigate("/vendor", { replace: true });
      else navigate("/home", { replace: true });
    } catch { /* error handled in AuthContext */ }
  };

  const accentColor = roleConf.color;
  const accentGradient = roleConf.gradient;

  return (
    <div style={styles.root}>
      <style>{loginStyles(accentColor)}</style>

      <div style={styles.container} className="login-animate">
        {/* Back button */}
        <button onClick={() => navigate("/")} style={styles.backBtn} className="login-back-btn">
          <FiArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div style={styles.header}>
          {roleConf ? (
            <div style={{ ...styles.roleIcon, background: accentGradient }}>
              <span style={{ fontSize: 28 }}>{roleConf.emoji}</span>
            </div>
          ) : (
            <div style={{ ...styles.roleIcon, background: "linear-gradient(135deg, #2d7a3a, #3da84e)" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>LL</span>
            </div>
          )}
          <h1 style={styles.title}>
            {roleConf ? `${roleConf.title} Login` : "Sign In"}
          </h1>
          <p style={styles.subtitle}>Enter your credentials to continue</p>
        </div>

        {/* Form card */}
        <div style={styles.card} className="login-card">
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <FiMail size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  style={styles.input}
                  className="login-input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ ...styles.fieldGroup, marginTop: 16 }}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <FiLock size={16} style={styles.inputIcon} />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  style={{ ...styles.input, paddingRight: 44 }}
                  className="login-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, background: accentGradient }}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <div style={styles.spinner} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={styles.demoBox}>
            <p style={styles.demoTitle}>DEMO ACCOUNTS</p>
            <div style={styles.demoList}>
              {DEMO_ACCOUNTS.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setForm({ email: d.email, password: d.pw })}
                  style={styles.demoItem}
                  className="login-demo-btn"
                >
                  <span>{d.emoji}</span>
                  <span style={styles.demoLabel}>{d.label}:</span>
                  <span style={styles.demoEmail}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Register link */}
        {role && role !== "admin" && (
          <p style={styles.registerText}>
            Don't have an account?{" "}
            <Link to={`/register?role=${role}`} style={{ ...styles.registerLink, color: accentColor }}>
              Create one
            </Link>
          </p>
        )}
        {!role && (
          <p style={styles.registerText}>
            Don't have an account?{" "}
            <Link to="/register" style={{ ...styles.registerLink, color: accentColor }}>
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

const loginStyles = (accent) => `
  .login-animate {
    animation: loginFadeIn 0.4s ease-out forwards;
  }
  @keyframes loginFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .login-card {
    box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important;
  }
  .login-input:focus {
    border-color: ${accent} !important;
    box-shadow: 0 0 0 3px ${accent}15 !important;
  }
  .login-back-btn:hover {
    background: rgba(0,0,0,0.04) !important;
  }
  .login-submit-btn {
    transition: all 0.2s ease !important;
  }
  .login-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
  }
  .login-submit-btn:active { transform: scale(0.98); }
  .login-demo-btn {
    transition: all 0.15s ease !important;
  }
  .login-demo-btn:hover {
    background: #fff !important;
    color: ${accent} !important;
  }
`;

const styles = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #fefce8 50%, #fff7ed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 420,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 10,
    marginBottom: 16,
    fontFamily: "inherit",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
  },
  roleIcon: {
    width: 64, height: 64,
    borderRadius: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#1a1a2e",
    margin: "0 0 6px",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    margin: 0,
    fontWeight: 500,
  },
  card: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "28px 24px",
    border: "1px solid #f1f5f9",
  },
  fieldGroup: {},
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    color: "#9ca3af",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 14px 12px 42px",
    fontSize: 14,
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinner: {
    width: 18, height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  demoBox: {
    marginTop: 20,
    padding: 14,
    background: "#f8fafc",
    borderRadius: 14,
    border: "1px solid #f1f5f9",
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: 1,
    margin: "0 0 8px",
  },
  demoList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  demoItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    color: "#475569",
    textAlign: "left",
  },
  demoLabel: {
    fontWeight: 600,
  },
  demoEmail: {
    color: "#94a3b8",
  },
  registerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 20,
    fontWeight: 500,
  },
  registerLink: {
    fontWeight: 600,
    textDecoration: "none",
  },
};
