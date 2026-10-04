import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Youtube, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, Search, Tv, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';
import './ChannelManagement.css';

function ChannelManagement() {
  const [input, setInput] = useState('');
  const [previewChannel, setPreviewChannel] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [channelSource, setChannelSource] = useState('channel'); // New state for channel source

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 4000);
  };

  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    setError('');
    try {
      const response = await apiClient.get('/api/channels/admin/all');
      if (response.data.success) {
        setChannels(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch channels.');
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleResolve = async () => {
    if (!input.trim()) return;
    setResolveLoading(true);
    setPreviewChannel(null);
    setError('');
    try {
      const response = await apiClient.post('/api/channels/resolve', { input });
      if (response.data.success) {
        setPreviewChannel(response.data.data);
        if (response.data.data.isShortsOnly) {
          setChannelSource('shorts-only');
        } else {
          setChannelSource('channel');
        }
      } else {
        setError(response.data.message || 'Failed to resolve channel.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error resolving channel.');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!previewChannel) return;
    setAddLoading(true);
    setError('');
    try {
      const payload = {
        ...previewChannel,
        isShortsOnly: channelSource === 'shorts-only'
      };
      const response = await apiClient.post('/api/channels', payload);
      if (response.data.success) {
        showToast(response.data.message);
        setInput('');
        setPreviewChannel(null);
        setChannelSource('channel'); // Reset to default
        fetchChannels();
      } else {
        setError(response.data.message || 'Failed to add channel.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding channel.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (channelId, currentStatus) => {
    try {
      await apiClient.patch(`/api/channels/${channelId}/toggle`);
      showToast(`Channel status toggled to ${currentStatus ? 'Paused' : 'Active'}.`);
      fetchChannels();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle channel status.');
    }
  };

  const handleToggleLiveStatus = async (channelId, currentStatus) => {
    try {
      await apiClient.patch(`/api/channels/${channelId}/toggle-live`);
      showToast(`Live checking toggled to ${!currentStatus ? 'Enabled' : 'Disabled'}.`);
      fetchChannels();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle live checking status.');
    }
  };

  const handleManualSync = async (channelId) => {
    try {
      const response = await apiClient.post(`/api/channels/${channelId}/sync`);
      showToast(response.data.message);
      fetchChannels();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger manual sync.');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    try {
      await apiClient.delete(`/api/channels/${channelId}`);
      showToast('Channel and its videos deleted successfully.');
      setDeleteConfirmId(null);
      fetchChannels();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete channel.');
      setDeleteConfirmId(null);
    }
  };

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ch.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ch.youtubeChannelId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="channel-mgmt-container">
      <div className="mgmt-header">
        <h2>YouTube Channel Management</h2>
        <p>Add, manage, and sync YouTube channels to automatically import videos and track health.</p>
      </div>

      {toast.message && (
        <div className={`cm-toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}

      <div className="add-channel-card">
        <h3>Add New Channel</h3>
        {error && <p style={{ color: 'var(--cm-red)', background: 'var(--cm-red-soft)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{error}</p>}
        <div className="add-channel-form">
          <input
            type="text"
            className="channel-input"
            placeholder="Enter YouTube channel URL or @handle (e.g., @RCMIndia)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={handleResolve} disabled={resolveLoading || !input.trim()} className="primary-btn">
            {resolveLoading ? <RefreshCw size={18} className="spin-icon" /> : <Search size={18} />} Resolve
          </button>
        </div>

        {previewChannel && (
          <div className="preview-card">
            <div className="preview-info">
              <img src={previewChannel.logoUrl} alt="Channel Logo" className="preview-logo" />
              <div className="preview-details">
                <h4>{previewChannel.name}</h4>
                <p>{previewChannel.handle || `ID: ${previewChannel.youtubeChannelId}`}</p>
                <p>{previewChannel.itemCount} videos found in uploads playlist.</p>
                <div className="channel-source-toggle" style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={channelSource === 'shorts-only'}
                      onChange={(e) => setChannelSource(e.target.checked ? 'shorts-only' : 'channel')}
                    />
                    Shorts-only channel — hide from Channel section
                  </label>
                </div>
              </div>
            </div>
            <div className="preview-actions">
              <button onClick={() => setPreviewChannel(null)} className="secondary-btn">Cancel</button>
              <button onClick={handleAddChannel} disabled={addLoading} className="primary-btn">
                {addLoading ? <RefreshCw size={18} className="spin-icon" /> : <Plus size={18} />} Confirm & Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="channels-list-section">
        <h3>Existing Channels</h3>
        <div className="search-bar-container" style={{ marginBottom: '16px' }}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="channel-input"
            placeholder="Search existing channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loadingChannels ? (
          <p>Loading channels...</p>
        ) : filteredChannels.length === 0 ? (
          <p>No channels added yet or matching your search.</p>
        ) : (
          <div className="channels-table-wrapper">
            <table className="channels-table">
              <thead>
                <tr><th>Channel</th><th>Source</th><th>Sync Status</th><th>Last Synced</th><th>Live Opt-In</th><th>Videos</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredChannels.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <div className="channel-row-info">
                        <img src={ch.logoUrl} alt="Logo" className="table-logo" />
                        <div>
                          <div className="table-title">{ch.name}</div>
                          <div className="table-handle">{ch.handle || ch.youtubeChannelId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${ch.source === 'shorts-only' ? 'shorts-only' : 'channel'}`}>
                        {ch.source === 'shorts-only' ? 'Shorts Only' : 'Channel'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`status-badge ${ch.lastSyncStatus === 'error' ? 'error' : ch.lastSyncStatus === 'syncing' ? 'syncing' : ch.isActive ? 'active' : 'paused'}`}>
                          {ch.lastSyncStatus === 'error' ? 'Sync Error' : ch.lastSyncStatus === 'syncing' ? 'Syncing...' : ch.isActive ? 'Active (OK)' : 'Paused'}
                        </span>
                        {ch.lastSyncError && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--cm-red)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ch.lastSyncError}>
                            {ch.lastSyncError}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{ch.lastSyncedAt ? new Date(ch.lastSyncedAt).toLocaleString() : 'Never'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleLiveStatus(ch.id, ch.checkLiveStatus)}
                        className={`status-badge ${ch.checkLiveStatus ? 'active' : 'paused'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Toggle Live & Upcoming checks (Priority 4)"
                      >
                        {ch.checkLiveStatus ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>{ch.videoCount || 0}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleToggleActive(ch.id, ch.isActive)}
                          className="icon-btn"
                          title={ch.isActive ? 'Pause Sync' : 'Activate Sync'}
                        >
                          {ch.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => handleManualSync(ch.id)} className="icon-btn" title="Sync Now">
                          <RefreshCw size={18} />
                        </button>
                        {deleteConfirmId === ch.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => handleDeleteChannel(ch.id)} className="primary-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Confirm</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="secondary-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(ch.id)} className="icon-btn danger" title="Delete Channel">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChannelManagement;
