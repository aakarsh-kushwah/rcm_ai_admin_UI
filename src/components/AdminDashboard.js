import React from 'react';
import { Link } from 'react-router-dom';
import {
    Users, ShieldCheck, Crown, Clapperboard,
    Mic2, MessageSquareText, BellRing, ArrowUpRight,
    Activity, ChevronRight, Youtube
} from 'lucide-react';
import './Dashboard.css';

// Channel Management's path assumes the admin router mounts ChannelManagement.js
// at "/channels" (matching the flat top-level pattern every other item here
// already follows). Update this one string if your route is named differently.
const menuItems = [
    {
        title: "User Management",
        desc: "Oversee user profiles, verify identities, and manage permissions.",
        icon: <Users size={32} />,
        path: "/users",
        stat: "12.5k Users",
        color: "blue"
    },
    {
        title: "Admin Control",
        desc: "Manage system administrators, roles, and security protocols.",
        icon: <ShieldCheck size={32} />,
        path: "/admins",
        stat: "8 Admins",
        color: "purple"
    },
    {
        title: "Subscription Hub",
        desc: "Track active plans, revenue streams, and billing cycles.",
        icon: <Crown size={32} />,
        path: "/subscribers",
        stat: "$45k MRR",
        color: "gold"
    },
    {
        title: "Video Library",
        desc: "Upload, edit, and organize video content for the platform.",
        icon: <Clapperboard size={32} />,
        path: "/videos",
        stat: "140 Videos",
        color: "red"
    },
    {
        title: "Channel Management",
        desc: "Add YouTube channels once — every new upload syncs automatically.",
        icon: <Youtube size={32} />,
        path: "/channels",
        stat: "Auto-Sync",
        color: "teal"
    },
    {
        title: "AI Voice Studio",
        desc: "Train voice models and configure Text-to-Speech engines.",
        icon: <Mic2 size={32} />,
        path: "/voice-training",
        stat: "Active",
        color: "orange"
    },
    {
        title: "Live Chat Logs",
        desc: "Monitor AI-User interactions and analyze conversation quality.",
        icon: <MessageSquareText size={32} />,
        path: "/chats",
        stat: "Live Now",
        color: "green"
    },
    {
        title: "Push Broadcast",
        desc: "Send instant notifications to mobile app users globally.",
        icon: <BellRing size={32} />,
        path: "/sendnotifications",
        stat: "Campaigns",
        color: "cyan"
    }
];

const DashboardCard = ({ item }) => (
    <Link to={item.path} className={`bento-card ${item.color}-theme`}>
        <div className="card-bg-glow"></div>
        <div className="card-header">
            <div className="icon-box">{item.icon}</div>
            <div className="arrow-box"><ArrowUpRight size={20} /></div>
        </div>
        <div className="card-body">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
        </div>
        <div className="card-footer">
            <div className="stat-badge">
                <Activity size={14} /><span>{item.stat}</span>
            </div>
            <span className="action-text">Access Module <ChevronRight size={14} /></span>
        </div>
    </Link>
);

function AdminDashboard() {
    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div className="header-text">
                        <h1>Command Center</h1>
                        <p>Welcome back, Admin. Here's what's happening across RCM AI.</p>
                    </div>
                    <div className="system-status">
                        <span className="pulse-dot"></span> System Secured
                    </div>
                </header>

                <div className="bento-grid">
                    {menuItems.map((item, index) => (
                        <DashboardCard key={index} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;