import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setError('');
            
            // ✅ CRITICAL FIX: Token Check before fetching
            const token = localStorage.getItem('token'); 
            if (!token) {
                setError('Please log in to view user management data.');
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                // Endpoint fetches ONLY role: 'USER'
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

    if (loading) return <p>Loading regular users...</p>;
    if (error) return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;

    return (
        <div>
            <h2>User Management ({users.length} Regular Users)</h2>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Full Name</th> 
                        <th>RCM ID</th> 
                        <th>Email</th>
                        <th>Phone</th> 
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.fullName}</td> 
                            <td>{user.rcmId || 'N/A'}</td> 
                            <td>{user.email}</td>
                            <td>{user.phone || 'N/A'}</td> 
                            <td>{user.role}</td>
                            <td style={{ textAlign: 'center' }}>
                                <Link to={`/users/${user.id}/chats`} state={{ userEmail: user.email }}>
                                    View Chats
                                </Link>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center' }}>No regular users found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
export default UserManagement;