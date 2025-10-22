import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // ✅ New CSS file for styling

// Helper component for styled dashboard cards
const DashboardCard = ({ title, icon, path }) => (
    <Link to={path} className="dashboard-card" aria-label={`Go to ${title} section`}>
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <span className="arrow-icon">→</span>
    </Link>
);

function AdminDashboard() {
    return (
        <div className="dashboard-container">
            <h1 className="dashboard-heading">Admin Portal Dashboard</h1>
            <p className="dashboard-subtitle">Manage Users, Content, and System Subscriptions.</p>
            
            <div className="dashboard-grid">
                <DashboardCard 
                    title="User Management" 
                    icon="👥" // People Icon
                    path="/users"
                />
                <DashboardCard 
                    title="Admin Accounts" 
                    icon="🔑" // Key Icon
                    path="/admins" // Assuming you use this new route for Admin accounts
                />
                <DashboardCard 
                    title="Subscribers List" 
                    icon="📧" // Envelope Icon
                    path="/subscribers"
                />
                <DashboardCard 
                    title="Video Management" 
                    icon="🎬" // Clapperboard Icon
                    path="/videos"
                />
                <DashboardCard 
                    title="Chat Viewer" 
                    icon="💬" // Speech Bubble Icon
                    path="/chats"
                />
            </div>
        </div>
    );
}
export default AdminDashboard;
