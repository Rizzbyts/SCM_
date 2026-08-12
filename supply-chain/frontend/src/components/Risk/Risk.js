import React, { useEffect, useState } from 'react';
import { getRiskAlerts } from '../../api';

export default function Risk() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRiskAlerts();
        setAlerts(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading risk alerts...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Predictive Risk Management</h1>
        <p className="page-subtitle">Monitor supplier, shipment, and inventory risks before they impact your chain.</p>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {alerts.map((alert) => (
          <div className="card" key={alert.id} style={{ borderLeft: `4px solid ${alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#10b981'}` }}>
            <div className="card-title">{alert.type}</div>
            <div style={{ marginBottom: 12 }}>{alert.description}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
              <span className="badge">Severity: {alert.severity}</span>
              <span className="badge badge-blue">Action: {alert.action}</span>
              <span className="badge badge-gray">Status: {alert.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
