# LocalLink – Marketplace Connecting Farmers and Local Vendors
## Complete Project Documentation

---

## 1. Project Overview

**LocalLink** is a full-stack web application that creates a direct digital marketplace between farmers and local vendors, eliminating intermediaries and improving the efficiency of local agricultural trade.

| Item | Details |
|------|---------|
| Project Type | Final Year Project – Web Application |
| Frontend | React.js + Tailwind CSS |
| Backend | Python Flask + REST API |
| Database | MySQL 8.0 |
| Auth | JWT (JSON Web Tokens) |
| Theme | Green, White, Orange |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   REACT FRONTEND                    │
│   Vendor UI │ Farmer UI │ Admin UI │ Auth Pages     │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/JSON (Axios)
                        ▼
┌─────────────────────────────────────────────────────┐
│               FLASK REST API BACKEND                │
│  /auth  /products  /orders  /cart  /farmer          │
│  /vendor  /admin  /notifications                    │
│                JWT Middleware                       │
└───────────────────────┬─────────────────────────────┘
                        │ mysql-connector-python
                        ▼
┌─────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                   │
│  users │ farmers │ vendors │ products │ orders      │
│  order_items │ cart │ wishlist │ reviews             │
│  categories │ notifications │ order_status_history  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
locallink/
├── frontend/                    ← React Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       └── ProductCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── SplashScreen.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── shared/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── ProductsPage.jsx
│   │   │   │   ├── ProductDetailPage.jsx
│   │   │   │   ├── CategoriesPage.jsx
│   │   │   │   ├── NotificationsPage.jsx
│   │   │   │   └── ProfilePage.jsx
│   │   │   ├── farmer/
│   │   │   │   ├── FarmerDashboard.jsx
│   │   │   │   ├── ManageProducts.jsx
│   │   │   │   ├── AddProduct.jsx
│   │   │   │   └── FarmerOrders.jsx
│   │   │   ├── vendor/
│   │   │   │   ├── VendorDashboard.jsx
│   │   │   │   ├── CartPage.jsx
│   │   │   │   ├── OrdersPage.jsx
│   │   │   │   ├── OrderTrackPage.jsx
│   │   │   │   ├── WishlistPage.jsx
│   │   │   │   └── FarmerProfile.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       └── AdminOrders.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     ← Flask Application
│   ├── app.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   └── database.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   ├── cart.py
│   │   ├── farmer.py
│   │   ├── vendor.py
│   │   ├── admin.py
│   │   └── notifications.py
│   └── static/
│       └── uploads/             ← Product images
│
└── database/
    └── schema.sql               ← Full DB schema
```

---

## 4. Database Schema (ER Overview)

```
users ──┬──< farmers ──< products ──< order_items >── orders >── vendors
        │                         └──< cart
        │                         └──< wishlist
        │                         └──< reviews
        └──< vendors ──< orders ──< order_status_history
        └──< notifications
categories ──< products
```

**Key Tables:**

| Table | Primary Purpose |
|-------|----------------|
| users | Base authentication (farmer/vendor/admin) |
| farmers | Farmer profile, location, land info |
| vendors | Vendor/shop profile |
| products | Product listings with price, quantity, category |
| categories | Vegetables, Fruits, Grains, Dairy, Spices, etc. |
| orders | Order header with status, total, delivery type |
| order_items | Individual product rows within an order |
| cart | Vendor's shopping cart |
| wishlist | Saved products |
| reviews | Product ratings and comments |
| notifications | Real-time notifications for users |
| order_status_history | Audit trail of status changes |

---

## 5. API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register farmer or vendor |
| POST | /api/auth/login | Login and get JWT token |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products/ | List products (with filters) |
| GET | /api/products/:id | Get product details |
| GET | /api/products/categories/all | All categories |
| POST | /api/products/ | Add product (Farmer) |
| PUT | /api/products/:id | Update product (Farmer) |
| DELETE | /api/products/:id | Delete product (Farmer) |
| POST | /api/products/:id/upload-image | Upload product image |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders/place | Place order (Vendor) |
| GET | /api/orders/my | Vendor's orders |
| GET | /api/orders/:id | Order detail |
| PUT | /api/orders/:id/status | Update order status (Farmer) |
| GET | /api/orders/farmer/incoming | Farmer's incoming orders |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart/ | Get cart |
| POST | /api/cart/add | Add to cart |
| PUT | /api/cart/:pid | Update quantity |
| DELETE | /api/cart/:pid | Remove item |
| DELETE | /api/cart/clear | Clear cart |

### Farmer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/farmer/dashboard | Dashboard stats |
| GET | /api/farmer/products | My products list |
| GET | /api/farmer/profile/:id | Public farmer profile |

### Vendor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/vendor/dashboard | Dashboard stats |
| GET | /api/vendor/nearby-farmers | Nearby farmers |
| GET | /api/vendor/wishlist | Get wishlist |
| POST | /api/vendor/wishlist/:pid | Toggle wishlist |
| POST | /api/vendor/review/:pid | Submit review |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Platform analytics |
| GET | /api/admin/users | All users |
| PUT | /api/admin/users/:id/toggle | Activate/deactivate user |
| GET | /api/admin/products | All products |
| DELETE | /api/admin/products/:id | Delete product |
| GET | /api/admin/orders | All orders |
| PUT | /api/admin/products/:id/feature | Toggle featured |

---

## 6. Authentication Flow

```
User Registration:
  POST /api/auth/register → Create user + farmer/vendor profile → Return JWT

