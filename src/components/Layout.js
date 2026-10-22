import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { NAV_GROUPS } from './navItems';
import './Layout.css';

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const current = ALL_ITEMS.find(
    (i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`)
  );
  const pageTitle = current ? current.label : 'Admin';

  // Page badalne par mobile menu band
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Menu khula ho: background scroll lock, Esc se band, desktop size par band
  useEffect(() => {
    if (!menuOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => {
      if (e.matches) setMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [menuOpen]);

  return (
    <div className="al-root">
      {/* Mobile / tablet top bar */}
      <header className="al-topbar">
        <button
          type="button"
          className="al-icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="al-sidebar"
        >
          <Menu size={22} />
        </button>
        <h1 className="al-topbar-title">{pageTitle}</h1>
      </header>

      {menuOpen && <div className="al-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {/* Sidebar: desktop pe fixed, mobile pe slide-in menu */}
      <aside id="al-sidebar" className={`al-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="al-sidebar-head">
          <span className="al-brand">Core Admin</span>
          <button
            type="button"
            className="al-icon-btn al-close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="al-nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div className="al-group" key={group.label}>
              <div className="al-group-label">{group.label}</div>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `al-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="al-sidebar-foot">
          <button type="button" className="al-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="al-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;