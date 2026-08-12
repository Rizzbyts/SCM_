import React, { useState, useEffect, useCallback } from 'react';
import { getOrders, createOrder, approveOrder, updateOrderStatus, deleteOrder, getSuppliers, getProducts } from '../../api';
import { StatusBadge } from '../Dashboard/Dashboard';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Orders() {
  const { isManager } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [modal, setModal]         = useState(false);
  const [detailModal, setDetail]  = useState(null);
  const [form, setForm]           = useState({ supplier: '', items: [{ product: '', quantity: 1, unitPrice: '' }], expectedDelivery: '', notes: '' });
  const [saving, setSaving]       = useState(false);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ status: filterStatus, search, page, limit: LIMIT });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filterStatus, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getSuppliers({ limit: 100 }).then(r => setSuppliers(r.data.data)).catch(() => {});
    getProducts({ limit: 100 }).then(r => setProducts(r.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleItemChange = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'product') {
        const prod = products.find(p => p._id === val);
        if (prod) items[i].unitPrice = prod.price;
      }
      return { ...f, items };
    });
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product: '', quantity: 1, unitPrice: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const totalAmount = form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createOrder({ ...form, items: form.items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })) });
      toast.success('Purchase order created');
      setModal(false);
      setForm({ supplier: '', items: [{ product: '', quantity: 1, unitPrice: '' }], expectedDelivery: '', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create order'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveOrder(id); toast.success('Order approved'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
  };

  const handleStatus = async (id, status) => {
    try { await updateOrderStatus(id, { status }); toast.success(`Order marked as ${status}`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await deleteOrder(id); toast.success('Order deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Orders <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>({total})</span></h1>
        {isManager && <button className="btn btn-primary" onClick={() => setModal(true)}>+ Create PO</button>}
      </div>

      <div className="search-row">
        <input className="form-control" placeholder="Search by PO number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option>Pending</option><option>Approved</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Total</th><th>Expected Delivery</th><th>Status</th><th>Created By</th>{isManager && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading...</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No orders found</td></tr>}
              {orders.map(o => (
                <tr key={o._id}>
                  <td>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 13 }} onClick={() => setDetail(o)}>
                      {o.poNumber}
                    </button>
                  </td>
                  <td>{o.supplier?.name || '—'}</td>
                  <td>{o.items?.length} item(s)</td>
                  <td><strong>₹{o.totalAmount?.toLocaleString('en-IN') || '0'}</strong></td>
                  <td>{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString('en-IN') : '—'}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.createdBy?.name || '—'}</td>
                  {isManager && (
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {o.status === 'Pending' && <button className="btn btn-sm btn-success" onClick={() => handleApprove(o._id)}>Approve</button>}
                      {o.status === 'Approved' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o._id, 'Shipped')}>Ship</button>}
                      {o.status === 'Shipped' && <button className="btn btn-sm btn-success" onClick={() => handleStatus(o._id, 'Delivered')}>Deliver</button>}
                      {['Pending'].includes(o.status) && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o._id)}>Del</button>}
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

      {/* Create PO Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier *</label>
                  <select className="form-control" name="supplier" value={form.supplier} onChange={handleChange} required>
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected delivery</label>
                  <input className="form-control" type="date" name="expectedDelivery" value={form.expectedDelivery} onChange={handleChange} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>Order items *</label>
                {form.items.map((it, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px auto', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                    <select className="form-control" value={it.product} onChange={e => handleItemChange(i, 'product', e.target.value)} required>
                      <option value="">Select product...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <input className="form-control" type="number" min="1" placeholder="Qty" value={it.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} required />
                    <input className="form-control" type="number" min="0" placeholder="Unit ₹" value={it.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', e.target.value)} required />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)} disabled={form.items.length === 1}>×</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm" onClick={addItem}>+ Add item</button>
              </div>

              {totalAmount > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
                  <strong>Total: ₹{totalAmount.toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <input className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes..." />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Order Detail — {detailModal.poNumber}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Supplier</div><div style={{ fontWeight: 500 }}>{detailModal.supplier?.name}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Status</div><StatusBadge status={detailModal.status} /></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Total Amount</div><div style={{ fontWeight: 600 }}>₹{detailModal.totalAmount?.toLocaleString('en-IN')}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Expected Delivery</div><div>{detailModal.expectedDelivery ? new Date(detailModal.expectedDelivery).toLocaleDateString('en-IN') : '—'}</div></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Items ordered</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '6px 8px', textAlign: 'left' }}>Product</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Qty</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Total</th></tr></thead>
                  <tbody>
                    {detailModal.items?.map((it, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px' }}>{it.product?.name || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{it.quantity}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{it.unitPrice?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{it.total?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detailModal.timeline?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Order timeline</div>
                  <ul className="timeline">
                    {detailModal.timeline.map((t, i) => (
                      <li key={i} className="tl-item">
                        <div className="tl-dot tl-dot-done" />
                        <div className="tl-body">
                          <div className="tl-title">{t.status} — {t.note}</div>
                          <div className="tl-date">{new Date(t.date).toLocaleString('en-IN')}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
