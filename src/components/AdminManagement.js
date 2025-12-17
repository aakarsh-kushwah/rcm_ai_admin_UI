import React, { useState, useEffect } from 'react';
import { 
  Search, Shield, User, Mail, Calendar, 
  MoreVertical, RefreshCw, AlertCircle 
} from 'lucide-react';
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
            setError('Authentication required.');
            setLoading(false);
            return;
        }

        try {
            // Simulated delay for "futuristic" loading feel
            // Remove setTimeout in production if preferred
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch admin data.');
            }

            const result = await response.json();
            setAdmins(result.data || []); 
            
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // Filter Logic
    const filteredAdmins = admins.filter(admin => 
        admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.rcmId && admin.rcmId.toString().includes(searchTerm))
    );

    // Helper: Get Initials for Avatar
    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';
    };

    return (
        <div className="admin-page-container">
            {/* BACKGROUND GLOWS */}
            <div className="glow-spot top-left"></div>
            <div className="glow-spot bottom-right"></div>

            <div className="admin-dashboard-glass">
                {/* HEADER SECTION */}
                <header className="dashboard-header">
                    <div className="header-title">
                        <div className="icon-box">
                            <Shield size={24} color="#06b6d4" />
                        </div>
                        <div>
                            <h1>Admin Registry</h1>
                            <p>Manage system administrators and privileges</p>
                        </div>
                    </div>
                    
                    <div className="header-actions">
                        <div className="search-bar">
                            <Search size={18} className="search-icon"/>
                            <input 
                                type="text" 
                                placeholder="Search by name, email, ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="refresh-btn" onClick={fetchAdmins} title="Refresh List">
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                </header>

                {/* ERROR STATE */}
                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* DATA GRID (RESPONSIVE TABLE) */}
                <div className="data-grid-container">
                    {/* Header Row (Hidden on Mobile) */}
                    <div className="grid-header">
                        <div className="col col-user">Admin User</div>
                        <div className="col col-email">Contact Info</div>
                        <div className="col col-rcm">RCM ID</div>
                        <div className="col col-date">Joined</div>
                        <div className="col col-action">Action</div>
                    </div>

                    {/* Content Rows */}
                    <div className="grid-body">
                        {loading ? (
                            // Skeleton Loading
                            [1, 2, 3].map(i => <div key={i} className="grid-row skeleton-row"></div>)
                        ) : filteredAdmins.length > 0 ? (
                            filteredAdmins.map(admin => (
                                <div key={admin.id} className="grid-row">
                                    <div className="col col-user" data-label="User">
                                        <div className="avatar">
                                            {getInitials(admin.fullName)}
                                        </div>
                                        <div className="user-info">
                                            <span className="fullname">{admin.fullName}</span>
                                            <span className="user-id">ID: #{admin.id}</span>
                                        </div>
                                    </div>

                                    <div className="col col-email" data-label="Email">
                                        <Mail size={14} className="mobile-icon"/>
                                        {admin.email}
                                    </div>

                                    <div className="col col-rcm" data-label="RCM ID">
                                        <span className={`badge ${admin.rcmId ? 'badge-blue' : 'badge-gray'}`}>
                                            {admin.rcmId || 'Not Linked'}
                                        </span>
                                    </div>

                                    <div className="col col-date" data-label="Joined">
                                        <Calendar size={14} className="mobile-icon"/>
                                        {new Date(admin.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </div>

                                    <div className="col col-action">
                                        <button className="icon-btn">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <User size={48} />
                                <p>No admins found matching criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="dashboard-footer">
                    <span>Showing {filteredAdmins.length} Records</span>
                    <span className="status-dot">System Online</span>
                </div>
            </div>
        </div>
    );
}

export default AdminManagement;