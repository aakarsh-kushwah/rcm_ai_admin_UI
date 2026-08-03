import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import AdminProtectedRoute from './components/AdminProtectedRoute';

import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import AdminManagement from './components/AdminManagement';
import SubscriberList from './components/SubscriberList';
import VideoManagement from './components/VideoManagement';
import VoiceTraining from './components/VoiceTraining';
import ChatViewer from './components/ChatViewer';
import SendNotification from './components/SendNotification';
import PaymentAnalytics from './components/PaymentAnalytics';
import UserChatHistory from './components/UserChatHistory';
import AdminSync from './components/AdminSync';

import AdminLoginPage from './components/AdminLoginPage';
import AdminSignupPage from './components/AdminSignupPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/signup" element={<AdminSignupPage />} />

      <Route
        path="/"
        element={
          <AdminProtectedRoute>
            <Layout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="subscribers" element={<SubscriberList />} />
        <Route path="videos" element={<VideoManagement />} />
        <Route path="voice-training" element={<VoiceTraining />} />
        <Route path="chats" element={<ChatViewer />} />
        <Route path="sendnotifications" element={<SendNotification />} />
        <Route path="sync" element={<AdminSync />} />

        {/* optional/secondary */}
        <Route path="payment-analytics" element={<PaymentAnalytics />} />
        <Route path="chat-history" element={<UserChatHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

