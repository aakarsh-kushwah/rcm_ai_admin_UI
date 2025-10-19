import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const DashboardCard = ({ title, icon, path }) => (
    <Link to={path} className="dashboard-card">
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
    </Link>
);

function AdminDashboard() {
    return (
        <div className="dashboard-grid">
            <DashboardCard 
                title="User Management" 
                icon="👥" 
                path="/users"
            />
            <DashboardCard 
                title="Subscribers List" 
                icon="📧" 
                path="/subscribers"
            />
            <DashboardCard 
                title="Video Management" 
                icon="🎬" 
                path="/videos"
            />
            <DashboardCard 
                title="Chat Viewer" 
                icon="💬" 
                path="/chats"
            />
        </div>
    );
}
export default AdminDashboard;