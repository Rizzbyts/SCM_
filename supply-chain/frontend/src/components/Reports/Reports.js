import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { getSummary, getMonthlyOrders, getSupplierPerf } from '../../api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [summary, setSummary]     = useState(null);
  const [monthly, setMonthly]     = useState([]);
  const [supplierPerf, setSupPerf] = useState([]);
  const [year, setYear]           = useState(new Date().getFullYear());
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, m, sp] = await Promise.all([getSummary(), getMonthlyOrders(year), getSupplierPerf()]);
        setSummary(s.data.data);
        setMonthly(m.data.data);
        setSupPerf(sp.data.data);
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    load();
  }, [year]);

  const orderCountData = {
    labels: months,
    datasets: [{
      label: 'Orders',
      data: months.map((_, i) => monthly.find(m => m._id.month === i + 1)?.count || 0),
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563eb',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#2563eb',
      pointRadius: 4,
    }],
  };

  const revenueData = {
    labels: months,
    datasets: [{
      label: 'Revenue (₹)',
      data: months.map((_, i) => monthly.find(m => m._id.month === i + 1)?.revenue || 0),
      backgroundColor: 'rgba(16,185,129,0.15)',
      borderColor: '#10b981',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#10b981',
      pointRadius: 4,
    }],
  };

  const supplierChartData = {
    labels: supplierPerf.map(s => s.name),
    datasets: [{
      label: 'Fulfillment rate (%)',
      data: supplierPerf.map(s => Math.round(s.rate)),
      backgroundColor: supplierPerf.map(s => s.rate >= 80 ? '#10b981' : s.rate >= 60 ? '#f59e0b' : '#ef4444'),
      borderRadius: 6,
    }],
  };

  const chartOpts = (label) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${label}: ${typeof ctx.raw === 'number' && label.includes('₹') ? '₹' + ctx.raw.toLocaleString('en-IN') : ctx.raw}` } } },
    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
  });

  const totalRevenue = monthly.reduce((s, m) => s + (m.revenue || 0), 0);
  const totalOrders  = monthly.reduce((s, m) => s + (m.count || 0), 0);
  const avgRate      = supplierPerf.length ? Math.round(supplierPerf.reduce((s, x) => s + x.rate, 0) / supplierPerf.length) : 0;

  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-control" style={{ width: 100 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button className="btn" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card"><div className="kpi-label">Total Revenue ({year})</div><div className="kpi-value" style={{ fontSize: 20 }}>₹{(totalRevenue / 100000).toFixed(1)}L</div></div>
        <div className="kpi-card"><div className="kpi-label">Orders ({year})</div><div className="kpi-value">{totalOrders}</div></div>
        <div className="kpi-card"><div className="kpi-label">Active Suppliers</div><div className="kpi-value">{summary?.totalSuppliers}</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg Supplier Fulfillment</div><div className="kpi-value">{avgRate}%</div></div>
        <div className="kpi-card"><div className="kpi-label">Inventory Value</div><div className="kpi-value" style={{ fontSize: 20 }}>₹{((summary?.inventoryValue || 0) / 100000).toFixed(1)}L</div></div>
        <div className="kpi-card"><div className="kpi-label">Low Stock Items</div><div className="kpi-value kpi-warn">{summary?.lowStockCount}</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Monthly orders — {year}</div>
          <div className="chart-wrap">
            <Line data={orderCountData} options={chartOpts('Orders')} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Monthly revenue — {year}</div>
          <div className="chart-wrap">
            <Line data={revenueData} options={{ ...chartOpts('Revenue ₹'), scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => '₹' + (v / 1000) + 'K' } }, x: { grid: { display: false } } } }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Supplier fulfillment rate (%)</div>
        {supplierPerf.length === 0
          ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>No supplier data yet</div>
          : (
            <div className="chart-wrap" style={{ height: 240 }}>
              <Bar data={supplierChartData} options={{ ...chartOpts('Rate %'), scales: { y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } }, x: { grid: { display: false } } } }} />
            </div>
          )
        }
      </div>

      {/* Supplier performance table */}
      {supplierPerf.length > 0 && (
        <div className="card">
          <div className="card-title">Supplier performance breakdown</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Supplier</th><th>Total Orders</th><th>Delivered</th><th>Fulfillment Rate</th><th>Rating</th></tr></thead>
              <tbody>
                {supplierPerf.map(s => {
                  const rate = Math.round(s.rate);
                  return (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.total}</td>
                      <td>{s.delivered}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500, minWidth: 36 }}>{rate}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${rate >= 80 ? 'badge-green' : rate >= 60 ? 'badge-amber' : 'badge-red'}`}>{rate >= 80 ? 'Good' : rate >= 60 ? 'Average' : 'Poor'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
