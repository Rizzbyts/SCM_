# Supply Chain Management System
Full-stack web app for industrial training — React + Node.js + MongoDB

---

## Project Structure
```
supply-chain/
├── backend/          Node.js + Express REST API
│   ├── models/       Mongoose schemas (User, Supplier, Product, Order, Shipment)
│   ├── routes/       API routes for all modules
│   ├── middleware/   JWT auth + role-based access
│   ├── server.js     Entry point
│   ├── seed.js       Demo data seeder
│   └── .env.example  Environment variables template
└── frontend/         React.js app
    └── src/
        ├── api/      Axios API client
        ├── context/  Auth context (global user state)
        └── components/
            ├── Auth/       Login page
            ├── Dashboard/  KPIs + Charts
            ├── Suppliers/  Supplier CRUD
            ├── Inventory/  Product & stock management
            ├── Orders/     Purchase order workflow
            ├── Shipments/  Shipment tracking
            ├── Reports/    Analytics + Chart.js
            └── Admin/      Users + Settings
```

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env — add your MongoDB URI and JWT secret

# Frontend
cd ../frontend
npm install
```

### 2. Set up MongoDB
You can use either a local MongoDB instance or MongoDB Atlas.

#### Option A: Local MongoDB
1. Install MongoDB locally.
2. Start the MongoDB server.
3. In `backend/.env`, set:
   ```bash
   MONGO_URI=mongodb://localhost:27017/supply_chain_db
   ```

#### Option B: MongoDB Atlas
1. Go to https://cloud.mongodb.com and create a free cluster.
2. Create a database user and note the username/password.
3. Get the connection string from Atlas.
4. In `backend/.env`, paste the URI as `MONGO_URI`, replacing `<username>`, `<password>`, and database name.

Example Atlas URI for your cluster host:
```bash
MONGO_URI=mongodb+srv://abhay25:<password>@scm.kmp7tff.mongodb.net/supply_chain_db?retryWrites=true&w=majority
```

If you do not set `MONGO_URI`, the backend will automatically use local MongoDB at `mongodb://localhost:27017/supply_chain_db`.

### 2.1 Local MongoDB with Docker
If you want to run only MongoDB locally with Docker, use the included `docker-compose.yml`:
```bash
cd supply-chain
docker-compose up -d
```
Then set `MONGO_URI` to:
```bash
MONGO_URI=mongodb://localhost:27017/supply_chain_db
```

### 2.2 Run the full stack with Docker Compose
This project also includes a full-stack compose setup that launches MongoDB, the backend API, and the frontend app together.

From the `supply-chain` folder:
```bash
docker-compose up --build
```

- Backend will be available at `http://localhost:5000`
- Frontend will be available at `http://localhost:3000`
- MongoDB will be available at `mongodb://localhost:27017`

To stop the stack:
```bash
docker-compose down
```

### 3. Seed demo data
```bash
cd backend
node seed.js
```

### 4. Run the app
```bash
# Terminal 1 — backend
cd backend
npm run dev       # runs on http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm start         # runs on http://localhost:3000
```

### 5. Login
- Admin:   admin@example.com / admin123
- Manager: manager@example.com / manager123
- Viewer:  viewer@example.com / viewer123

---

## API Endpoints

