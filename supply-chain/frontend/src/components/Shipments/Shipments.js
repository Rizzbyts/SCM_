import React, { useState, useEffect, useCallback } from 'react';
import { getShipments, createShipment, updateShipmentStatus, getOrders } from '../../api';
import { StatusBadge } from '../Dashboard/Dashboard';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Shipments() {
  const { isManager } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [availOrders, setAvailOrders] = useState([]);
  const [modal, setModal]         = useState(false);
  const [detailModal, setDetail]  = useState(null);
  const [form, setForm]           = useState({ order: '', carrier: 'Delhivery', trackingNo: '', origin: '', destination: '', eta: '' });
  const [saving, setSaving]       = useState(false);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShipments({ status: filterStatus, page, limit: LIMIT });
      setShipments(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load shipments'); }
    finally { setLoading(false); }
  }, [filterStatus, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getOrders({ status: 'Approved', limit: 100 }).then(r => setAvailOrders(r.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createShipment(form);
      toast.success('Shipment created');
      setModal(false);
      setForm({ order: '', carrier: 'Delhivery', trackingNo: '', origin: '', destination: '', eta: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create shipment'); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateShipmentStatus(id, { status, note: `Status updated to ${status}` });
      toast.success(`Shipment marked as ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1>Shipments <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>({total})</span></h1>
        {isManager && <button className="btn btn-primary" onClick={() => setModal(true)}>+ New Shipment</button>}
      </div>

      <div className="search-row">
        <select className="form-control" style={{ width: 200 }} value={filterStatus} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option>Processing</option><option>In Transit</option><option>Out for Delivery</option><option>Delivered</option><option>Delayed</option><option>Returned</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Shipment ID</th><th>PO Ref</th><th>Carrier</th><th>Tracking No.</th><th>ETA</th><th>Status</th>{isManager && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading...</td></tr>}
              {!loading && shipments.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No shipments found</td></tr>}
              {shipments.map(s => (
                <tr key={s._id}>
                  <td>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 13 }} onClick={() => setDetail(s)}>
                      {s.shipmentId}
                    </button>
                  </td>
                  <td>{s.order?.poNumber || '—'}</td>
                  <td>{s.carrier}</td>
                  <td><code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 5px', borderRadius: 4 }}>{s.trackingNo || '—'}</code></td>
                  <td>{s.eta ? new Date(s.eta).toLocaleDateString('en-IN') : '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  {isManager && (
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.status === 'Processing' && <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(s._id, 'In Transit')}>Transit</button>}
                      {s.status === 'In Transit' && <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(s._id, 'Out for Delivery')}>Out</button>}
                      {s.status === 'Out for Delivery' && <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(s._id, 'Delivered')}>Delivered</button>}
                      {['Processing', 'In Transit'].includes(s.status) && <button className="btn btn-sm btn-danger" onClick={() => handleUpdateStatus(s._id, 'Delayed')}>Delay</button>}
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

      {/* Create Shipment Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create New Shipment</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Purchase Order (Approved only) *</label>
                <select className="form-control" name="order" value={form.order} onChange={handleChange} required>
                  <option value="">Select approved PO...</option>
                  {availOrders.map(o => <option key={o._id} value={o._id}>{o.poNumber} — {o.supplier?.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Carrier *</label>
                  <select className="form-control" name="carrier" value={form.carrier} onChange={handleChange}>
                    <option>Delhivery</option><option>Blue Dart</option><option>DTDC</option><option>Ecom Express</option><option>FedEx</option><option>DHL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tracking number</label>
                  <input className="form-control" name="trackingNo" value={form.trackingNo} onChange={handleChange} placeholder="e.g. DL8829301" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Origin</label>
                  <input className="form-control" name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Delhi" />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input className="form-control" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Ludhiana" />
                </div>
              </div>
              <div className="form-group">
                <label>Estimated delivery (ETA)</label>
                <input className="form-control" type="date" name="eta" value={form.eta} onChange={handleChange} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Shipment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal with timeline */}
      {detailModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{detailModal.shipmentId} — Tracking</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div><div style={{ fontSize: 11, color: '#64748b' }}>Carrier</div><div style={{ fontWeight: 500 }}>{detailModal.carrier}</div></div>
              <div><div style={{ fontSize: 11, color: '#64748b' }}>Tracking No.</div><div style={{ fontWeight: 500 }}>{detailModal.trackingNo || '—'}</div></div>
              <div><div style={{ fontSize: 11, color: '#64748b' }}>Route</div><div>{detailModal.origin || '—'} → {detailModal.destination || '—'}</div></div>
              <div><div style={{ fontSize: 11, color: '#64748b' }}>ETA</div><div>{detailModal.eta ? new Date(detailModal.eta).toLocaleDateString('en-IN') : '—'}</div></div>
              <div><div style={{ fontSize: 11, color: '#64748b' }}>Status</div><StatusBadge status={detailModal.status} /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Shipment Timeline</div>
            <ul className="timeline">
              {detailModal.timeline?.length === 0 && <li style={{ color: '#94a3b8', fontSize: 13 }}>No timeline events yet</li>}
              {detailModal.timeline?.map((t, i) => {
                const isLast = i === detailModal.timeline.length - 1;
                return (
                  <li key={i} className="tl-item">
                    <div className={`tl-dot ${isLast ? 'tl-dot-active' : 'tl-dot-done'}`} />
                    <div className="tl-body">
                      <div className="tl-title">{t.status}{t.location ? ` — ${t.location}` : ''}</div>
                      {t.note && <div style={{ fontSize: 12, color: '#64748b' }}>{t.note}</div>}
                      <div className="tl-date">{new Date(t.date).toLocaleString('en-IN')}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="modal-footer">
              <button className="btn" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
