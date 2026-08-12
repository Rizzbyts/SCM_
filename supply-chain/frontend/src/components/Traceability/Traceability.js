import React, { useEffect, useState } from 'react';
import { getTraceabilityData } from '../../api';

export default function Traceability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTraceabilityData();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading traceability data...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Blockchain Traceability</h1>
        <p className="page-subtitle">Track product movement across the chain with secure and immutable audit steps.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Product Journey</div>
        <div className="kpi-grid" style={{ gap: 14 }}>
          <div className="kpi-card"><div className="kpi-label">Product ID</div><div className="kpi-value">{data.productId}</div></div>
          <div className="kpi-card"><div className="kpi-label">QR Code</div><div className="kpi-value"><a href={data.qrCodeUrl} target="_blank" rel="noreferrer">View QR scan</a></div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Traceability timeline</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Step</th><th>Location</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {data.journey.map((step, idx) => (
                <tr key={idx}>
                  <td>{step.step}</td>
                  <td>{step.location}</td>
                  <td>{step.date}</td>
                  <td>{step.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
