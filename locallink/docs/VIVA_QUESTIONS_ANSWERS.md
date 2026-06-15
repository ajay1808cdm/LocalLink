# LocalLink – Viva Questions & Answers
## Final Year Project Examination Preparation

---

## SECTION A: Basic Project Questions

**Q1. What is LocalLink and what problem does it solve?**

**A:** LocalLink is a digital marketplace platform that directly connects farmers with local vendors, eliminating middlemen/intermediaries. It solves the problem of:
- Farmers receiving very low prices due to multiple middlemen
- Vendors paying inflated prices for fresh produce
- Lack of transparent pricing in agricultural trade
- No direct communication channel between farmers and vendors
The platform allows farmers to list products directly, and vendors to purchase at fair prices, improving profit margins for farmers.

---

**Q2. What technology stack did you use and why?**

**A:**
- **React.js (Frontend):** Component-based, fast rendering, large ecosystem, reusable UI components
- **Tailwind CSS:** Utility-first CSS, rapid UI development, mobile responsive out-of-the-box
- **Python Flask (Backend):** Lightweight, easy to build REST APIs, good Python library support
- **MySQL (Database):** Reliable relational database, good for structured agricultural data with relationships between users, products, orders
- **JWT (Authentication):** Stateless, scalable authentication, works well for API-based apps

---

**Q3. What are the three user roles in your system?**

**A:**
1. **Farmer** – Can register, add products, upload images, set price and quantity, manage availability, view and update incoming orders
2. **Vendor** – Can browse products, search farmers, add to cart, place orders, track order status, manage wishlist
3. **Admin** – Can manage all users (activate/deactivate), manage products (feature/delete), view platform analytics, monitor all orders

---

**Q4. How does JWT authentication work in your project?**

**A:** JWT (JSON Web Token) works as follows:
1. User logs in → Backend verifies email and password (bcrypt comparison)
2. Backend generates a signed JWT token containing user ID
3. Token is returned to frontend and stored in `localStorage`
4. For every protected API request, the frontend attaches the token in the `Authorization: Bearer <token>` header
5. Flask's `@jwt_required()` decorator validates the token on each request
6. Token expires after 24 hours; a refresh token (30 days) is used to get a new access token without re-login

---

**Q5. How are passwords stored securely?**

**A:** Passwords are hashed using **bcrypt** with a salt factor of 12 before storing in the database. The process:
- `bcrypt.hashpw(password.encode(), bcrypt.gensalt())` generates a unique hash
- The plain text password is never stored
- During login, `bcrypt.checkpw()` compares the entered password with the stored hash
- Even if the database is compromised, passwords cannot be reversed

---

## SECTION B: Technical / Architecture Questions

**Q6. Explain the database design. How many tables do you have?**

**A:** The database has **12 tables**:
- `users` – Base table for all user types (stores role, email, password)
- `farmers` / `vendors` – Extended profile tables linked to users via `user_id`
- `products` – Product listings with price, quantity, category, images
- `categories` – Product categories (Vegetables, Fruits, Grains, etc.)
- `orders` – Order header (total, status, delivery type)
- `order_items` – Individual items in each order (many-to-many between orders and products)
- `cart` – Temporary cart storage per vendor
- `wishlist` – Saved products per vendor
- `reviews` – Ratings and comments for products
- `notifications` – User notifications for order events
- `order_status_history` – Audit trail for order status changes

---

**Q7. What is the difference between `orders` and `order_items` tables?**

**A:** This is a **one-to-many** relationship:
- `orders` stores the overall order metadata – total amount, vendor, delivery type, payment method, status
- `order_items` stores individual product rows within that order – each row has product_id, farmer_id, quantity, unit_price, subtotal
- One order can have multiple items from different farmers
- This normalization avoids data duplication and allows querying items per farmer efficiently

---

**Q8. How does the order status flow work?**

**A:** Orders follow a defined flow:
```
pending → confirmed → processing → ready → out_for_delivery → delivered
                                                          ↗
                        (cancelled at any non-delivered stage)
```
- Farmer views incoming orders and advances the status
- Each status change is logged in `order_status_history` for tracking
- The vendor sees a visual step-by-step tracker on the order tracking page
- A notification is sent to the vendor on each status change

---

**Q9. How does the cart system work?**

**A:** The cart is stored in the `cart` database table (not localStorage):
- Each row maps a `vendor_id` to a `product_id` with a quantity
- `ON DUPLICATE KEY UPDATE` ensures adding the same product updates quantity instead of creating duplicates
- When an order is placed, cart items are read, order is created, and the cart is cleared
- This server-side cart persists across devices/sessions

---

**Q10. What is React Context and how did you use it?**

**A:** React Context provides a way to share state across components without prop-drilling. I used two contexts:
- **AuthContext** – Stores logged-in user data, handles login/logout/register functions, persists to localStorage
- **CartContext** – Stores cart items and count, provides addToCart/removeFromCart/updateQty functions, fetches cart from API whenever user changes

---

## SECTION C: Feature-Specific Questions

**Q11. How does product search and filtering work?**

**A:** The search and filter system builds a dynamic SQL query based on URL parameters:
- **Search** – Uses MySQL `LIKE` on product name and description
- **Category filter** – Joins with categories table and filters by `slug`
- **Organic filter** – Adds `WHERE p.is_organic = 1`
- **District filter** – Filters by farmer's district
- Results are paginated (12 per page) using `LIMIT` and `OFFSET`
- On the frontend, filter state is managed and passed as query parameters to the API

---

**Q12. How does image upload work?**

