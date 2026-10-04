import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { Film, Trash2, ToggleLeft, ToggleRight, Search, RefreshCw, Plus } from 'lucide-react';
import './ChannelManagement.css';

function ShortsManagement() {
  const [shorts, setShorts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  const fetchChannels = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/channels/admin/all');
      if (res.data.success) {
        setChannels(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch channels for filter');
    }
  }, []);

  const fetchShorts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/admin/shorts?page=${page}&limit=15`;
      if (selectedChannelId) url += `&channelId=${selectedChannelId}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await apiClient.get(url);
      if (res.data.success) {
        setShorts(res.data.data);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch shorts.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedChannelId, searchTerm]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  const handleToggleShortsOnly = async (channelId, currentStatus) => {
    try {
      await apiClient.patch(`/api/admin/channels/${channelId}/toggle-shorts-only`);
      showToast(`Channel shorts-only status updated.`);
      fetchChannels();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update channel shorts-only status.', 'error');
    }
  };

  const handleToggleVideoShort = async (videoId) => {
    try {
      await apiClient.patch(`/api/admin/videos/${videoId}/toggle-short`);
      showToast('Video short status toggled.');
      fetchShorts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle short status.', 'error');
    }
  };

  const handleDeleteShort = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this short?')) return;
    try {
      await apiClient.delete(`/api/admin/shorts/${videoId}`);
      showToast('Short deleted successfully.');
      fetchShorts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete short.', 'error');
    }
  };

  const handleImportShort = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const res = await apiClient.post('/api/admin/shorts/import-single', { videoUrl: importUrl.trim() });
      if (res.data.success) {
        showToast(res.data.message || 'Import completed successfully.');
        setImportUrl('');
        if (page === 1) {
          fetchShorts();
        } else {
          setPage(1);
        }
        fetchChannels();
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.message || 'Failed to import short.', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="channel-mgmt-container">
      <div className="mgmt-header">
        <h2>Shorts & Admin Isolation</h2>
        <p>Manage vertical short-form videos, channel shorts-only toggles, and content curation.</p>
      </div>

      {toast.message && (
        <div className={`cm-toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}

      {/* Import Single Short by URL Card */}
      <div className="add-channel-card" style={{ marginBottom: '24px' }}>
        <h3>Import Single YouTube Short by URL</h3>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="channel-input"
            style={{ flex: 1, minWidth: '280px' }}
            placeholder="Paste YouTube Short URL (e.g. https://youtube.com/shorts/...)"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
          />
          <button
            onClick={handleImportShort}
            className="primary-btn"
            disabled={importing || !importUrl.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> {importing ? 'Importing...' : 'Import Short'}
          </button>
        </div>
      </div>

      {/* Channels Shorts-Only Isolation Section */}
      <div className="add-channel-card" style={{ marginBottom: '24px' }}>
        <h3>Channels Shorts Isolation Settings</h3>
        <div className="w-full overflow-x-auto" style={{ marginTop: '12px' }}>
          <table className="channels-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Shorts Only Mode</th>
                <th>Shorts Count</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(ch => (
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
                    <button
                      onClick={() => handleToggleShortsOnly(ch.id, ch.isShortsOnly)}
                      className="icon-btn"
                      title={ch.isShortsOnly ? 'Disable Shorts Only' : 'Enable Shorts Only'}
                    >
                      {ch.isShortsOnly ? <ToggleRight size={24} color="#0071e3" /> : <ToggleLeft size={24} color="#888" />}
                      <span style={{ marginLeft: '8px', fontWeight: '500' }}>{ch.isShortsOnly ? 'Shorts Only' : 'Standard'}</span>
                    </button>
                  </td>
                  <td>{ch.shortsCount || ch.shorts_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shorts Videos Management */}
      <div className="channels-list-section">
        <h3>Shorts Video Stream Management</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="search-bar-container" style={{ flex: 1, minWidth: '250px', margin: 0 }}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="channel-input"
              placeholder="Search shorts by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="channel-input"
            style={{ flex: '0 0 220px', background: '#222', color: '#fff', border: '1px solid #333' }}
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
          >
            <option value="">All Channels</option>
            {channels.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading shorts...</p>
        ) : error ? (
          <p style={{ color: 'var(--cm-red)' }}>{error}</p>
        ) : shorts.length === 0 ? (
          <p>No shorts found matching filters.</p>
        ) : (
          <>
            <div className="w-full overflow-x-auto" style={{ minHeight: "200px" }}>
              <table className="channels-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Channel</th>
                    <th>Likes / Comments</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shorts.map(short => {
                    const thumb = short.thumbnailUrl || (short.youtubeVideoId ? `https://i.ytimg.com/vi/${short.youtubeVideoId}/hqdefault.jpg` : '');
                    const channelName = short.channel?.name || short.channelTitle || short.channelName || 'N/A';
                    const videoLink = short.youtubeVideoId ? `https://www.youtube.com/shorts/${short.youtubeVideoId}` : null;

                    return (
                      <tr key={short.id}>
                        <td style={{ width: '80px', minWidth: '80px' }}>
                          {videoLink ? (
                            <a href={videoLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                              <img
                                src={thumb}
                                alt={short.title || "Short"}
                                style={{ width: '60px', height: '90px', minWidth: '60px', minHeight: '90px', objectFit: 'cover', borderRadius: '6px', display: 'block', background: '#222' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  if (short.youtubeVideoId && !e.target.src.includes('hqdefault.jpg')) {
                                    e.target.src = `https://i.ytimg.com/vi/${short.youtubeVideoId}/hqdefault.jpg`;
                                  } else {
                                    e.target.src = '';
                                  }
                                }}
                              />
                            </a>
                          ) : (
                            <img
                              src={thumb}
                              alt={short.title || "Short"}
                              style={{ width: '60px', height: '90px', minWidth: '60px', minHeight: '90px', objectFit: 'cover', borderRadius: '6px', display: 'block', background: '#222' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                          )}
                        </td>
                        <td>
                          {videoLink ? (
                            <a
                              href={videoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-title"
                              style={{ maxWidth: '300px', display: 'block', whiteSpace: 'normal', color: 'inherit', textDecoration: 'none' }}
                            >
                              {short.title || 'Untitled Short'}
                            </a>
                          ) : (
                            <div className="table-title" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                              {short.title || 'Untitled Short'}
                            </div>
                          )}
                        </td>
                        <td>{channelName}</td>
                        <td>❤️ {short.likesCount || short.likeCount || 0} | 💬 {short.commentsCount || short.commentCount || 0}</td>
                        <td>{short.publishedAt ? new Date(short.publishedAt).toLocaleDateString() : ''}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleToggleVideoShort(short.id)}
                              className="secondary-btn"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              title="Unmark as Short"
                            >
                              Remove Short Flag
                            </button>
                            <button
                              onClick={() => handleDeleteShort(short.id)}
                              className="icon-btn danger"
                              title="Delete Short"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
              <button
                className="secondary-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                Page {page} of {totalPages || 1}
              </span>
              <button
                className="secondary-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShortsManagement;