| Method | Endpoint                     | Description          | Auth        |
|--------|------------------------------|----------------------|-------------|
| POST   | /api/auth/login              | Login                | Public      |
| POST   | /api/auth/register           | Register             | Public      |
| GET    | /api/auth/me                 | Get current user     | Any         |
| GET    | /api/suppliers               | List suppliers       | Any         |
| POST   | /api/suppliers               | Add supplier         | Manager+    |
| PUT    | /api/suppliers/:id           | Update supplier      | Manager+    |
| DELETE | /api/suppliers/:id           | Delete supplier      | Admin only  |
| GET    | /api/inventory               | List products        | Any         |
| POST   | /api/inventory               | Add product          | Manager+    |
| PATCH  | /api/inventory/:id/adjust    | Adjust stock qty     | Manager+    |
| GET    | /api/orders                  | List orders          | Any         |
| POST   | /api/orders                  | Create PO            | Manager+    |
| PATCH  | /api/orders/:id/approve      | Approve order        | Manager+    |
| PATCH  | /api/orders/:id/status       | Update order status  | Manager+    |
| GET    | /api/shipments               | List shipments       | Any         |
| POST   | /api/shipments               | Create shipment      | Manager+    |
| PATCH  | /api/shipments/:id/status    | Update ship status   | Manager+    |
| GET    | /api/reports/summary         | Dashboard KPIs       | Any         |
| GET    | /api/reports/monthly-orders  | Monthly chart data   | Any         |
| GET    | /api/reports/supplier-perf   | Supplier performance | Any         |
| GET    | /api/modern/forecast         | AI demand forecast    | Any         |
| GET    | /api/modern/traceability     | Product traceability  | Any         |
| GET    | /api/modern/risk-alerts      | Predictive risk alerts| Any         |
| GET    | /api/modern/automation       | Workflow automation   | Any         |
| GET    | /api/modern/iot-sensors     | IoT sensor telemetry  | Any         |
| GET    | /api/modern/live-shipments  | Live shipment positions| Any        |
| GET    | /api/users                   | List users           | Admin only  |
| POST   | /api/users                   | Create user          | Admin only  |

---

## Deployment

### Backend → Render.com (Free)
1. Push backend folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables:
   - MONGO_URI = your MongoDB Atlas URI
   - JWT_SECRET = any long random string
   - CLIENT_URL = your Vercel frontend URL
   - NODE_ENV = production

### Frontend → Vercel (Free)
1. Push frontend folder to GitHub
2. Go to https://vercel.com → New Project
3. Import your repo
4. Add environment variable:
   - REACT_APP_API_URL = https://your-app.onrender.com/api
5. Click Deploy

---

## Features
- Real-time inventory tracking with live stock updates, low-stock alerts, expiry and batch/serial support, and automatic stock adjustment
- Multi-warehouse inventory and product location support for scalable operations
- Complete order management lifecycle: create/manage orders, status tracking, returns/refunds, invoice generation, and automated order assignment
- Supplier/vendor management with supplier database, purchase orders, vendor performance analytics, ratings/reviews, and contract tracking
- Logistics and shipment tracking: schedule shipments, update delivery status, manage vehicles, and view ETA prediction
- Warehouse management readiness with rack/bin allocation, picking & packing workflows, barcode/QR scanning support, and worker task assignment
- Analytics dashboard including sales trends, inventory turnover, demand forecasting readiness, delayed shipment visibility, and revenue analytics
- Role-based dashboards and access control for Admin / Manager / Viewer
- JWT authentication with protected API routes and role-based authorization
- AI/ML-ready architecture for future demand forecasting, smart reorder recommendations, risk alerts, and chatbot assistant integration
- Blockchain/traceability-ready product journey tracking via QR code scan
- IoT-friendly structure for future sensor monitoring (temperature, humidity, cold chain) and real-time warehouse telemetry
- Sustainability and ESG reporting readiness, including carbon emission tracking and fuel consumption analytics
- Workflow automation potential: auto invoice generation, auto purchase order creation, auto email/SMS alerts
- Mobile-responsive interface and user-friendly dashboard experience
- New dashboard pages for Forecasting, Traceability, Risk Alerts, and Automation

## Modern Enhancements & Future Scope
- AI Demand Forecasting for demand planning and overstock prevention
- Smart Reorder Suggestions to estimate replenishment quantities automatically
- AI Chatbot Assistant for natural-language queries like “show delayed shipments” or “best performing supplier”
- Blockchain-based product traceability for immutable supply chain history
- Live shipment map tracking with route optimization and ETA predictions
- Supplier risk prediction and price comparison analytics
- Carbon footprint dashboard and green supply chain scoring
- Mobile app / scanning integration for delivery updates and warehouse scan workflows
- Includes new modern feature pages for AI forecasting, blockchain traceability, risk alerts, and workflow automation

---

## Tech Stack
| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Chart.js |
| Styling    | Plain CSS (no framework dependency) |
| API calls  | Axios with JWT interceptors         |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB with Mongoose ODM           |
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| Deploy BE  | Render.com                          |
| Deploy FE  | Vercel                              |
