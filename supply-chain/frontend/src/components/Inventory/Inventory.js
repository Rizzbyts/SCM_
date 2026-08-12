import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, adjustStock, getSuppliers } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { sku: '', name: '', description: '', category: 'Raw Material', unit: 'pcs', price: '', quantity: '', reorderLevel: 50, warehouse: 'WH-A Ludhiana', supplier: '' };

function StockBadge({ qty, reorder }) {
  const pct = (qty / reorder) * 100;
  if (pct < 40) return <span className="badge badge-red">Critical</span>;
  if (pct < 80) return <span className="badge badge-amber">Low</span>;
  return <span className="badge badge-green">OK</span>;
}

function StockBar({ qty, reorder }) {
  const pct = Math.min(Math.round((qty / reorder) * 100), 100);
  const color = pct < 40 ? '#dc2626' : pct < 80 ? '#d97706' : '#16a34a';
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{qty} / {reorder}</div>
      <div className="stock-bar"><div className="stock-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

export default function Inventory() {
  const { isManager } = useAuth();
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage]           = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal]         = useState(false);
  const [adjustModal, setAdjustModal] = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [adjForm, setAdjForm]     = useState({ adjustment: '', reason: '' });
  const [saving, setSaving]       = useState(false);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ search, category: filterCat, page, limit: LIMIT });
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search, filterCat, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getSuppliers({ limit: 100 }).then(r => setSuppliers(r.data.data)).catch(() => {});
  }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, description: p.description || '', category: p.category, unit: p.unit, price: p.price, quantity: p.quantity, reorderLevel: p.reorderLevel, warehouse: p.warehouse, supplier: p.supplier?._id || '' });
    setModal(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel) };
      if (editing) { await updateProduct(editing._id, payload); toast.success('Product updated'); }
      else         { await createProduct(payload); toast.success('Product added'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await adjustStock(adjustModal._id, { adjustment: Number(adjForm.adjustment), reason: adjForm.reason });
      toast.success('Stock adjusted');
      setAdjustModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Adjust failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1>Inventory <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>({total} products)</span></h1>
        {isManager && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>

      <div className="search-row">
        <input className="form-control" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-control" style={{ width: 180 }} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          <option>Raw Material</option><option>Electrical</option><option>Mechanical</option><option>Safety</option><option>Other</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Warehouse</th><th>Supplier</th>{isManager && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading...</td></tr>}
              {!loading && products.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No products found</td></tr>}
              {products.map(p => (
                <tr key={p._id}>
                  <td><code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 5px', borderRadius: 4 }}>{p.sku}</code></td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.description}</div>}
                  </td>
                  <td>{p.category}</td>
                  <td>₹{Number(p.price).toLocaleString('en-IN')}<span style={{ fontSize: 11, color: '#94a3b8' }}>/{p.unit}</span></td>
                  <td>
                    <StockBadge qty={p.quantity} reorder={p.reorderLevel} />
                    <StockBar qty={p.quantity} reorder={p.reorderLevel} />
                  </td>
                  <td>{p.warehouse}</td>
                  <td>{p.supplier?.name || '—'}</td>
                  {isManager && (
                    <td>
                      <button className="btn btn-sm" style={{ marginRight: 4 }} onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-success" onClick={() => { setAdjustModal(p); setAdjForm({ adjustment: '', reason: '' }); }}>±Adj</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '4px 8px', fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'Add Product to Inventory'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU *</label>
                  <input className="form-control" name="sku" value={form.sku} onChange={handleChange} required placeholder="P001" disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                    <option>Raw Material</option><option>Electrical</option><option>Mechanical</option><option>Safety</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Product name *</label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Steel Rods 10mm" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit price (₹) *</label>
                  <input className="form-control" type="number" name="price" value={form.price} onChange={handleChange} required min="0" />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select className="form-control" name="unit" value={form.unit} onChange={handleChange}>
                    <option>pcs</option><option>kg</option><option>m</option><option>litre</option><option>box</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial quantity *</label>
                  <input className="form-control" type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="0" />
                </div>
                <div className="form-group">
                  <label>Reorder level *</label>
                  <input className="form-control" type="number" name="reorderLevel" value={form.reorderLevel} onChange={handleChange} required min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Warehouse</label>
                  <select className="form-control" name="warehouse" value={form.warehouse} onChange={handleChange}>
                    <option>WH-A Ludhiana</option><option>WH-B Amritsar</option><option>WH-C Delhi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select className="form-control" name="supplier" value={form.supplier} onChange={handleChange}>
                    <option value="">None</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAdjustModal(null)}>
          <div className="modal-box" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3>Adjust Stock — {adjustModal.name}</h3>
              <button className="modal-close" onClick={() => setAdjustModal(null)}>×</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Current stock: <strong>{adjustModal.quantity} {adjustModal.unit}</strong></p>
            <form onSubmit={handleAdjust}>
              <div className="form-group">
                <label>Adjustment (use negative to decrease)</label>
                <input className="form-control" type="number" value={adjForm.adjustment} onChange={e => setAdjForm(f => ({ ...f, adjustment: e.target.value }))} required placeholder="e.g. +50 or -10" />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input className="form-control" value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Stock received, Damage write-off" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setAdjustModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
