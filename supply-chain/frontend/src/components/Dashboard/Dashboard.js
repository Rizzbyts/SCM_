import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { getSummary, getMonthlyOrders, getOrders, getLowStock, getForecastData } from '../../api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [summary, setSummary]   = useState(null);
  const [monthly, setMonthly]   = useState([]);
  const [orders,  setOrders]    = useState([]);
  const [alerts,  setAlerts]    = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, o, a, f] = await Promise.all([
          getSummary(), getMonthlyOrders(new Date().getFullYear()),
          getOrders({ limit: 5 }), getLowStock(), getForecastData(),
        ]);
        setSummary(s.data.data);
        setMonthly(m.data.data);
        setOrders(o.data.data);
        setAlerts(a.data.data);
        setForecast(f.data.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const barData = {
    labels: months,
    datasets: [{
      label: 'Orders',
      data: months.map((_, i) => {
        const found = monthly.find(m => m._id.month === i + 1);
        return found ? found.count : 0;
      }),
      backgroundColor: '#2563eb',
      borderRadius: 6,
    }],
  };

  const doughnutData = {
    labels: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [{
      data: [40, 16, 24, 20],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0,
    }],
  };

  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n?.toLocaleString('en-IN') || 0}`;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Total Suppliers</div><div className="kpi-value">{summary?.totalSuppliers ?? '—'}</div><div className="kpi-sub kpi-up">Active suppliers</div></div>
        <div className="kpi-card"><div className="kpi-label">Total Orders</div><div className="kpi-value">{summary?.totalOrders ?? '—'}</div><div className="kpi-sub kpi-up">All time</div></div>
        <div className="kpi-card"><div className="kpi-label">Inventory Value</div><div className="kpi-value">{fmt(summary?.inventoryValue)}</div><div className="kpi-sub kpi-warn">{summary?.lowStockCount} items low</div></div>
        <div className="kpi-card"><div className="kpi-label">Pending Shipments</div><div className="kpi-value">{summary?.pendingShipments ?? '—'}</div><div className="kpi-sub kpi-down">Needs attention</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Monthly orders — {new Date().getFullYear()}</div>
          <div className="chart-wrap">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Order status breakdown</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } } }, cutout: '65%' }} />
          </div>
        </div>
      </div>

      {forecast && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card card-highlight">
            <div className="card-title">AI Demand Forecast</div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="kpi-card" style={{ padding: '18px 20px', minHeight: 110 }}>
                <div className="kpi-label">Forecast product</div>
                <div className="kpi-value">{forecast.demandForecast.product}</div>
                <div className="kpi-sub">Next 30 days: {forecast.demandForecast.next30Days} units</div>
              </div>
              <div className="kpi-card" style={{ padding: '18px 20px', minHeight: 110 }}>
                <div className="kpi-label">Recommended reorder</div>
                <div className="kpi-value">{forecast.demandForecast.recommendedReorder} units</div>
                <div className="kpi-sub">Stock runs out in {forecast.demandForecast.stockDaysLeft} days</div>
              </div>
              <button className="btn btn-primary" style={{ width: 180, marginTop: 8 }} onClick={() => navigate('/forecasting')}>View Forecasting</button>
            </div>
          </div>

          <div className="card card-highlight">
            <div className="card-title">Risk & Automation Insights</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div className="kpi-label">Top risk</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>{forecast.topRisks[0]?.title || 'No risks'}</div>
                <div className="kpi-sub">Severity: {forecast.topRisks[0]?.risk || 'N/A'}</div>
              </div>
              <div>
                <div className="kpi-label">Recommended automation</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>{forecast.automationSuggestions[0]?.message || 'No suggestions yet'}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/risk')}>View Risk Alerts</button>
                <button className="btn btn-secondary" onClick={() => navigate('/automation')}>View Automation</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Recent orders</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No orders yet</td></tr>}
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><strong>{o.poNumber}</strong></td>
                    <td>{o.supplier?.name || '—'}</td>
                    <td>₹{o.totalAmount?.toLocaleString('en-IN') || '0'}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Low stock alerts</div>
          {alerts.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>All stock levels OK</div>}
          {alerts.slice(0, 5).map(p => {
            const pct = Math.round((p.quantity / p.reorderLevel) * 100);
            const crit = pct < 40;
            return (
              <div key={p._id} className={`alert-item ${crit ? 'alert-red' : 'alert-amber'}`}>
                <div className="alert-dot" style={{ background: crit ? '#dc2626' : '#d97706' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: '#64748b', marginTop: 2 }}>Only {p.quantity} units — reorder at {p.reorderLevel}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = { Pending: 'badge-amber', Approved: 'badge-blue', Shipped: 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red', Active: 'badge-green', Inactive: 'badge-amber', Blacklisted: 'badge-red', 'In Transit': 'badge-blue', 'Out for Delivery': 'badge-purple', Delayed: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}
