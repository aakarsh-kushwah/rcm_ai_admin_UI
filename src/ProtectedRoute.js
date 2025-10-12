import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        // अगर टोकन नहीं है, तो लॉगिन पेज पर वापस भेज दें
        return <Navigate to="/login" />;
    }

    // अगर टोकन है, तो डैशबोर्ड दिखाएँ
    return children;
};

export default ProtectedRoute;