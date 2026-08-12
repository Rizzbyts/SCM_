import React, { useEffect, useState } from 'react';
import { getForecastData } from '../../api';

const riskColor = (risk) => {
  const r = (risk || '').toLowerCase();
  if (r.includes('high') || r.includes('critical')) return 'badge-red';
  if (r.includes('med')) return 'badge-amber';
  return 'badge-green';
};

export default function Forecasting() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getForecastData();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const raw = data.demandForecast.confidence;
    const target = typeof raw === 'string' ? parseInt(raw, 10) || 82 : raw || 82;
    let frame;
    let start;
    const duration = 900;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setPct(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [data]);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading demand forecasting...</div>;

  const { demandForecast, topRisks, automationSuggestions } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Demand Forecasting</h1>
          <p className="page-subtitle">Predict future inventory needs and reorder quantities with intelligent recommendations.</p>
        </div>
        <span className="ai-badge">⚡ AI Powered</span>
      </div>

      <div className="forecast-hero reveal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', position: 'relative' }}>
          <div className="confidence-ring" style={{ '--pct': pct }}>
            <span>{pct}%</span>
          </div>
          <div style={{ minWidth: 220 }}>
            <div className="kpi-label">Model confidence</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{demandForecast.confidence}</div>
            <div className="page-subtitle" style={{ marginTop: 6 }}>
              Forecast for <strong style={{ color: 'var(--text)' }}>{demandForecast.product}</strong> based on historical demand, seasonality and current stock velocity.
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Forecast Product</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{demandForecast.product}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">30-Day Demand</div>
          <div className="kpi-value">{demandForecast.next30Days}<span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}> units</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Recommended Reorder</div>
          <div className="kpi-value">{demandForecast.recommendedReorder}<span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}> units</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Stock Days Left</div>
          <div className="kpi-value kpi-warn">{demandForecast.stockDaysLeft}<span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}> days</span></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="ai-card">
          <div className="card-title">Top risk detected</div>
          <div className="insight-row">
            <div className="insight-icon">⚠</div>
            <div>
              <div style={{ fontWeight: 700 }}>{topRisks[0]?.title || 'No active risks'}</div>
              <div className="page-subtitle" style={{ marginTop: 4 }}>
                Severity: <span className={`badge ${riskColor(topRisks[0]?.risk)}`}>{topRisks[0]?.risk || 'Low'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-card">
          <div className="card-title">Suggested automation</div>
          <div className="insight-row">
            <div className="insight-icon">✓</div>
            <div>
              <div style={{ fontWeight: 700 }}>{automationSuggestions[0]?.message || 'No suggestions yet'}</div>
              <div className="page-subtitle" style={{ marginTop: 4 }}>Auto-generated from the current forecast model.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Forecast insights</div>
        <ul className="info-list">
          <li className="insight-row"><strong style={{ minWidth: 100, display: 'inline-block' }}>Confidence</strong> {demandForecast.confidence}</li>
          <li className="insight-row"><strong style={{ minWidth: 100, display: 'inline-block' }}>Risk alert</strong> {topRisks[0].title} ({topRisks[0].risk})</li>
          <li className="insight-row"><strong style={{ minWidth: 100, display: 'inline-block' }}>Automation</strong> {automationSuggestions[0].message}</li>
        </ul>
      </div>
    </div>
  );
}
