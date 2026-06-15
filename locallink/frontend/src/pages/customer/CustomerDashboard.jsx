// src/pages/customer/CustomerDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { productsAPI } from "../../services/api";
import {
  FiSearch, FiChevronDown, FiPhone, FiShare2,
  FiHome, FiShoppingBag, FiShoppingCart, FiUser,
  FiClock, FiTag
} from "react-icons/fi";

/* ═══════════════════════════════════════════════════════════════
   ALL CATEGORIES — exactly matching the screenshots
   + LocalLink-exclusive additions at the bottom
   ═══════════════════════════════════════════════════════════════ */
const ALL_CATEGORIES = [
  { id: "fruits-vegetables",   name: "Fruits &\nVegetables",          slug: "fruits-vegetables",   emoji: "🥬" },
  { id: "dairy",               name: "Dairy Products\n& Ice Cream",   slug: "dairy",               emoji: "🥛" },
  { id: "groceries",           name: "Groceries &\nHome Needs",       slug: "groceries",           emoji: "🛒" },
  { id: "flowers",             name: "Flowers",                        slug: "flowers",             emoji: "💐" },
  { id: "stationery",          name: "Stationery",                     slug: "stationery",          emoji: "📝" },
  { id: "pet-care",            name: "Pet Care",                       slug: "pet-care",            emoji: "🐾" },
  { id: "medicines",           name: "Medicines",                      slug: "medicines",           emoji: "💊" },
  { id: "home-care",           name: "Home Care\nService",            slug: "home-care-service",   emoji: "🧹" },
  // ── LocalLink Exclusive ──
  { id: "local-farmers",       name: "Local\nFarmers",                slug: "local-farmers",       emoji: "👨‍🌾", exclusive: true },
  { id: "local-vendors",       name: "Local\nVendors",                slug: "local-vendors",       emoji: "🏪",  exclusive: true },
  { id: "paper-delivery",      name: "Paper\nDelivery",               slug: "paper-delivery",      emoji: "📰",  exclusive: true },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    productsAPI.categories()
      .then(r => setApiCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Merge: use API categories if available, always show ALL_CATEGORIES grid
  const displayCategories = ALL_CATEGORIES;

  const userLocation = user?.district
    ? `${user.village ? user.village + ", " : ""}${user.district}${user.state ? ", " + user.state : ""}`
    : user?.state || "Set your location";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "LocalLink - Shop Local",
        text: "Discover local products on LocalLink! Fresh produce, groceries, and more from nearby farmers & vendors.",
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.origin);
    }
  };

  const isActive = (path) => location.pathname === path;

  const bottomNav = [
    { to: "/customer",  icon: FiHome,         label: "LocalLink" },
    { to: "/orders",    icon: FiShoppingBag,   label: "Orders" },
    { to: "/products",  icon: FiTag,           label: "Offers" },
    { to: "/cart",      icon: FiShoppingCart,   label: "Cart", badge: true },
    { to: "/profile",   icon: FiUser,          label: "Profile" },
  ];

  return (
    <div className="cd-root">
      <style>{customerStyles}</style>

      {/* ══════════ TOP BAR ══════════ */}
      <header className="cd-topbar">
        <div className="cd-topbar__left">
          <div className="cd-topbar__logo">
            <span>LL</span>
          </div>
          <button className="cd-topbar__loc" onClick={() => navigate("/profile")} type="button">
            <span className="cd-topbar__loc-text">{userLocation}</span>
            <FiChevronDown size={15} strokeWidth={2.5} />
          </button>
        </div>
        <button className="cd-topbar__history" onClick={() => navigate("/orders")} type="button" title="Order History">
          <FiClock size={20} strokeWidth={2} />
        </button>
      </header>

      {/* ══════════ SEARCH ══════════ */}
      <div className="cd-search-area">
        <form className="cd-search" onSubmit={handleSearch}>
          <input
            className="cd-search__input"
            type="text"
            placeholder="Search by Item Name / Store Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="cd-search__btn" type="submit" aria-label="Search">
            <FiSearch size={20} strokeWidth={2} />
          </button>
        </form>
      </div>

      {/* ══════════ CATEGORY GRID ══════════ */}
      <section className="cd-cats">
        {loading ? (
          <div className="cd-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="cd-skel" />
            ))}
          </div>
        ) : (
          <>
            <div className="cd-grid">
              {displayCategories.filter(c => !c.exclusive).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="cd-card"
                >
                  <span className="cd-card__emoji">{cat.emoji}</span>
                  <span className="cd-card__name">{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* LocalLink Exclusive Section */}
            <div className="cd-exclusive-header">
              <div className="cd-exclusive-header__line" />
              <span className="cd-exclusive-header__text">🌿 LocalLink Exclusive</span>
              <div className="cd-exclusive-header__line" />
            </div>

            <div className="cd-grid">
              {displayCategories.filter(c => c.exclusive).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="cd-card cd-card--exclusive"
                >
                  <span className="cd-card__emoji">{cat.emoji}</span>
                  <span className="cd-card__name">{cat.name}</span>
                  <span className="cd-card__badge-ll">LocalLink</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ══════════ BOTTOM NAV ══════════ */}
      <nav className="cd-bnav">
        {bottomNav.map(({ to, icon: Icon, label, badge }) => {
          const active = isActive(to);
          return (
            <Link key={to} to={to} className={`cd-bnav__item ${active ? "cd-bnav__item--on" : ""}`}>
              <span className="cd-bnav__icon">
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                {badge && cartCount > 0 && (
                  <span className="cd-bnav__badge">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </span>
              <span className="cd-bnav__label">{label}</span>
              {active && <span className="cd-bnav__dot" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES — scoped via unique class prefix "cd-"
   Matches the Zaaroz screenshot layout pixel-for-pixel:
   peach cards, 3-col grid, rounded search, sticky top bar,
   bottom nav with active dot, call/share buttons
   ═══════════════════════════════════════════════════════════════ */
const customerStyles = `
/* ── Root ── */
.cd-root {
  min-height: 100dvh;
  background: #f5f5f5;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  padding-bottom: 76px;
  -webkit-font-smoothing: antialiased;
}

/* ═══ TOP BAR ═══ */
.cd-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 10px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.cd-topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.cd-topbar__logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #2d7a3a 0%, #43a854 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cd-topbar__logo span {
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: -0.5px;
}
.cd-topbar__loc {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
  min-width: 0;
}
.cd-topbar__loc-text {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
}
.cd-topbar__loc svg { color: #666; flex-shrink: 0; }

.cd-topbar__history {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #f97316;
  background: #fff;
  color: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.cd-topbar__history:hover { background: #fff7ed; }

/* ═══ SEARCH ═══ */
.cd-search-area { padding: 10px 16px 6px; }
.cd-search {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid #ddd;
  border-radius: 10px;
  height: 46px;
  padding: 0 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.cd-search:focus-within {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
}
.cd-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: #333;
  font-family: inherit;
  padding: 0;
}
.cd-search__input::placeholder { color: #999; }
.cd-search__btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 0.15s;
}
.cd-search__btn:hover { color: #f97316; }

/* ═══ CATEGORIES ═══ */
.cd-cats { padding: 6px 12px 0; }
.cd-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* ── Card (peach bg, rounded, shadow) ── */
.cd-card {
  background: #fef3ec;
  border-radius: 14px;
  padding: 14px 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  min-height: 112px;
  border: 1.5px solid transparent;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.cd-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(249,115,22,0.12);
  border-color: #fdba74;
}
.cd-card:active {
  transform: scale(0.97);
  transition: transform 0.1s;
}
.cd-card__emoji {
  font-size: 34px;
  line-height: 1;
  transition: transform 0.2s;
}
.cd-card:hover .cd-card__emoji { transform: scale(1.1); }
.cd-card__name {
  font-size: 11.5px;
  font-weight: 600;
  color: #333;
  text-align: center;
  line-height: 1.35;
  white-space: pre-line;
  max-width: 100%;
}

/* ── Exclusive card variant ── */
.cd-card--exclusive {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border-color: #bbf7d0;
}
.cd-card--exclusive:hover {
  border-color: #4ade80;
  box-shadow: 0 4px 16px rgba(45,122,58,0.12);
}
.cd-card__badge-ll {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #2d7a3a, #43a854);
  color: #fff;
  font-size: 7px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* ── Exclusive section header ── */
.cd-exclusive-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 4px 14px;
}
.cd-exclusive-header__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c6f6d5, transparent);
}
.cd-exclusive-header__text {
  font-size: 12px;
  font-weight: 700;
  color: #2d7a3a;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

/* ── Skeleton loader ── */
.cd-skel {
  border-radius: 14px;
  min-height: 112px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: cdShimmer 1.4s ease infinite;
}
@keyframes cdShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ═══ ACTION BUTTONS ═══ */
.cd-actions {
  display: flex;
  gap: 12px;
  padding: 20px 16px 12px;
}
.cd-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  font-family: inherit;
}
.cd-btn--call {
  background: #fff;
  color: #f97316;
  border: 2px solid #fed7aa;
  box-shadow: 0 1px 6px rgba(249,115,22,0.06);
}
.cd-btn--call:hover {
  background: #fff7ed;
  border-color: #f97316;
  box-shadow: 0 3px 12px rgba(249,115,22,0.14);
}
.cd-btn--share {
  background: #1e293b;
  color: #fff;
  border: 2px solid #1e293b;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}
.cd-btn--share:hover {
  background: #334155;
  box-shadow: 0 3px 12px rgba(0,0,0,0.16);
}

/* ═══ BOTTOM NAV ═══ */
.cd-bnav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  padding: 4px 2px 6px;
  box-shadow: 0 -1px 6px rgba(0,0,0,0.04);
}
.cd-bnav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 4px 6px 2px;
  text-decoration: none;
  min-width: 52px;
  position: relative;
  color: #9ca3af;
  transition: color 0.15s;
}
.cd-bnav__item--on { color: #f97316; }
.cd-bnav__item:not(.cd-bnav__item--on):hover { color: #6b7280; }
.cd-bnav__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cd-bnav__badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background: #f97316;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 1.5px solid #fff;
}
.cd-bnav__label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.cd-bnav__dot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #f97316;
}

/* ═══ ANIMATIONS ═══ */
.cd-cats { animation: cdSlideUp 0.35s ease-out; }
@keyframes cdSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ═══ RESPONSIVE ═══ */
@media (min-width: 480px) {
  .cd-grid { gap: 12px; }
  .cd-card { min-height: 120px; padding: 16px 8px 14px; }
  .cd-card__emoji { font-size: 38px; }
  .cd-card__name { font-size: 12px; }
}
@media (min-width: 640px) {
  .cd-grid { grid-template-columns: repeat(4, 1fr); }
  .cd-card { min-height: 130px; }
  .cd-card__emoji { font-size: 40px; }
  .cd-card__name { font-size: 12.5px; }
}
@media (min-width: 768px) {
  .cd-grid { grid-template-columns: repeat(5, 1fr); gap: 14px; }
  .cd-bnav { display: none; }
  .cd-root { padding-bottom: 16px; }
  .cd-card { min-height: 140px; padding: 20px 10px 16px; }
  .cd-card__emoji { font-size: 44px; }
  .cd-card__name { font-size: 13px; }
}
@media (min-width: 1024px) {
  .cd-grid { grid-template-columns: repeat(6, 1fr); }
}
`;
