// Run with: node seed.js
// Seeds the database with demo users, suppliers, products, orders

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Supplier = require('./models/Supplier');
const Product  = require('./models/Product');
const Order    = require('./models/Order');

const seedData = async ({ connect = true, disconnect = true } = {}) => {
  if (connect && mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  }

  // Clear existing
  await Promise.all([User.deleteMany(), Supplier.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
  console.log('Cleared existing data');

  // Users
  const users = await User.create([
    { name: 'Admin User',   email: 'admin@example.com',   password: 'admin123',   role: 'admin'   },
    { name: 'Priya Sharma', email: 'manager@example.com', password: 'manager123', role: 'manager' },
    { name: 'Rahul Verma',  email: 'viewer@example.com',  password: 'viewer123',  role: 'viewer'  },
  ]);
  console.log(`Created ${users.length} users`);

  // Suppliers
  const suppliers = await Supplier.create([
    { name: 'Rathi Traders',      contactPerson: 'Suresh Rathi',   email: 'suresh@rathitraders.com',  phone: '9876123456', city: 'Ludhiana',  category: 'Raw Material', paymentTerms: 'Net 30',  status: 'Active',      totalOrders: 42, createdBy: users[0]._id },
    { name: 'Sharma & Co',        contactPerson: 'Amit Sharma',    email: 'amit@sharmaandco.com',     phone: '9814567890', city: 'Amritsar',  category: 'Electrical',  paymentTerms: 'Net 60',  status: 'Active',      totalOrders: 38, createdBy: users[0]._id },
    { name: 'Gupta Supplies',     contactPerson: 'Rakesh Gupta',   email: 'rakesh@guptasupplies.in',  phone: '9730011223', city: 'Delhi',     category: 'Mechanical',  paymentTerms: 'Advance', status: 'Active',      totalOrders: 25, createdBy: users[0]._id },
    { name: 'Mehta Exports',      contactPerson: 'Vijay Mehta',    email: 'vijay@mehtaexports.com',   phone: '9900144556', city: 'Mumbai',    category: 'Raw Material', paymentTerms: 'Net 30',  status: 'Inactive',    totalOrders: 14, createdBy: users[0]._id },
    { name: 'Singh & Sons',       contactPerson: 'Harpal Singh',   email: 'harpal@singhandsons.com',  phone: '9850077889', city: 'Chandigarh',category: 'Safety',      paymentTerms: 'COD',     status: 'Active',      totalOrders: 19, createdBy: users[0]._id },
    { name: 'Punjab Steel Works', contactPerson: 'Gurpreet Singh', email: 'gp@punjabsteel.in',        phone: '9876100112', city: 'Ludhiana',  category: 'Raw Material', paymentTerms: 'Net 30',  status: 'Blacklisted', totalOrders: 7,  createdBy: users[0]._id },
  ]);
  console.log(`Created ${suppliers.length} suppliers`);

  // Products
  const products = await Product.create([
    { sku: 'P001', name: 'Steel Rods 10mm',       category: 'Raw Material', unit: 'kg',  price: 85,   quantity: 12,  reorderLevel: 50,  warehouse: 'WH-A Ludhiana',  supplier: suppliers[0]._id },
    { sku: 'P002', name: 'Copper Wire 2mm',        category: 'Electrical',  unit: 'm',   price: 45,   quantity: 28,  reorderLevel: 40,  warehouse: 'WH-B Amritsar',  supplier: suppliers[1]._id },
    { sku: 'P003', name: 'Industrial Bearings',    category: 'Mechanical',  unit: 'pcs', price: 320,  quantity: 5,   reorderLevel: 30,  warehouse: 'WH-A Ludhiana',  supplier: suppliers[2]._id },
    { sku: 'P004', name: 'Safety Valves',          category: 'Safety',      unit: 'pcs', price: 890,  quantity: 18,  reorderLevel: 25,  warehouse: 'WH-C Delhi',      supplier: suppliers[4]._id },
    { sku: 'P005', name: 'Aluminium Sheets 2mm',   category: 'Raw Material', unit: 'pcs', price: 1200, quantity: 142, reorderLevel: 60,  warehouse: 'WH-A Ludhiana',  supplier: suppliers[0]._id },
    { sku: 'P006', name: 'Circuit Breakers 32A',   category: 'Electrical',  unit: 'pcs', price: 450,  quantity: 87,  reorderLevel: 40,  warehouse: 'WH-B Amritsar',  supplier: suppliers[1]._id },
    { sku: 'P007', name: 'Hydraulic Pipes 1 inch', category: 'Mechanical',  unit: 'm',   price: 650,  quantity: 54,  reorderLevel: 20,  warehouse: 'WH-C Delhi',      supplier: suppliers[2]._id },
    { sku: 'P008', name: 'Safety Helmets',         category: 'Safety',      unit: 'pcs', price: 280,  quantity: 200, reorderLevel: 50,  warehouse: 'WH-A Ludhiana',  supplier: suppliers[4]._id },
  ]);
  console.log(`Created ${products.length} products`);

  // Orders
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const orders = await Order.create([
    { poNumber: 'PO-1001', supplier: suppliers[0]._id, items: [{ product: products[0]._id, quantity: 200, unitPrice: 85 }],  status: 'Pending',   expectedDelivery: daysAgo(-5),  createdBy: users[1]._id, timeline: [{ status: 'Pending', note: 'Order created', date: daysAgo(2) }] },
    { poNumber: 'PO-1002', supplier: suppliers[1]._id, items: [{ product: products[5]._id, quantity: 50,  unitPrice: 450 }], status: 'Shipped',   expectedDelivery: daysAgo(-2),  createdBy: users[1]._id, timeline: [{ status: 'Pending', note: 'Order created', date: daysAgo(8) }, { status: 'Approved', note: 'Approved', date: daysAgo(7) }, { status: 'Shipped', note: 'Dispatched', date: daysAgo(5) }] },
    { poNumber: 'PO-1003', supplier: suppliers[2]._id, items: [{ product: products[6]._id, quantity: 80,  unitPrice: 650 }], status: 'Delivered', expectedDelivery: daysAgo(3),   createdBy: users[0]._id, deliveredAt: daysAgo(4), timeline: [{ status: 'Delivered', note: 'Received at warehouse', date: daysAgo(4) }] },
    { poNumber: 'PO-1004', supplier: suppliers[3]._id, items: [{ product: products[3]._id, quantity: 30,  unitPrice: 890 }], status: 'Cancelled', expectedDelivery: daysAgo(10),  createdBy: users[1]._id },
    { poNumber: 'PO-1005', supplier: suppliers[4]._id, items: [{ product: products[7]._id, quantity: 100, unitPrice: 280 }], status: 'Delivered', expectedDelivery: daysAgo(15),  createdBy: users[0]._id, deliveredAt: daysAgo(16) },
  ]);
  console.log(`Created ${orders.length} orders`);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@example.com   / admin123');
  console.log('  Manager: manager@example.com / manager123');
  console.log('  Viewer:  viewer@example.com  / viewer123');

  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedData().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedData };
