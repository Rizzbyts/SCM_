import React, { useState, useEffect, useCallback } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api';
import { StatusBadge } from '../Dashboard/Dashboard';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { name: '', contactPerson: '', email: '', phone: '', address: '', city: '', category: 'Raw Material', paymentTerms: 'Net 30', status: 'Active', notes: '' };

export default function Suppliers() {
  const { isManager } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSuppliers({ search, status: filterStatus, page, limit: LIMIT });
      setSuppliers(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search, filterStatus, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, contactPerson: s.contactPerson, email: s.email, phone: s.phone || '', address: s.address || '', city: s.city || '', category: s.category, paymentTerms: s.paymentTerms, status: s.status, notes: s.notes || '' }); setModal(true); };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateSupplier(editing._id, form);
        toast.success('Supplier updated');
      } else {
        await createSupplier(form);
        toast.success('Supplier added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier(id);
      toast.success('Supplier deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1>Suppliers <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>({total})</span></h1>
        {isManager && <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>}
      </div>

      <div className="search-row">
        <input className="form-control" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option>Active</option><option>Inactive</option><option>Blacklisted</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Supplier</th><th>Contact Person</th><th>Email</th><th>Category</th><th>Payment Terms</th><th>Orders</th><th>Status</th>{isManager && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading...</td></tr>}
              {!loading && suppliers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No suppliers found</td></tr>}
              {suppliers.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong><br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{s.city}</span></td>
                  <td>{s.contactPerson}</td>
                  <td>{s.email}</td>
                  <td>{s.category}</td>
                  <td>{s.paymentTerms}</td>
                  <td>{s.totalOrders}</td>
                  <td><StatusBadge status={s.status} /></td>
                  {isManager && (
                    <td>
                      <button className="btn btn-sm" style={{ marginRight: 4 }} onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id, s.name)}>Del</button>
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

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editing ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier name *</label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rathi Traders" />
                </div>
                <div className="form-group">
                  <label>Contact person *</label>
                  <input className="form-control" name="contactPerson" value={form.contactPerson} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="98XXXXXX" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input className="form-control" name="city" value={form.city} onChange={handleChange} placeholder="Ludhiana" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                    <option>Raw Material</option><option>Electrical</option><option>Mechanical</option><option>Safety</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payment terms</label>
                  <select className="form-control" name="paymentTerms" value={form.paymentTerms} onChange={handleChange}>
                    <option>Net 30</option><option>Net 60</option><option>Advance</option><option>COD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option>Active</option><option>Inactive</option><option>Blacklisted</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
