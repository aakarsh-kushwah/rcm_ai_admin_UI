import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; 

// Helper component for styled dashboard cards
const DashboardCard = ({ title, icon, path }) => (
    <Link 
        to={path} 
        className="dashboard-card-futuristic" 
        aria-label={`Go to ${title} section`}
    >
        <div className="card-icon-futuristic">{icon}</div>
        <h3 className="card-title-futuristic">{title}</h3>
        <span className="arrow-icon-futuristic">→</span>
    </Link>
);

function AdminDashboard() {
    return (
        <div className="futuristic-dashboard-container">
            <h1 className="futuristic-heading">
                Admin Portal Dashboard
            </h1>
            <p className="futuristic-subtitle">System Control Panel: Manage Users, Content, and Subscriptions.</p>
            
            <div className="dashboard-grid-futuristic">
                <DashboardCard 
                    title="User Management" 
                    icon="👥" 
                    path="/users"
                />
                <DashboardCard 
                    title="Admin Accounts" 
                    icon="🔑" 
                    path="/admins" 
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
                    title="AI Voice Training" 
                    icon="🎙️" 
                    path="/voice-training"
                />
                <DashboardCard 
                    title="Chat Viewer" 
                    icon="💬" 
                    path="/chats"
                />
                
                {/* ✅ NEW: Notification Center Card */}
                <DashboardCard 
                    title="Send Notifications" 
                    icon="📢" 
                    path="/sendnotifications"
                />
            </div>
        </div>
    );
}
export default AdminDashboard;