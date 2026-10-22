import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import apiClient from '../services/apiClient';
import { NAV_GROUPS } from './navItems';
import './Dashboard.css';

// Sidebar me jo features hain, wahi cards bante hain (desc wale items)
const FEATURES = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.desc);

const FeatureCard = ({ item }) => {
    const Icon = item.icon;
    return (
        <Link to={item.to} className={`db-card db-${item.color}`}>
            <div className="db-top">
                <div className="db-icon"><Icon size={24} /></div>
                <div className="db-arrow"><ArrowUpRight size={18} /></div>
            </div>
            <div className="db-body">
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
            </div>
        </Link>
    );
};

function AdminDashboard() {
    const [activeCount, setActiveCount] = useState(null);

    useEffect(() => {
        const fetchActiveUsers = async () => {
            try {
                const res = await apiClient.get('/api/admin/analytics/realtime-active');
                if (res.data && res.data.success) {
                    setActiveCount(res.data.activeCount);
                }
            } catch (err) {
                // Ignore background poll errors
            }
        };

        fetchActiveUsers();
        const interval = setInterval(fetchActiveUsers, 20000); // Poll every 20 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="db-root">
            <header className="db-header">
                <div>
                    <h1>Command Center</h1>
                    <p>Welcome back, Admin. Here's what's happening across RCM AI.</p>
                </div>
                <div className="db-pills">
                    <div className="db-pill" aria-live="polite">
                        <span className="db-dot" />
                        Live active users: {activeCount === null ? '—' : activeCount}
                    </div>
                    <div className="db-pill">
                        <span className="db-dot" />
                        System secured
                    </div>
                </div>
            </header>

            <div className="db-grid">
                {FEATURES.map((item) => (
                    <FeatureCard key={item.to} item={item} />
                ))}
            </div>
        </div>
    );
}

export default AdminDashboard;