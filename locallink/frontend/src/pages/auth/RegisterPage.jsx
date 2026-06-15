// src/pages/auth/RegisterPage.jsx
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiUser, FiMail, FiLock, FiPhone, FiArrowLeft, FiCheck } from "react-icons/fi";

const STEP_LABELS = ["Account Type", "Personal Info", "Location"];

const ROLE_OPTIONS = [
  { role: "customer", emoji: "🛍️", title: "Customer", desc: "Buy products from nearby farmers and vendors", color: "#7c3aed" },
  { role: "vendor",   emoji: "🏪", title: "Vendor",   desc: "Buy fresh produce from farmers", color: "#f97316" },
  { role: "farmer",   emoji: "👨‍🌾", title: "Farmer",   desc: "Sell your agricultural products", color: "#2d7a3a" },
];

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const rawRole = searchParams.get("role") || "";
  const initialRole = ["customer", "vendor", "farmer"].includes(rawRole) ? rawRole : "";
  const [step, setStep] = useState(initialRole ? 1 : 0);
  const [form, setForm] = useState({
    role: initialRole || "customer",
    full_name: "", email: "", password: "", phone: "",
    shop_name: "", farm_name: "",
    location: "", village: "", district: "", state: "", pincode: "",
  });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(form);
      if (user.role === "farmer") navigate("/farmer", { replace: true });
      else if (user.role === "customer") navigate("/customer", { replace: true });
      else if (user.role === "vendor") navigate("/vendor", { replace: true });
      else navigate("/home", { replace: true });
    } catch { /* error handled in AuthContext */ }
  };

  const handleBackClick = () => {
    if (initialRole) {
      navigate(`/login/${initialRole}`);
    } else {
      navigate("/");
    }
  };

  const accentColor = ROLE_OPTIONS.find(r => r.role === form.role)?.color || "#2d7a3a";

  return (
    <div style={styles.root}>
      <style>{registerStyles(accentColor)}</style>

      <div style={styles.container} className="reg-animate">
        {/* Back */}
        <button onClick={handleBackClick} style={styles.backBtn} className="reg-back-btn">
          <FiArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoBox}>
            <span style={styles.logoText}>LL</span>
          </div>
          <h1 style={styles.title}>Join LocalLink</h1>
          <p style={styles.subtitle}>Create your account to get started</p>
        </div>

        {/* Step indicator */}
        <div style={styles.steps}>
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div style={styles.stepItem}>
                <div
                  style={{
                    ...styles.stepCircle,
                    background: i < step ? accentColor : i === step ? `${accentColor}20` : "#e5e7eb",
                    color: i < step ? "#fff" : i === step ? accentColor : "#9ca3af",
                    border: i === step ? `2px solid ${accentColor}` : "2px solid transparent",
                  }}
                >
                  {i < step ? <FiCheck size={12} strokeWidth={3} /> : i + 1}
                </div>
                <span style={{
                  ...styles.stepLabel,
                  color: i <= step ? accentColor : "#9ca3af",
                  fontWeight: i <= step ? 600 : 500,
                }}>{label}</span>
              </div>
              {i < 2 && (
                <div style={{
                  ...styles.stepLine,
                  background: i < step ? accentColor : "#e5e7eb",
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.card} className="reg-card">
            {/* Step 0: Role */}
            {step === 0 && (
              <>
                <p style={styles.stepTitle}>I am a...</p>
                <div style={styles.roleGrid}>
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => set("role", opt.role)}
                      style={{
                        ...styles.roleCard,
                        borderColor: form.role === opt.role ? opt.color : "#f1f5f9",
                        background: form.role === opt.role ? `${opt.color}08` : "#fff",
                      }}
                      className="reg-role-btn"
                    >
                      <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                      <span style={styles.roleTitle}>{opt.title}</span>
                      <span style={styles.roleDesc}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ ...styles.nextBtn, background: accentColor }}
                  className="reg-next-btn"
                >
                  Continue →
                </button>
              </>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name *</label>
                  <div style={styles.inputWrap}>
                    <FiUser size={15} style={styles.inputIcon} />
                    <input required style={styles.input} className="reg-input" placeholder="Your full name"
                      value={form.full_name} onChange={e => set("full_name", e.target.value)} />
                  </div>
                </div>

                {form.role !== "customer" && (
                  <div style={styles.field}>
                    <label style={styles.label}>{form.role === "farmer" ? "Farm Name" : "Shop Name"} *</label>
                    <div style={styles.inputWrap}>
                      <FiUser size={15} style={styles.inputIcon} />
                      <input required style={styles.input} className="reg-input"
                        placeholder={form.role === "farmer" ? "Your farm name" : "Your shop name"}
                        value={form.role === "farmer" ? form.farm_name : form.shop_name}
                        onChange={e => set(form.role === "farmer" ? "farm_name" : "shop_name", e.target.value)} />
                    </div>
                  </div>
                )}

                <div style={styles.field}>
                  <label style={styles.label}>Email *</label>
                  <div style={styles.inputWrap}>
                    <FiMail size={15} style={styles.inputIcon} />
                    <input type="email" required style={styles.input} className="reg-input"
                      placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Phone *</label>
                  <div style={styles.inputWrap}>
                    <FiPhone size={15} style={styles.inputIcon} />
                    <input required style={styles.input} className="reg-input"
                      placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Password *</label>
                  <div style={styles.inputWrap}>
                    <FiLock size={15} style={styles.inputIcon} />
                    <input type="password" required minLength={6} style={styles.input} className="reg-input"
                      placeholder="Min 6 characters" value={form.password} onChange={e => set("password", e.target.value)} />
                  </div>
                </div>

                <div style={styles.btnRow}>
                  <button type="button" onClick={() => setStep(0)} style={styles.outlineBtn} className="reg-outline-btn">← Back</button>
                  <button type="button" onClick={() => setStep(2)} style={{ ...styles.nextBtn, background: accentColor }} className="reg-next-btn">Continue →</button>
                </div>
              </>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <>
                {[
                  ["🏘️ Village", "village", false],
                  ["🗺️ District", "district", true],
                  ["📍 State", "state", true],
                  ["📮 Pincode", "pincode", false],
                ].map(([label, key, req]) => (
                  <div key={key} style={styles.field}>
                    <label style={styles.label}>{label} {req ? "*" : ""}</label>
                    <input style={styles.inputSimple} className="reg-input" placeholder={label.split(" ").pop()}
                      value={form[key]} required={req} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}

                <div style={styles.field}>
                  <label style={styles.label}>📍 Full Address</label>
                  <textarea style={{ ...styles.inputSimple, resize: "none", minHeight: 60 }} className="reg-input"
                    placeholder="Street, Landmark..." value={form.location} onChange={e => set("location", e.target.value)} />
                </div>

                <div style={styles.btnRow}>
                  <button type="button" onClick={() => setStep(1)} style={styles.outlineBtn} className="reg-outline-btn">← Back</button>
                  <button type="submit" disabled={loading} style={{ ...styles.nextBtn, background: accentColor }} className="reg-next-btn">
                    {loading ? "Creating..." : "🎉 Create Account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>

        {/* Login link */}
        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link to={initialRole ? `/login/${initialRole}` : "/"} style={{ ...styles.loginLink, color: accentColor }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const registerStyles = (accent) => `
  .reg-animate { animation: regFadeIn 0.4s ease-out forwards; }
  @keyframes regFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reg-card { box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important; }
  .reg-input:focus {
    border-color: ${accent} !important;
    box-shadow: 0 0 0 3px ${accent}15 !important;
    background: #fff !important;
  }
  .reg-next-btn { transition: all 0.2s ease !important; }
  .reg-next-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; }
  .reg-next-btn:active { transform: scale(0.98); }
  .reg-outline-btn { transition: all 0.2s ease !important; }
  .reg-outline-btn:hover { background: #f8fafc !important; }
  .reg-back-btn:hover { background: rgba(0,0,0,0.04) !important; }
  .reg-role-btn { transition: all 0.2s ease !important; cursor: pointer !important; }
  .reg-role-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
`;

const styles = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #fefce8 50%, #fff7ed 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  },
  container: { width: "100%", maxWidth: 440 },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", color: "#64748b", fontSize: 14, fontWeight: 500,
    cursor: "pointer", padding: "8px 12px", borderRadius: 10, marginBottom: 12, fontFamily: "inherit",
  },
  header: { textAlign: "center", marginBottom: 20 },
  logoBox: {
    width: 48, height: 48,
    background: "linear-gradient(135deg, #2d7a3a, #3da84e)",
    borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
    marginBottom: 12, boxShadow: "0 6px 20px rgba(45,122,58,0.25)",
  },
  logoText: { color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: "0 0 4px", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: "#94a3b8", margin: 0, fontWeight: 500 },
  steps: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 20 },
  stepItem: { display: "flex", alignItems: "center", gap: 6 },
  stepCircle: {
    width: 26, height: 26, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  stepLabel: { fontSize: 11, display: "none" }, // hidden on mobile for space
  stepLine: { width: 28, height: 2, borderRadius: 2 },
  card: {
    background: "#fff", borderRadius: 20, padding: "24px 20px", border: "1px solid #f1f5f9",
  },
  stepTitle: { fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 14px" },
  roleGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  roleCard: {
    padding: "16px 8px 12px", borderRadius: 14, border: "2px solid #f1f5f9",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    fontFamily: "inherit", background: "#fff",
  },
  roleTitle: { fontSize: 13, fontWeight: 700, color: "#1e293b" },
  roleDesc: { fontSize: 10, color: "#94a3b8", lineHeight: 1.3, textAlign: "center" },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
  input: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "11px 14px 11px 40px", fontSize: 13, color: "#1e293b",
    background: "#f8fafc", outline: "none", transition: "all 0.2s", fontFamily: "inherit",
  },
  inputSimple: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "11px 14px", fontSize: 13, color: "#1e293b",
    background: "#f8fafc", outline: "none", transition: "all 0.2s", fontFamily: "inherit",
  },
  btnRow: { display: "flex", gap: 10, marginTop: 18 },
  outlineBtn: {
    flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #e2e8f0",
    background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  nextBtn: {
    flex: 1, padding: "11px", borderRadius: 12, border: "none",
    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    marginTop: 0,
  },
  loginText: { textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 18, fontWeight: 500 },
  loginLink: { fontWeight: 600, textDecoration: "none" },
};
