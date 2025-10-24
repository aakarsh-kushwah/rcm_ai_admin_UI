import React, { useState, useEffect } from 'react';
import './AdminManagement.css'; // Futuristic CSS imported

function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdmins = async () => {
            setError('');
            
            const token = localStorage.getItem('token'); 
            if (!token) {
                setError('Please log in to view admin data.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
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

    // --- Conditional Rendering for Loading/Error ---
    if (loading) return (
        <div className="futuristic-container loading-state">
            <div className="spinner-futuristic"></div>
            <p className="loading-text-futuristic">Loading Admin list...</p>
        </div>
    );
    
    if (error) return (
        <div className="futuristic-container">
            <div className="error-alert-futuristic">Error: {error}</div>
        </div>
    );
    // ---------------------------------------------

    return (
        <div className="futuristic-container">
            <h2 className="futuristic-header">
                Admin Management 
                <span className="admin-count-badge">({admins.length} Admins)</span>
            </h2>
            <p className="futuristic-subtext">This table displays users who have the **'ADMIN' role** assigned in the system.</p>
            
            <div className="table-wrapper-futuristic">
                <table className="admin-table-futuristic">
                    <thead>
                        <tr>
                            <th className="table-header-futuristic id-col">ID</th>
                            <th className="table-header-futuristic name-col">Full Name</th> 
                            <th className="table-header-futuristic email-col">Email</th>
                            <th className="table-header-futuristic rcm-col">RCM ID</th> 
                            <th className="table-header-futuristic created-at-col">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length > 0 ? admins.map(admin => (
                            <tr key={admin.id} className="table-row-futuristic">
                                <td className="table-data-futuristic id-col">{admin.id}</td>
                                <td className="table-data-futuristic name-col">{admin.fullName}</td> 
                                <td className="table-data-futuristic email-col">{admin.email}</td>
                                <td className="table-data-futuristic rcm-col">{admin.rcmId || 'N/A'}</td> 
                                <td className="table-data-futuristic created-at-col">{new Date(admin.createdAt).toLocaleDateString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="no-admins-message-futuristic">No other administrators found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default AdminManagement;