import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_COLORS = { admin: 'badge-red', manager: 'badge-blue', viewer: 'badge-gray' };

export default function Admin() {
  const { user: me } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'viewer', isActive: true });
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ company: 'Punjab Industrial Supplies Pvt Ltd', email: 'admin@company.in', lowStockThreshold: 20 });

  const load = async () => {
    setLoading(true);
    try { const r = await getUsers(); setUsers(r.data.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'viewer', isActive: true }); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive }); setModal(true); };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) { await updateUser(editing._id, payload); toast.success('User updated'); }
      else         { await createUser(payload); toast.success('User created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (id === me?._id) return toast.error('Cannot delete yourself');
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try { await deleteUser(id); toast.success('User deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header"><h1>Admin Panel</h1></div>

      <div className="grid-2">
        {/* User Management */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>User Management</div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add User</button>
          </div>
          {loading
            ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Loading...</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong>
                          {u._id === me?._id && <span style={{ fontSize: 10, color: '#2563eb', marginLeft: 4 }}>(you)</span>}
                        </td>
                        <td style={{ fontSize: 12 }}>{u.email}</td>
                        <td><span className={`badge ${ROLE_COLORS[u.role] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                        <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <button className="btn btn-sm" style={{ marginRight: 4 }} onClick={() => openEdit(u)}>Edit</button>
                          {u._id !== me?._id && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id, u.name)}>Del</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="card-title">System Settings</div>
          <div className="form-group">
            <label>Company name</label>
            <input className="form-control" value={settings.company} onChange={e => setSettings(s => ({ ...s, company: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Notification email</label>
            <input className="form-control" type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Low stock threshold (%)</label>
            <input className="form-control" type="number" min="1" max="100" value={settings.lowStockThreshold} onChange={e => setSettings(s => ({ ...s, lowStockThreshold: e.target.value }))} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Alert when stock falls below this % of reorder level</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => toast.success('Settings saved')}>Save Settings</button>
            <button className="btn" onClick={() => toast('Settings reset to default')}>Reset</button>
          </div>
        </div>
      </div>

      {/* Role permissions info */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Role & Permission Matrix</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Permission</th><th>Admin</th><th>Manager</th><th>Viewer</th></tr>
            </thead>
            <tbody>
              {[
                ['View all modules',         '✅', '✅', '✅'],
                ['Add/Edit suppliers',        '✅', '✅', '❌'],
                ['Manage inventory',          '✅', '✅', '❌'],
                ['Create purchase orders',    '✅', '✅', '❌'],
                ['Approve purchase orders',   '✅', '✅', '❌'],
                ['Manage shipments',          '✅', '✅', '❌'],
                ['Delete records',            '✅', '❌', '❌'],
                ['Access admin panel',        '✅', '❌', '❌'],
                ['Manage users',              '✅', '❌', '❌'],
              ].map(([perm, ...vals]) => (
                <tr key={perm}>
                  <td>{perm}</td>
                  {vals.map((v, i) => <td key={i} style={{ textAlign: 'center', fontSize: 16 }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{editing ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full name *</label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>{editing ? 'New password (leave blank to keep)' : 'Password *'}</label>
                <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required={!editing} minLength={6} placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select className="form-control" name="role" value={form.role} onChange={handleChange}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                    Active account
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
