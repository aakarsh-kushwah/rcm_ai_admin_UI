import React, { useState, useEffect } from 'react';

import './UserManagement.css'; 

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Data Fetching Logic (Token and API Call) ---
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
                // Fetches only Regular Users (Role: USER)
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    },
                });

                if (!response.ok) {
                    // Assuming the backend sends a JSON error for 401/403 errors
                    const errorData = await response.json(); 
                    throw new Error(errorData.message || 'Failed to fetch user data.');
                }

                const result = await response.json();
                setUsers(result.data || []); 
                
            } catch (err) {
                console.error("Fetch error:", err);
                // The error is often 'Failed to fetch' or 'Not authorized, token failed'
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);
    // --- End of Data Fetching Logic ---


    // --- UI Rendering (Loading and Error States) ---
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
                            <th className="table-header id-col">ID</th>
                            <th className="table-header name-col">Full Name</th> 
                            <th className="table-header rcm-col">RCM ID</th> 
                            <th className="table-header email-col">Email</th>
                            <th className="table-header phone-col">Phone</th> 
                            <th className="table-header role-col">Role</th>
                          
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? users.map(user => (
                            <tr key={user.id} className="table-row">
                                
                                {/* 1. ID Cell */}
                                <td className="table-data id-col">{user.id}</td>

                                {/* 2. Full Name Cell (Shows RCM ID on Mobile) */}
                                <td className="table-data name-col">
                                    {user.fullName}
                                    <span className="mobile-detail rcm-detail">
                                        RCM: {user.rcmId || 'N/A'}
                                    </span>
                                </td>

                                {/* 3. RCM ID Cell (Hidden on Small Screens) */}
                                <td className="table-data rcm-col">{user.rcmId || 'N/A'}</td>
                                
                                {/* 4. Email Cell (Shows Phone on Tablet/Small Screens) */}
                                <td className="table-data email-col">
                                    {user.email}
                                    <span className="mobile-detail phone-detail">
                                        Ph: {user.phone || 'N/A'}
                                    </span>
                                </td>
                                
                                {/* 5. Phone Cell (Hidden on Tablet/Small Screens) */}
                                <td className="table-data phone-col">{user.phone || 'N/A'}</td>
                                
                                {/* 6. Role Cell */}
                                <td className="table-data role-col">
                                    <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                                        {user.role}
                                    </span>
                                </td>

                                {/* 7. Actions Cell (Empty as requested) */}
                                <td className="table-data action-col">
                                    {/* Link removed as requested by user */}
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
