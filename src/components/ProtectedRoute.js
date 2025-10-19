import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token'); // ✅ Using standardized 'token'
    const userRole = localStorage.getItem('userRole'); // Fetch the stored role

    // 1. Check for Authentication (Token)
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check for Authorization (Role)
    // Assuming protected routes are ONLY for ADMIN
    if (userRole !== 'ADMIN') {
        alert("Access Denied: Only Administrators can view this page.");
        return <Navigate to="/login" replace />; 
    }
    
    // If authenticated and authorized as ADMIN, grant access
    return children;
};

export default ProtectedRoute;