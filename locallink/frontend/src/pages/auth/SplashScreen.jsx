// src/pages/auth/SplashScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div style={styles.root}>
      <style>{splashStyles}</style>

      {/* Animated background circles */}
      <div style={styles.bgCircle1} className="splash-circle" />
      <div style={styles.bgCircle2} className="splash-circle" />
      <div style={styles.bgCircle3} className="splash-circle" />

      {/* Center content */}
      <div style={styles.center} className="splash-content">
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <span style={styles.logoText}>LL</span>
          </div>
          <div style={styles.logoPulse} className="splash-pulse" />
        </div>

        {/* App Name */}
        <h1 style={styles.title}>
          Local<span style={styles.titleAccent}>Link</span>
        </h1>
        <p style={styles.tagline}>Shop Local, Support Local</p>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${progress}%`,
            }}
          />
        </div>

        {/* Footer */}
        <p style={styles.footer}>Connecting Farmers · Vendors · Customers</p>
      </div>
    </div>
  );
}

const splashStyles = `
  .splash-circle {
    position: absolute;
    border-radius: 50%;
    animation: splashFloat 4s ease-in-out infinite;
  }
  .splash-circle:nth-child(2) { animation-delay: 1s; }
  .splash-circle:nth-child(3) { animation-delay: 2s; }
  @keyframes splashFloat {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
    50% { transform: translateY(-20px) scale(1.05); opacity: 0.25; }
  }
  .splash-content {
    animation: splashFadeIn 0.8s ease-out forwards;
  }
  @keyframes splashFadeIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .splash-pulse {
    animation: splashPulseAnim 2s ease-in-out infinite;
  }
  @keyframes splashPulseAnim {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.4); opacity: 0; }
  }
`;

const styles = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  },
  bgCircle1: {
    width: 300, height: 300,
    background: "radial-gradient(circle, rgba(45,122,58,0.3) 0%, transparent 70%)",
    top: "-10%", left: "-15%",
  },
  bgCircle2: {
    width: 250, height: 250,
    background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)",
    bottom: "-5%", right: "-10%",
  },
  bgCircle3: {
    width: 180, height: 180,
    background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)",
    top: "30%", right: "5%",
  },
  center: {
    textAlign: "center",
    zIndex: 10,
    padding: "0 32px",
  },
  logoContainer: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80, height: 80,
    background: "linear-gradient(135deg, #2d7a3a 0%, #3da84e 100%)",
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 40px rgba(45,122,58,0.4)",
    position: "relative",
    zIndex: 2,
  },
  logoText: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: -1,
  },
  logoPulse: {
    position: "absolute",
    width: 80, height: 80,
    borderRadius: 22,
    border: "2px solid rgba(45,122,58,0.5)",
    zIndex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: "#ffffff",
    margin: "0 0 8px",
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: "#f97316",
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    margin: "0 0 32px",
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: 160,
    height: 4,
    borderRadius: 4,
    background: "rgba(255,255,255,0.1)",
    margin: "0 auto 40px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
    background: "linear-gradient(90deg, #2d7a3a, #3da84e, #f97316)",
    transition: "width 0.1s ease",
  },
  footer: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontWeight: 500,
    letterSpacing: 0.5,
    margin: 0,
  },
};
