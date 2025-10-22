import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import './UserManagement.css'; 

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Data Fetching Logic (Same as before) ---
    useEffect(() => {
        const fetchUsers = async () => {
            setError('');
            
            const token = localStorage.getItem('token'); 
            if (!token) {
                setError('Please log in to view user management data.');
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch user data.');
                }

                const result = await response.json();
                setUsers(result.data || []); 
                
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);
    // --- End of Data Fetching Logic ---


    // --- UI Rendering ---

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading regular users...</p>
        </div>
    );

    if (error) return (
        <div className="error-alert" role="alert">
            <strong className="error-bold">Error!</strong>
            <span className="error-message">{error}</span>
        </div>
    );

    return (
        <div className="user-management-container">
            <h2 className="user-management-header">
                User Management 
                <span className="user-count">({users.length} Regular Users)</span>
            </h2>

            <div className="table-wrapper">
                <table className="user-table">
                    <thead>
                        <tr>
                            {/* CSS Media Queries से ये कॉलम छोटी स्क्रीन पर छिप जाएंगे */}
                            <th className="table-header id-col">ID</th>
                            <th className="table-header name-col">Full Name</th> 
                            <th className="table-header rcm-col">RCM ID</th> 
                            <th className="table-header email-col">Email</th>
                            <th className="table-header phone-col">Phone</th> 
                            <th className="table-header role-col">Role</th>
                            <th className="table-header action-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? users.map(user => (
                            <tr key={user.id} className="table-row">
                                
                                {/* ID Cell */}
                                <td className="table-data id-col">{user.id}</td>

                                {/* Full Name Cell - मोबाइल पर RCM ID दिखाने के लिए 'mobile-detail' का उपयोग */}
                                <td className="table-data name-col">
                                    {user.fullName}
                                    <span className="mobile-detail rcm-detail">
                                        RCM: {user.rcmId || 'N/A'}
                                    </span>
                                </td>

                                {/* RCM ID Cell */}
                                <td className="table-data rcm-col">{user.rcmId || 'N/A'}</td>
                                
                                {/* Email Cell - मोबाइल पर Phone दिखाने के लिए 'mobile-detail' का उपयोग */}
                                <td className="table-data email-col">
                                    {user.email}
                                    <span className="mobile-detail phone-detail">
                                        Ph: {user.phone || 'N/A'}
                                    </span>
                                </td>
                                
                                {/* Phone Cell */}
                                <td className="table-data phone-col">{user.phone || 'N/A'}</td>
                                
                                {/* Role Cell */}
                                <td className="table-data role-col">
                                    <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                                        {user.role}
                                    </span>
                                </td>

                                {/* Actions Cell */}
                                <td className="table-data action-col">
                                    <Link 
                                        to={`/users/${user.id}/chats`} 
                                        state={{ userEmail: user.email }}
                                        className="action-link"
                                    >
                                        View Chats
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="no-users-message">
                                    No regular users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && !loading && !error && (
                 <p className="no-users-footer">No users to display.</p>
            )}
        </div>
    );
}

export default UserManagement;