User Login:
  POST /api/auth/login → Verify password → Return JWT + user info

Protected Routes:
  Request → Attach "Authorization: Bearer <token>" → Flask validates JWT → Access granted
```

---

## 7. Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create .env file:
#   MYSQL_HOST=localhost
#   MYSQL_USER=root
#   MYSQL_PASSWORD=yourpassword
#   MYSQL_DB=locallink_db
#   SECRET_KEY=your-secret-key
#   JWT_SECRET_KEY=your-jwt-secret

# Import database schema
mysql -u root -p < ../database/schema.sql

# Run Flask server
python app.py
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

---

## 8. Deployment Steps

### Option A: Local Deployment
1. MySQL running locally
2. Flask on port 5000
3. React dev server on port 3000 (proxy to 5000)

### Option B: Production Deployment
```bash
# Frontend Build
cd frontend && npm run build
# Copy build/ to Flask's static folder or serve via Nginx

# Backend Production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Option C: Free Cloud (Render + PlanetScale)
1. Push backend to GitHub
2. Deploy Flask on **Render.com** (free tier)
3. Host MySQL on **PlanetScale** or **Railway** (free tier)
4. Deploy React on **Vercel** or **Netlify** (free)

---

## 9. Modules Summary

### Module 1: Authentication
- Multi-role registration (Farmer/Vendor/Admin)
- 3-step registration wizard with validation
- JWT access + refresh tokens
- Auto-routing based on role

### Module 2: Farmer Module
- Add/edit/delete products with image upload
- Toggle product availability
- View incoming orders with status update
- Dashboard with revenue analytics

### Module 3: Vendor Module
- Browse products with filters (category, organic, search)
- Add to cart, wishlist management
- Place orders with delivery options
- Real-time order tracking with progress steps

### Module 4: Admin Module
- Platform analytics dashboard (charts via Recharts)
- User management with activate/deactivate
- Product management with featured toggle
- Order monitoring with status filters

---

## 10. Key Features Implemented

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Role-based Access Control | ✅ |
| Product CRUD with Images | ✅ |
| Search & Category Filters | ✅ |
| Shopping Cart | ✅ |
| Order Placement & Tracking | ✅ |
| Real-time Notifications | ✅ |
| Wishlist / Favorites | ✅ |
| Product Reviews & Ratings | ✅ |
| Admin Analytics Dashboard | ✅ |
| Mobile Responsive UI | ✅ |
| Bottom Tab Navigation | ✅ |
| Nearby Farmers Section | ✅ |
| Organic Product Filter | ✅ |
| Delivery/Pickup Option | ✅ |

---

## 11. Security Measures

- Passwords hashed with **bcrypt** (salt rounds: 12)
- JWT tokens with expiry (24h access, 30d refresh)
- Role-based route protection on both frontend and backend
- SQL injection prevention via parameterized queries
- CORS configured for API security
- File upload validation (type + size limits)

---

## 12. Future Enhancements

1. **SMS/WhatsApp Notifications** via Twilio
2. **Google Maps Integration** for location-based search
3. **Payment Gateway** (Razorpay / Stripe)
4. **Real-time Chat** between farmer and vendor
5. **Mobile App** (React Native)
6. **AI Price Suggestion** based on market rates
7. **Multi-language Support** (Tamil, Hindi, Telugu)
8. **Weather API Integration** for crop planning
