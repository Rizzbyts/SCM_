import React, { useEffect, useState } from 'react';
import { getAutomationRules } from '../../api';

export default function Automation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAutomationRules();
        setRules(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading automation rules...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Workflow Automation</h1>
        <p className="page-subtitle">Enable automated PO creation, shipment alerts, and low-stock notifications for faster operations.</p>
      </div>

      <div className="card">
        <div className="card-title">Active automation rules</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rule</th><th>Description</th><th>Enabled</th></tr></thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{rule.description}</td>
                  <td>{rule.enabled ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
