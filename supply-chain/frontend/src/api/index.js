import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login    = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe    = ()     => API.get('/auth/me');

// Suppliers
export const getSuppliers    = (params) => API.get('/suppliers', { params });
export const getSupplier     = (id)     => API.get(`/suppliers/${id}`);
export const createSupplier  = (data)   => API.post('/suppliers', data);
export const updateSupplier  = (id, d)  => API.put(`/suppliers/${id}`, d);
export const deleteSupplier  = (id)     => API.delete(`/suppliers/${id}`);

// Inventory
export const getProducts     = (params) => API.get('/inventory', { params });
export const getProduct      = (id)     => API.get(`/inventory/${id}`);
export const createProduct   = (data)   => API.post('/inventory', data);
export const updateProduct   = (id, d)  => API.put(`/inventory/${id}`, d);
export const adjustStock     = (id, d)  => API.patch(`/inventory/${id}/adjust`, d);
export const getLowStock     = ()       => API.get('/inventory/low-stock');

// Orders
export const getOrders       = (params) => API.get('/orders', { params });
export const getOrder        = (id)     => API.get(`/orders/${id}`);
export const createOrder     = (data)   => API.post('/orders', data);
export const approveOrder    = (id)     => API.patch(`/orders/${id}/approve`);
export const updateOrderStatus = (id, d) => API.patch(`/orders/${id}/status`, d);
export const deleteOrder     = (id)     => API.delete(`/orders/${id}`);

// Shipments
export const getShipments    = (params) => API.get('/shipments', { params });
export const getShipment     = (id)     => API.get(`/shipments/${id}`);
export const createShipment  = (data)   => API.post('/shipments', data);
export const updateShipmentStatus = (id, d) => API.patch(`/shipments/${id}/status`, d);

// Reports
export const getSummary       = ()       => API.get('/reports/summary');
export const getMonthlyOrders = (year)  => API.get('/reports/monthly-orders', { params: { year } });
export const getSupplierPerf  = ()      => API.get('/reports/supplier-performance');

// Modern feature APIs
export const getForecastData    = () => API.get('/modern/forecast');
export const getTraceabilityData = () => API.get('/modern/traceability');
export const getRiskAlerts      = () => API.get('/modern/risk-alerts');
export const getAutomationRules = () => API.get('/modern/automation');
export const getIoTSensors      = () => API.get('/modern/iot-sensors');
export const getLiveShipments   = () => API.get('/modern/live-shipments');

// Users
export const getUsers         = ()       => API.get('/users');
export const createUser      = (data)   => API.post('/users', data);
export const updateUser      = (id, d)  => API.put(`/users/${id}`, d);
export const deleteUser      = (id)     => API.delete(`/users/${id}`);

export default API;
