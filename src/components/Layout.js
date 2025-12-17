import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Shield, Crown, 
    Video, Mic, MessageSquare, Bell, LogOut 
} from 'lucide-react'; // Installing icons for pro look (npm install lucide-react)
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
                    <button onClick={handleLogout} className="logout-minimal-btn">
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Mobile Scrollable Chips (Visible on Mobile Only) */}
                <div className="mobile-tab-bar">
                    <NavLink to="/dashboard" className="nav-chip">📊 Dash</NavLink>
                    <NavLink to="/users" className="nav-chip">👥 Users</NavLink>
                    <NavLink to="/admins" className="nav-chip">🛡️ Admins</NavLink>
                    <NavLink to="/subscribers" className="nav-chip">💎 Subs</NavLink>
                    <NavLink to="/videos" className="nav-chip">🎬 Videos</NavLink>
                    <NavLink to="/voice-training" className="nav-chip">🎙️ Voice</NavLink> {/* ADDED */}
                    <NavLink to="/chats" className="nav-chip">💬 Chats</NavLink>
                    <NavLink to="/sendnotifications" className="nav-chip">📢 Alerts</NavLink> {/* ADDED */}
                </div>
            </header>

            <div className="layout-container">
                {/* Desktop Sidebar (Fixed/Sticky on Laptop) */}
                <aside className="fixed-sidebar">
                    <div className="sidebar-nav">
                        <div className="nav-group-label">OVERVIEW</div>
                        <NavLink to="/dashboard" className="side-nav-item">
                            <LayoutDashboard size={18} /> Dashboard
                        </NavLink>

                        <div className="nav-group-label">MANAGEMENT</div>
                        <NavLink to="/users" className="side-nav-item">
                            <Users size={18} /> Users
                        </NavLink>
                        <NavLink to="/admins" className="side-nav-item">
                            <Shield size={18} /> Admins
                        </NavLink>
                        <NavLink to="/subscribers" className="side-nav-item">
                            <Crown size={18} /> Subscribers
                        </NavLink>

                        <div className="nav-group-label">CONTENT & AI</div>
                        <NavLink to="/videos" className="side-nav-item">
                            <Video size={18} /> Videos
                        </NavLink>
                        <NavLink to="/voice-training" className="side-nav-item">
                            <Mic size={18} /> Voice AI
                        </NavLink> {/* ADDED */}
                        <NavLink to="/chats" className="side-nav-item">
                            <MessageSquare size={18} /> Chat Logs
                        </NavLink>

                        <div className="nav-group-label">SYSTEM</div>
                        <NavLink to="/sendnotifications" className="side-nav-item">
                            <Bell size={18} /> Push Alerts
                        </NavLink> {/* ADDED */}
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