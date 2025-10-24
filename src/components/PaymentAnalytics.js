import React, { useState, useEffect } from 'react';
// Assuming Dashboard.css for styling

function PaymentAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const monthlySubscriptionPrice = 499; // Set your monthly price here (e.g., 499 INR)

    useEffect(() => {
        const fetchPaymentStats = async () => {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token'); 

            if (!token) {
                setError('Authentication missing.');
                setLoading(false);
                return;
            }

            try {
                // Fetch all regular users (Role: USER)
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('Failed to fetch user data.');

                const result = await response.json();
                const users = result.data || [];

                // --- Analytics Calculation ---
                const totalUsers = users.length;
                const autoPayOn = users.filter(u => u.autoPayStatus).length;
                const autoPayOff = totalUsers - autoPayOn;

                // Calculate Upcoming Revenue for the next 30 days
                const today = new Date();
                const next30Days = new Date();
                next30Days.setDate(today.getDate() + 30);

                const upcomingPayments = users.filter(u => 
                    u.autoPayStatus && u.nextBillingDate && new Date(u.nextBillingDate) >= today && new Date(u.nextBillingDate) <= next30Days
                ).length;
                
                const estimatedMonthlyRevenue = autoPayOn * monthlySubscriptionPrice;
                const upcomingRevenue = upcomingPayments * monthlySubscriptionPrice;

                setStats({ totalUsers, autoPayOn, autoPayOff, upcomingPayments, estimatedMonthlyRevenue, upcomingRevenue });

            } catch (err) {
                console.error("Payment fetch error:", err);
                setError('Failed to fetch payment stats. Check API connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentStats();
    }, []);

    if (loading) return <p>Loading business analytics...</p>;
    if (error) return <p className="error-alert" style={{margin: '20px', textAlign: 'center'}}>Error: {error}</p>;

    return (
        <div className="analytics-container">
            <h1 className="analytics-heading">Business Analytics (Auto-Pay)</h1>

            <div className="dashboard-grid">
                {/* Card 1: Total Users */}
                <div className="card-box card-total">
                    <h3 className="card-title">Total Users</h3>
                    <p className="card-value">{stats.totalUsers}</p>
                </div>
                
                {/* Card 2: Auto-Pay ON */}
                <div className="card-box card-success">
                    <h3 className="card-title">Auto-Pay ON</h3>
                    <p className="card-value">{stats.autoPayOn}</p>
                </div>
                
                {/* Card 3: Auto-Pay OFF */}
                <div className="card-box card-danger">
                    <h3 className="card-title">Auto-Pay OFF</h3>
                    <p className="card-value">{stats.autoPayOff}</p>
                </div>

                {/* Card 4: Estimated Monthly Revenue */}
                <div className="card-box card-revenue">
                    <h3 className="card-title">Est. Monthly Revenue (₹)</h3>
                    <p className="card-value">₹ {stats.estimatedMonthlyRevenue.toLocaleString('en-IN')}</p>
                    <p className="card-detail">Based on {stats.autoPayOn} active subscriptions.</p>
                </div>

                {/* Card 5: Upcoming Payments */}
                <div className="card-box card-upcoming">
                    <h3 className="card-title">Upcoming Payments (Next 30 Days)</h3>
                    <p className="card-value">{stats.upcomingPayments}</p>
                    <p className="card-detail">Est. Revenue: ₹ {stats.upcomingRevenue.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* List View: Who is subscribed */}
            <div style={{marginTop: '40px'}}>
                <h2 style={{borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px'}}>Subscription Status Detail</h2>
                {/* NOTE: For simplicity and large scale, we only show aggregated stats here. 
                   If you need the detailed list, you must fetch all users again in this component 
                   and render a table based on autoPayStatus. */}
                <p>Status data is aggregated above. Total Active: {stats.autoPayOn}.</p>
            </div>
        </div>
    );
}

export default PaymentAnalytics;