**A:**
1. Farmer selects an image on the Add Product page
2. Frontend sends a `multipart/form-data` POST request to `/api/products/:id/upload-image`
3. Flask validates file extension (jpg, png, webp) and size (max 16MB)
4. File is saved to `backend/static/uploads/` with a UUID-based filename to avoid collisions
5. The file URL is stored in the `products.image_url` column
6. Frontend displays images via `/api/static/uploads/filename.jpg`

---

**Q13. What is the notification system?**

**A:** Notifications are stored in the `notifications` table and triggered automatically:
- When a vendor places an order → notification sent to the farmer
- When a farmer updates order status → notification sent to the vendor
- Frontend fetches notifications and shows unread count badge on the bell icon
- Users can mark individual or all notifications as read
- Notification types include: order_placed, order_confirmed, order_delivered, etc.

---

**Q14. How does the Wishlist feature work?**

**A:**
- The `wishlist` table has a unique constraint on `(vendor_id, product_id)` to prevent duplicates
- When a vendor taps the heart icon → `POST /api/vendor/wishlist/:pid` is called
- If already wishlisted → it's deleted (toggle off), else inserted (toggle on)
- The response includes `wishlisted: true/false` so the frontend updates the heart icon state
- Wishlist page fetches all saved products with full product and farmer details via JOIN queries

---

**Q15. How is the Admin Analytics Dashboard built?**

**A:** The admin dashboard uses:
- **Backend** – Aggregation queries (COUNT, SUM, GROUP BY, DATE_FORMAT) to compute stats
- **Recharts library** – For interactive charts (BarChart for monthly orders/revenue, PieChart for category distribution)
- **Stats cards** – Show total farmers, vendors, products, orders, revenue, pending orders
- **Recent Users table** – Shows latest registrations
- All data is fetched in a single `/api/admin/dashboard` call that returns all analytics together

---

## SECTION D: Problem-Solving Questions

**Q16. What challenges did you face and how did you solve them?**

**A:**
1. **Role-based routing** – Solved using React Router v6 with custom `PrivateRoute` and `PublicRoute` wrapper components that check user role
2. **Cart persistence across sessions** – Stored cart in MySQL instead of localStorage so it persists across devices
3. **Image upload** – Used `multipart/form-data` and Werkzeug's `secure_filename` to safely store files
4. **Concurrent orders** – Used database transactions to ensure stock is reduced atomically when an order is placed
5. **Mobile responsiveness** – Used Tailwind's responsive prefixes (sm:, md:, lg:) and a fixed bottom tab bar for mobile

---

**Q17. How did you handle security in the application?**

**A:**
- **bcrypt** for password hashing (irreversible hash)
- **JWT** with expiry for stateless authentication
- **Role-based access** checked on both frontend (route guards) and backend (role validation in routes)
- **Parameterized SQL queries** (via mysql-connector-python) to prevent SQL injection
- **File type validation** on image uploads
- **CORS** configured to only allow requests from trusted origins
- **Input validation** on registration (email format, password length, required fields)

---

**Q18. How would you scale this application for thousands of users?**

**A:**
- Add **Redis caching** for product listings and categories (reduce DB queries)
- Use **connection pooling** (SQLAlchemy) instead of per-request connections
- Add **CDN** (Cloudinary) for image storage instead of local filesystem
- Deploy Flask with **Gunicorn + Nginx** for production with multiple workers
- Use **MySQL read replicas** for heavy read operations
- Add **WebSockets** (Flask-SocketIO) for real-time order updates instead of polling
- Consider **microservices** splitting auth, orders, products into separate services

---

**Q19. What is the difference between REST API and regular web pages?**

**A:**
- **Regular web pages** – Server renders HTML and sends complete page to browser (server-side rendering)
- **REST API** – Server sends only data (JSON), and the React frontend handles rendering (client-side)
- In LocalLink, Flask is a **pure API server** – it only returns JSON responses
- React is the **view layer** that fetches data from the API and renders the UI
- This separation allows the same backend to serve web apps, mobile apps, and third-party integrations

---

**Q20. What are future improvements you would add?**

**A:**
1. **Real-time chat** between farmer and vendor using WebSockets
2. **Google Maps integration** to show nearby farmers on a map
3. **Razorpay payment gateway** for online payments
4. **Push notifications** using Firebase Cloud Messaging
5. **Multi-language support** (Tamil, Hindi, Telugu) for rural users
6. **Mobile app** using React Native (same backend API)
7. **AI-powered price suggestions** based on seasonal market data
8. **SMS alerts** via Twilio for order updates (useful where internet is limited)
9. **Crop planning calendar** integrated with weather API
10. **Bulk order discounts** system for large vendor purchases

---

## SECTION E: Quick One-Liner Answers

| Question | Answer |
|----------|--------|
| What is bcrypt? | Password hashing algorithm with salting for secure storage |
| What is CORS? | Cross-Origin Resource Sharing – allows frontend to call backend API on different port |
| What is a JWT? | JSON Web Token – signed token used for stateless authentication |
| What is a Foreign Key? | A column that references the primary key of another table, enforcing relationships |
| What is pagination? | Splitting large datasets into pages to improve performance |
| What is normalization? | Organizing database tables to reduce redundancy (1NF, 2NF, 3NF) |
| What is a REST API? | Stateless API following HTTP methods (GET/POST/PUT/DELETE) with JSON data exchange |
| What is React Context? | Built-in state management to share data across components without prop drilling |
| What is Tailwind CSS? | Utility-first CSS framework using pre-defined classes for rapid styling |
| What is middleware? | Code that runs between the request and the route handler (e.g., JWT validation) |
