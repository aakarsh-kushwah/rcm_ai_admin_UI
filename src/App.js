import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Admin Component Imports ---
import AdminLayout from './components/Layout';              
import AdminDashboard from './components/AdminDashboard';   
import AdminProtectedRoute from './components/AdminProtectedRoute'; // Assuming your corrected file name
import UserManagement from './components/UserManagement';
import AdminManagement from './components/AdminManagement'; // ✅ NEW IMPORT
import SubscriberList from './components/SubscriberList';
import ChatViewer from './components/ChatViewer'; 
import UserChatHistory from './components/UserChatHistory';
import VideoManagement from './components/VideoManagement'; 
import AdminSignupPage from './components/AdminSignupPage';
import LoginPage from './components/LoginPage'; // Assuming Admin UI has its own Login

function App() {
  return (
    <Routes>
      
      {/* Public Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/signup" element={<AdminSignupPage />} /> 

      {/* ADMIN PROTECTED ROUTES */}
      <Route 
        path="/"
        element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>} 
      >
        <Route index element={<AdminDashboard />} />          
        <Route path="dashboard" element={<AdminDashboard />} /> 

        {/* Management Sections */}
        <Route path="users" element={<UserManagement />} />      
        <Route path="admins" element={<AdminManagement />} /> {/* ✅ NEW ROUTE DEFINITION */}
        <Route path="users/:userId/chats" element={<UserChatHistory />} />
        <Route path="subscribers" element={<SubscriberList />} />
        <Route path="videos" element={<VideoManagement />} />
        <Route path="chats" element={<ChatViewer />} />
        
      </Route>
      
      <Route path="*" element={<h1>404: Page Not Found</h1>} />
    </Routes>
  );
}

export default App;