// src/pages/auth/RoleSelectionPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiUserPlus } from "react-icons/fi";

const ROLES = [
  {
    role: "customer",
    emoji: "🛍️",
    title: "Customer",
    desc: "Buy fresh products from nearby farmers and vendors",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    bgLight: "#faf5ff",
    canRegister: true,
  },
  {
    role: "vendor",
    emoji: "🏪",
    title: "Vendor",
    desc: "Source fresh produce directly from local farmers",
    gradient: "linear-gradient(135deg, #ea6c0a 0%, #f97316 100%)",
    bgLight: "#fff7ed",
    canRegister: true,
  },
  {
    role: "farmer",
    emoji: "👨‍🌾",
    title: "Farmer",
    desc: "Sell your agricultural products to the marketplace",
    gradient: "linear-gradient(135deg, #1e5228 0%, #2d7a3a 100%)",
    bgLight: "#f0fdf4",
    canRegister: true,
  },
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState(null);

  return (
    <div style={styles.root}>
      <style>{roleStyles}</style>

      {/* Background decoration */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.container} className="role-container">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoBox}>
            <span style={styles.logoText}>LL</span>
          </div>
          <h1 style={styles.title}>Welcome to <span style={{ color: "#f97316" }}>LocalLink</span></h1>
          <p style={styles.subtitle}>Choose how you'd like to continue</p>
        </div>

        {/* Role Cards */}
        <div style={styles.grid} className="role-grid">
          {ROLES.map((opt, i) => (
            <div
              key={opt.role}
              className="role-card"
              style={{
                ...styles.card,
                animationDelay: `${i * 0.1}s`,
                background: hoveredRole === opt.role ? opt.bgLight : "#fff",
              }}
              onMouseEnter={() => setHoveredRole(opt.role)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              {/* Icon circle */}
              <div style={{ ...styles.iconCircle, background: opt.gradient }}>
                <span style={styles.emoji}>{opt.emoji}</span>
              </div>

              <h2 style={styles.cardTitle}>{opt.title}</h2>
              <p style={styles.cardDesc}>{opt.desc}</p>

              <div style={styles.btnGroup}>
                <button
                  onClick={() => navigate(`/login/${opt.role}`)}
                  style={{ ...styles.loginBtn, background: opt.gradient }}
                  className="role-btn"
                >
                  <span>Sign In</span>
                  <FiArrowRight size={14} />
                </button>
                {opt.canRegister && (
                  <button
                    onClick={() => navigate(`/register?role=${opt.role}`)}
                    style={styles.registerBtn}
                    className="role-btn-outline"
                  >
                    <FiUserPlus size={13} />
                    <span>Register</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const roleStyles = `
  .role-container {
    animation: roleFadeIn 0.5s ease-out forwards;
  }
  @keyframes roleFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .role-card {
    animation: roleCardIn 0.5s ease-out forwards;
    opacity: 0;
  }
  @keyframes roleCardIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .role-btn {
    transition: all 0.2s ease !important;
  }
  .role-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
  }
  .role-btn:active { transform: scale(0.97); }
  .role-btn-outline {
    transition: all 0.2s ease !important;
  }
  .role-btn-outline:hover {
    background: #f8fafc !important;
  }
`;

const styles = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #fff7ed 50%, #faf5ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  },
  bgDecor1: {
    position: "absolute",
    width: 400, height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,122,58,0.08) 0%, transparent 70%)",
    top: "-15%", left: "-10%",
  },
  bgDecor2: {
    position: "absolute",
    width: 350, height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
    bottom: "-10%", right: "-5%",
  },
  container: {
    width: "100%",
    maxWidth: 520,
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  logoBox: {
    width: 52, height: 52,
    background: "linear-gradient(135deg, #2d7a3a 0%, #3da84e 100%)",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 8px 24px rgba(45,122,58,0.25)",
  },
  logoText: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: -0.5,
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
    color: "#64748b",
    margin: 0,
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: "22px 16px 18px",
    textAlign: "center",
    border: "1.5px solid #f1f5f9",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    cursor: "default",
  },
  iconCircle: {
    width: 52, height: 52,
    borderRadius: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  emoji: {
    fontSize: 24,
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: "0 0 4px",
  },
  cardDesc: {
    fontSize: 11.5,
    color: "#94a3b8",
    margin: "0 0 14px",
    lineHeight: 1.4,
  },
  btnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  loginBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  registerBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
