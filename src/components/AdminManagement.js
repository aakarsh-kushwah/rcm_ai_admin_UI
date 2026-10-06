import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Search, RefreshCw, AlertCircle } from 'lucide-react';
import './AdminManagement.css';

function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAdmins = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token'); 
        if (!token) {
            setError('Authentication token missing.');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch admin data.');
            const result = await response.json();
            setAdmins(result.data || []); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAdmins(); }, []);

    const filteredAdmins = admins.filter(admin => 
        (admin?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="wa-container">
            {/* WhatsApp Header */}
            <div className="wa-sidebar-header">
                <div className="wa-header-left">
                    <div className="wa-avatar-main">
                        <User size={22} />
                    </div>
                    <h2>Admin Directory</h2>
                </div>
                <button className="wa-refresh-btn" onClick={fetchAdmins} title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="wa-search-bar">
                <div className="wa-search-input-wrapper">
                    <Search size={16} />
                    <input 
                        type="text"
                        placeholder="Search admin by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Admin List Body */}
            <div className="wa-content-body">
                {loading ? (
                    <div className="wa-loading">
                        <div className="wa-spinner"></div>
                        <p>Loading admins...</p>
                    </div>
                ) : error ? (
                    <div className="wa-error">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                    </div>
                ) : filteredAdmins.length > 0 ? (
                    <div className="wa-chat-list">
                        {filteredAdmins.map((admin, idx) => {
                            const isSuper = admin?.rcmId || (admin?.role || '').toUpperCase() === 'SUPER_ADMIN';
                            return (
                                <div key={admin?.id || idx} className="wa-chat-item">
                                    <div className="wa-chat-avatar">
                                        {(admin?.fullName || admin?.email || 'A').charAt(0).toUpperCase()}
                                        <span className="wa-online-dot"></span>
                                    </div>
                                    <div className="wa-chat-info">
                                        <div className="wa-chat-top">
                                            <span className="wa-name">{admin?.fullName || admin?.email || 'Unknown Admin'}</span>
                                            <span className="wa-time">
                                                {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <div className="wa-chat-bottom">
                                            <span className="wa-email"><Mail size={13} /> {admin?.email || 'N/A'}</span>
                                            <span className={`wa-badge ${isSuper ? 'super' : 'std'}`}>
                                                <ShieldCheck size={12} /> {isSuper ? 'Super Admin' : 'Standard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="wa-empty">
                        <p>No admins found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminManagement;