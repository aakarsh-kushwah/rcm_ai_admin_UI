import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Users, ShieldCheck, Crown, Clapperboard, 
    Mic2, MessageSquareText, BellRing, ArrowUpRight, 
    Activity, ChevronRight, Skull, OctagonAlert 
} from 'lucide-react'; // 'Skull' aur 'OctagonAlert' import kiya hai
import './Dashboard.css';

// ... (menuItems array waisa hi rahega) ...
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
            
            {/* ✅ EXTREME SECURITY WARNING (RED ZONE) */}
            <div className="dashboard-alert-container critical-alert">
                <div className="alert-track">
                    
                    {/* Message 1: Hacking Threat */}
                    <span className="alert-msg">
                        <Skull size={28} className="blink-skull"/> 
                        <strong className="scary-text">अंतिम चेतावनी:</strong> यदि यह पैनल किसी गलत व्यक्ति के हाथ लगा, तो वह <strong>पूरी एप्लीकेशन खाली (Delete)</strong> कर सकता है।
                    </span>
                    
                    <span className="divider">///</span>
                    
                    {/* Message 2: Financial/Data Loss */}
                    <span className="alert-msg">
                        <OctagonAlert size={24} color="#ff0000" />
                        हैकर्स सभी <strong>Users का डेटा मिटा सकते हैं</strong> और सबका <strong>Auto-Pay (Payments) हमेशा के लिए बंद</strong> कर सकते हैं।
                    </span>

                    <span className="divider">///</span>

                    {/* Message 3: No Responsibility */}
                    <span className="alert-msg">
                        अगर पासवर्ड शेयर करने से ऐसा हुआ, तो <strong>रिकवरी असंभव (Impossible)</strong> होगी और <strong>डेवलपमेंट टीम की कोई जिम्मेदारी नहीं होगी।</strong>
                    </span>

                </div>
            </div>

            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div className="header-text">
                        <h1>Command Center</h1>
                        <p>Welcome back, Admin. Maintain protocol.</p>
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