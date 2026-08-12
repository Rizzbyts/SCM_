import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import useScrollReveal from '../useScrollReveal';

const navItems = [
  { to: '/',          label: 'Dashboard',  end: true },
  { to: '/suppliers', label: 'Suppliers'             },
  { to: '/inventory', label: 'Inventory'             },
  { to: '/orders',    label: 'Orders'                },
  { to: '/shipments', label: 'Shipments'             },
  { to: '/reports',   label: 'Reports'               },
  { to: '/forecasting', label: 'Forecasting'         },
  { to: '/traceability', label: 'Traceability'       },
  { to: '/risk',      label: 'Risk Alerts'           },
  { to: '/automation', label: 'Automation'           },
  { to: '/iot',       label: 'IoT'                   },
  { to: '/admin',     label: 'Admin'                 },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  // Re-run the scroll-reveal observer whenever the route changes,
  // giving the new page's cards/tables/kpis their entrance animation.
  useScrollReveal([location.pathname]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Supply<span>Chain</span> Pro</div>
        <nav>
          {navItems.map(({ to, label, end }) => {
            if (to === '/admin' && !isAdmin) return null;
            return (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-link-label">{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
          <button className="btn btn-sm sidebar-logout" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {navItems.find(n => location.pathname === n.to || (!n.end && location.pathname.startsWith(n.to)))?.label || 'Supply Chain'}
          </div>
          <div className="topbar-right">
            <div className="topbar-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <ThemeToggle />
            <div className="topbar-avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="page-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
