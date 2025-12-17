import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout() {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="admin-app-root">
            {/* Top Navbar: Sticky on all devices */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="brand-identity">
                        <div className="logo-glow"></div>
                        <span className="brand-text">CORE ADMIN</span>
                    </div>
                    <button onClick={handleLogout} className="logout-minimal-btn">Logout 🚪</button>
                </div>

                {/* Mobile Scrollable Chips (Only visible on Mobile) */}
                <div className="mobile-tab-bar">
                    <NavLink to="/dashboard" className="nav-chip">📊 Dashboard</NavLink>
                    <NavLink to="/users" className="nav-chip">👥 Users</NavLink>
                    <NavLink to="/admins" className="nav-chip">🛡️ Admins</NavLink>
                    <NavLink to="/subscribers" className="nav-chip">📩 Subs</NavLink>
                    <NavLink to="/videos" className="nav-chip">🎬 Videos</NavLink>
                    <NavLink to="/chats" className="nav-chip">💬 Chats</NavLink>
                </div>
            </header>

            <div className="layout-container">
                {/* Desktop Sidebar (Fixed/Sticky on Laptop) */}
                <aside className="fixed-sidebar">
                    <div className="sidebar-nav">
                        <NavLink to="/dashboard" className="side-nav-item">Dashboard</NavLink>
                        <NavLink to="/users" className="side-nav-item">Users</NavLink>
                        <NavLink to="/admins" className="side-nav-item">Admins</NavLink>
                        <NavLink to="/subscribers" className="side-nav-item">Subscribers</NavLink>
                        <NavLink to="/videos" className="side-nav-item">Videos</NavLink>
                        <NavLink to="/chats" className="side-nav-item">Chats</NavLink>
                        <NavLink to="/sendnotifications" className="side-nav-item">Alerts</NavLink>
                    </div>
                </aside>

                {/* Scrollable Main Area */}
                <main className="main-viewport">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;