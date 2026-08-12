import React, { useEffect, useState, useRef } from 'react';
import { getIoTSensors, getLiveShipments } from '../../api';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { io as ioClient } from 'socket.io-client';

// Fix Leaflet's default icon URLs when using bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function IoT() {
  const [sensors, setSensors] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState('connecting'); // connecting | connected | reconnecting | disconnected
  const [fullScreen, setFullScreen] = useState(false);
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sh] = await Promise.all([getIoTSensors(), getLiveShipments()]);
        setSensors(s.data.data || []);
        setShipments(sh.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Socket.IO live updates with reconnection/backoff settings
    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = ioClient(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnStatus('connected');
    });
    socket.on('connect_error', (err) => {
      console.warn('Socket connect_error', err?.message || err);
      setConnStatus('reconnecting');
    });
    socket.on('reconnect_attempt', (attempt) => {
      console.log('Reconnecting, attempt', attempt);
      setConnStatus('reconnecting');
    });
    socket.on('reconnect_error', (err) => {
      console.warn('Reconnect error', err?.message || err);
      setConnStatus('reconnecting');
    });
    socket.on('reconnect_failed', () => {
      console.error('Reconnect failed');
      setConnStatus('disconnected');
    });
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io client disconnect') setConnStatus('disconnected');
      else setConnStatus('reconnecting');
    });

    socket.on('shipments:initial', (data) => {
      if (Array.isArray(data)) setShipments(data);
    });
    socket.on('shipment:update', (data) => {
      if (!Array.isArray(data)) return;
      setShipments(data);
    });

    return () => {
      socket.off();
      socket.disconnect();
      setConnStatus('disconnected');
    };
  }, []);

  // Fullscreen handlers — keep map size in sync
  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!document.fullscreenElement;
      setFullScreen(isFS);
      // give leaflet a moment to resize
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading IoT & live shipments...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>IoT & Live Shipments</h1>
        <p className="page-subtitle">Sensor telemetry and live shipment positions for real-time visibility.</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi-card"><div className="kpi-label">Active Sensors</div><div className="kpi-value">{sensors.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Live Shipments</div><div className="kpi-value">{shipments.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Critical Alerts</div><div className="kpi-value">{sensors.filter(s => s.type === 'Temperature' && s.value > 8).length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Realtime</div><div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: connStatus === 'connected' ? '#10b981' : connStatus === 'reconnecting' ? '#f59e0b' : '#ef4444' }} />
          <span style={{ textTransform: 'capitalize' }}>{connStatus}</span>
        </div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Sensor telemetry</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Location</th><th>Type</th><th>Value</th><th>Last seen</th></tr></thead>
              <tbody>
                {sensors.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.location}</td>
                    <td>{s.type}</td>
                    <td>{s.value}{s.unit ? ` ${s.unit}` : ''}{s.humidity ? ` • ${s.humidity}%` : ''}</td>
                    <td>{new Date(s.lastSeen).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Live shipments (map)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-sm" onClick={toggleFullScreen}>{fullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
            </div>
          </div>
          <div ref={containerRef} style={fullScreen ? { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1400, background: '#fff' } : { height: 360 }}>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              whenCreated={(mapInstance) => { mapRef.current = mapInstance; setTimeout(() => mapInstance.invalidateSize(), 50); }}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
              <ClusterLayer points={shipments} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ClusterLayer: adds markers to a Leaflet markerClusterGroup and attaches to the map
function ClusterLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const markers = L.markerClusterGroup();

    points.forEach(p => {
      try {
        const m = L.marker([p.lat, p.lng]);
        const popupHtml = `<div style="font-size:14px"><strong>${p.id}</strong><div>Vehicle: ${p.vehicle}</div><div>Status: ${p.status}</div><div>Speed: ${p.speedKmph} km/h</div></div>`;
        m.bindPopup(popupHtml);
        markers.addLayer(m);
      } catch (e) {
        // invalid coordinates
      }
    });

    map.addLayer(markers);

    return () => {
      try { map.removeLayer(markers); } catch (e) { }
    };
  }, [map, points]);

  return null;
}
