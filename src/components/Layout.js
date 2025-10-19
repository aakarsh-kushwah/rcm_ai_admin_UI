import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

function Layout() {
    const navigate = useNavigate();
    const handleLogout = () => {
        // Remove standardized token and role
        localStorage.removeItem('token');
        localStorage.removeItem('userRole'); 
        navigate('/login');
    };

    const navLinkStyles = ({ isActive }) => ({
        color: isActive ? '#3498db' : 'white',
        textDecoration: 'none',
        marginRight: '20px',
        fontWeight: isActive ? 'bold' : 'normal'
    });

    return (
        <div>
            <nav style={{ background: '#2c3e50', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <NavLink to="/dashboard" style={navLinkStyles}>Dashboard</NavLink>
                    <NavLink to="/users" style={navLinkStyles}>User Management</NavLink>
                    <NavLink to="/admins" style={navLinkStyles}>Admin Management</NavLink> {/* ✅ NEW LINK ADDED */}
                    <NavLink to="/subscribers" style={navLinkStyles}>Subscribers</NavLink>
                    <NavLink to="/chats" style={navLinkStyles}>All Chats</NavLink>
                    <NavLink to="/videos" style={navLinkStyles}>Video Management</NavLink>
                </div>
                <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                    Logout
                </button>
            </nav>
            <main style={{ padding: '20px' }}>
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;