// src/components/AdminProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    // Standardized token और role का उपयोग करें
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole'); 
    
    // 1. Authentication चेक
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    
    // 2. Authorization चेक: केवल ADMIN role को अनुमति दें
    if (userRole !== 'ADMIN') {
        alert("Access Denied: Only Administrators can view this page.");
        // Non-admin users को हटा दें
        return <Navigate to="/login" replace />; 
    }

    // अगर authenticated और authorized हैं, तो children (Layout) को render करें
    return children;
};

export default AdminProtectedRoute;