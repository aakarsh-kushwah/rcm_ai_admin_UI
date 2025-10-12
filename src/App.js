import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminDashboard from './AdminDashboard';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      {/* डिफ़ॉल्ट रूप से लॉगिन पेज पर भेजें */}
      <Route path="*" element={<LoginPage />} /> 
    </Routes>
  );
}

export default App;