import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import AdminProtectedRoute from './components/AdminProtectedRoute';

import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import AdminManagement from './components/AdminManagement';
import VideoManagement from './components/VideoManagement';
import ChannelManagement from './components/ChannelManagement';
import ShortsManagement from './components/ShortsManagement';
import VoiceTraining from './components/VoiceTraining';
import InstagramReelsManagement from './components/InstagramReelsManagement';
import ChatViewer from './components/ChatViewer';
import SendNotification from './components/SendNotification';
import PaymentAnalytics from './components/PaymentAnalytics';
import UserChatHistory from './components/UserChatHistory';

import AdminLoginPage from './components/AdminLoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

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
        <Route path="videos" element={<VideoManagement />} />
        <Route path="channels" element={<ChannelManagement />} />
        <Route path="shorts" element={<ShortsManagement />} />
        <Route path="instagram" element={<InstagramReelsManagement />} />
        <Route path="voice-training" element={<VoiceTraining />} />
        <Route path="chats" element={<ChatViewer />} />
        <Route path="sendnotifications" element={<SendNotification />} />

        {/* optional/secondary */}
        <Route path="payment-analytics" element={<PaymentAnalytics />} />
        <Route path="chat-history" element={<UserChatHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

