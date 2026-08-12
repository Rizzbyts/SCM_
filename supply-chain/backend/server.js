const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { seedData } = require('./seed');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/modern',    require('./routes/modern'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Supply Chain API running', status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// Connect DB and start server (with Socket.IO)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/supply_chain_db';
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found, seeding demo data...');
      await seedData({ connect: false, disconnect: false });
      console.log('Demo data seeded');
    }

    const PORT = process.env.PORT || 5000;

    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET','POST'] } });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
    });

    // Mock shipment positions state (will be emitted to clients periodically)
    let shipmentsState = [
      { id: 'SHIP-1001', vehicle: 'TRUCK-23', lat: 12.9716, lng: 77.5946, status: 'In Transit', eta: '2026-05-28T14:00:00Z', speedKmph: 42 },
      { id: 'SHIP-1002', vehicle: 'VAN-11', lat: 19.0760, lng: 72.8777, status: 'Out for Delivery', eta: '2026-05-27T18:30:00Z', speedKmph: 25 },
    ];

    // Emit initial snapshot once
    setTimeout(() => io.emit('shipments:initial', shipmentsState), 1000);

    // Periodically update and emit shipment location changes
    setInterval(() => {
      shipmentsState = shipmentsState.map(s => {
        // small random walk for demo purposes
        const deltaLat = (Math.random() - 0.5) * 0.02;
        const deltaLng = (Math.random() - 0.5) * 0.02;
        return { ...s, lat: +(s.lat + deltaLat).toFixed(6), lng: +(s.lng + deltaLng).toFixed(6), speedKmph: Math.max(10, Math.round(s.speedKmph + (Math.random() - 0.5) * 6)) };
      });
      io.emit('shipment:update', shipmentsState);
    }, 5000);

    server.listen(PORT, () => console.log(`Server (with Socket.IO) running on port ${PORT}`));
  })
  .catch(err => { console.error('DB connection failed:', err.message); process.exit(1); });
