import React, { useState, useEffect } from 'react';
import './UserManagement.css'; 
import apiClient from '../services/apiClient';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await apiClient.get('/api/admin/users');
                setUsers(res.data?.data || []); 
            } catch (err) { console.error("API Error", err); } 
            finally { setLoading(false); }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            user.fullName.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.phone && user.phone.includes(term)) ||
            (user.id && user.id.toString().includes(term))
        );
    });

    const truncateEmail = (email) => email.length > 10 ? email.substring(0, 8) + '...' : email;

    if (loading) return <div className="loader-box"><div className="spin"></div></div>;

    return (
        <div className="crm-panel">
            <div className="sticky-search-container">
                <div className="omni-search-bar">
                    <span className="search-glyph">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search Name, Email, ID or Mobile..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="user-grid">
                {filteredUsers.map(user => (
                    <div key={user.id} className="user-card-pro" onClick={() => setSelectedUser(user)}>
                        <div className="card-inner">
                            <div className="user-avatar-hex" style={{background: `linear-gradient(45deg, #6366f1, #a855f7)`}}>
                                {user.fullName[0]}
                            </div>
                            <div className="user-text-meta">
                                <h3 className="pro-name">{user.fullName}</h3>
                                <div className="pro-details-row">
                                    <span className="id-label">#{user.id.toString().slice(-5)}</span>
                                    <span className="email-label">{truncateEmail(user.email)}</span>
                                    {user.phone && <span className="phone-preview">📱 {user.phone.slice(-4)}</span>}
                                </div>
                            </div>
                            <div className="dots-icon">•••</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Sheet Overlay */}
            {selectedUser && (
                <div className="sheet-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="sheet-header">
                            <div className="large-avatar">{selectedUser.fullName[0]}</div>
                            <h2>{selectedUser.fullName}</h2>
                            <p className="highlight-email">{selectedUser.email}</p>
                        </div>
                        <div className="sheet-actions">
                            <button onClick={() => {navigator.clipboard.writeText(selectedUser.email); alert('Copied!')}}>📋 Copy Email</button>
                            <a href={`mailto:${selectedUser.email}`} className="sheet-btn">✉️ Send Email</a>
                            <a href={`tel:${selectedUser.phone}`} className="sheet-btn">📞 Call Now</a>
                            <a href={`https://wa.me/${selectedUser.phone}`} className="sheet-btn wa-btn">💬 WhatsApp</a>
                        </div>
                        <button className="sheet-close" onClick={() => setSelectedUser(null)}>Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagement;