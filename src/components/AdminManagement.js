import React, { useState, useEffect } from 'react';

function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdmins = async () => {
            setError('');
            
            // ✅ CRITICAL FIX: Token Check before fetching
            const token = localStorage.getItem('token'); 
            if (!token) {
                setError('Please log in to view admin data.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Endpoint fetches ONLY role: 'ADMIN'
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
        fetchAdmins();
    }, []);

    if (loading) return <p>Loading Admin list...</p>;
    if (error) return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Admin Management ({admins.length} Admins)</h2>
            <p>This table displays users who have the **'ADMIN' role** assigned in the database.</p>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Full Name</th> 
                        <th>Email</th>
                        <th>RCM ID</th> 
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.length > 0 ? admins.map(admin => (
                        <tr key={admin.id}>
                            <td>{admin.id}</td>
                            <td>{admin.fullName}</td> 
                            <td>{admin.email}</td>
                            <td>{admin.rcmId || 'N/A'}</td> 
                            <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center' }}>No other administrators found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
export default AdminManagement;