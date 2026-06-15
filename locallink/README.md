# 🌾 LocalLink – Farmer & Vendor Marketplace

> **Final Year Project** | Connecting farmers directly with local vendors

---

## 🚀 Quick Start

### 1. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE locallink_db;"
mysql -u root -p locallink_db < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DB=locallink_db
SECRET_KEY=locallink-secret-2024
JWT_SECRET_KEY=jwt-locallink-secret
EOF

python app.py
# → Running on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
# → Running on http://localhost:3000
```

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@locallink.in | Admin@123 |
| Farmer | farmer@demo.com | 123456 |
| Vendor | vendor@demo.com | 123456 |

*(Create farmer/vendor via /register for full functionality)*

---

## 📁 Project Structure
```
locallink/
├── frontend/        React.js app
├── backend/         Flask REST API
├── database/        MySQL schema
└── docs/            Documentation, Viva Q&A, PPT content
```

---

## 🎯 Features
- ✅ Multi-role auth (Farmer / Vendor / Admin)
- ✅ Product listing with image upload
- ✅ Search, filter, categories
- ✅ Shopping cart & order placement
- ✅ Real-time order status tracking
- ✅ In-app notifications
- ✅ Wishlist & product reviews
- ✅ Admin analytics dashboard
- ✅ Mobile-responsive UI

---

## 🌐 API Base URL
```
http://localhost:5000/api
```

---

Built with ❤️ for local agriculture 🇮🇳
