import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';
import axios from 'axios';
import apiClient from '../services/apiClient';
import {
  Instagram,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Users,
  Film,
  Search,
  Heart,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Check,
  Activity,
} from 'lucide-react';
import './InstagramReelsManagement.css';

const CATEGORIES = ['Motivation', 'Gentleman Grooming', 'Direct Selling'];
const PAGE_SIZE = 12;
const SINGLE_ID = 'none';
const RESERVED_PATHS = ['reel', 'reels', 'p', 'tv', 'explore', 'stories', 'accounts'];

// Dedicated scraper base URL (e.g. https://tablet.teamdekho.in), falling back to apiClient baseURL
const SCRAPER_BASE_URL =
  (process.env.REACT_APP_SCRAPER_URL || '').trim().replace(/\/+$/, '') ||
  (apiClient.defaults?.baseURL || '').trim().replace(/\/+$/, '');

function getAuthHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('adminToken') ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function scraperRequest(config) {
  if (!SCRAPER_BASE_URL) {
    return apiClient(config);
  }
  return axios({
    baseURL: SCRAPER_BASE_URL,
    withCredentials: true,
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...(config.headers || {}),
    },
  });
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fmtNum = (n) => compact.format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return 'Never';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtTimeOnly = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const isCanceled = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

function parseInput(raw) {
  const value = (raw || '').trim();
  if (!value) return { type: 'empty' };

  const reelMatch = value.match(/instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (reelMatch) return { type: 'reel', key: reelMatch[1], label: reelMatch[1] };

  const urlMatch = value.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  let username = urlMatch ? urlMatch[1] : value.replace(/^@/, '');
  username = username.split(/[/?#\s]/)[0];

  if (/^[A-Za-z0-9._]{1,30}$/.test(username) && !RESERVED_PATHS.includes(username.toLowerCase())) {
    return { type: 'account', key: username.toLowerCase(), label: username };
  }
  return { type: 'invalid' };
}

/* ---------------- Small pieces ---------------- */

const Switch = memo(function Switch({ on, onChange, labelOn, labelOff }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`igm-switch ${on ? 'is-on' : ''}`}
    >
      <span className="igm-switch-track" aria-hidden="true" />
      <span className="igm-switch-label">{on ? labelOn : labelOff}</span>
    </button>
  );
});

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="igm-thumb-empty" aria-hidden="true">
        <Film size={28} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/* ---------------- Account card ---------------- */

const AccountCard = memo(function AccountCard({
  acc,
  syncing,
  queued,
  syncDisabled,
  onOpen,
  onSync,
  onToggle,
  onDelete,
}) {
  const active = acc.isActive !== false;
  const status = String(acc.lastSyncStatus || acc.syncStatus || '').toUpperCase();
  const isZeroReels = (acc.reelsCount || 0) === 0;

  return (
    <article className={`igm-account ${active ? '' : 'is-off'} ${syncing ? 'is-syncing' : ''}`}>
      <button
        type="button"
        className="igm-account-open"
        onClick={() => onOpen(acc.id)}
        aria-label={`Manage reels of ${acc.username}`}
      >
        <div className="igm-account-top">
          <div className="igm-avatar" aria-hidden="true">
            {(acc.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="igm-account-id">
            <strong>{acc.name || acc.username}</strong>
            <span>@{acc.username}</span>
          </div>
          {syncing ? (
            <span className="igm-badge igm-badge-sync">Syncing</span>
          ) : queued ? (
            <span className="igm-badge igm-badge-warn">Queued</span>
          ) : status === 'FAILED' ? (
            <span className="igm-badge igm-badge-err">Failed</span>
          ) : isZeroReels ? (
            <span className="igm-badge igm-badge-warn">0 reels</span>
          ) : null}
          <ChevronRight size={18} className="igm-go" />
        </div>
        <div className="igm-account-meta">
          <span className="igm-chip">{acc.category || 'General'}</span>
          <span>
            <b>{acc.reelsCount || 0}</b> reels
          </span>
          {Number(acc.lastNewCount) > 0 && (
            <span className="igm-new-pill">+{acc.lastNewCount} new</span>
          )}
          <span className="igm-muted-sm">Synced {fmtDate(acc.lastSyncedAt)}</span>
        </div>
      </button>

      <div className="igm-account-actions">
        <Switch on={active} onChange={() => onToggle(acc.id)} labelOn="Active" labelOff="Inactive" />
        <div className="igm-row-gap">
          <button
            type="button"
            className={`igm-btn igm-btn-sm ${isZeroReels && !syncing ? 'igm-btn-primary' : 'igm-btn-ghost'}`}
            onClick={() => onSync(acc.id)}
            disabled={syncDisabled}
          >
            <RefreshCw size={14} className={syncing ? 'igm-spin' : ''} />
            {syncing ? 'Syncing…' : queued ? 'Queued' : isZeroReels ? 'Fetch reels' : 'Sync'}
          </button>
          <button
            type="button"
            className="igm-icon-btn igm-danger"
            onClick={() => onDelete(acc.id)}
            title="Remove account"
            aria-label={`Remove ${acc.username}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
});

/* ---------------- Reel card (inside drawer) ---------------- */

const ReelCard = memo(function ReelCard({
  reel,
  selectMode,
  selected,
  onSelect,
  onToggle,
  onDelete,
}) {
  const active = reel.isActive !== false;
  const link =
    reel.instagram?.embedUrl || `https://www.instagram.com/reel/${reel.shortcode || ''}/`;

  return (
    <article className={`igm-reel ${active ? '' : 'is-off'} ${selected ? 'is-selected' : ''}`}>
      <div
        className="igm-reel-thumb"
        onClick={selectMode ? () => onSelect(reel.id) : undefined}
        role={selectMode ? 'checkbox' : undefined}
        aria-checked={selectMode ? selected : undefined}
        tabIndex={selectMode ? 0 : undefined}
        onKeyDown={
          selectMode
            ? (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onSelect(reel.id);
                }
              }
            : undefined
        }
      >
        <Thumb src={reel.thumbnail} alt={reel.title || 'Instagram reel'} />
        <span className={`igm-pill ${active ? 'is-live' : 'is-hidden'}`}>
          {active ? 'Live' : 'Hidden'}
        </span>
        {selectMode && (
          <span className={`igm-check ${selected ? 'is-on' : ''}`} aria-hidden="true">
            {selected && <Check size={14} />}
          </span>
        )}
      </div>

      <div className="igm-reel-body">
        <h4 title={reel.title}>{reel.title || 'Instagram Reel'}</h4>
        <div className="igm-reel-stats">
          <span title="Likes">
            <Heart size={13} /> {fmtNum(reel.likesCount)}
          </span>
          <span title="Comments">
            <MessageCircle size={13} /> {fmtNum(reel.commentsCount)}
          </span>
        </div>

        {!selectMode && (
          <div className="igm-reel-actions">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="igm-icon-btn"
              title="Open on Instagram"
              aria-label="Open on Instagram"
            >
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              className="igm-icon-btn"
              onClick={() => onToggle(reel.id)}
              title={active ? 'Hide from feed' : 'Show in feed'}
              aria-label={active ? 'Hide from feed' : 'Show in feed'}
            >
              {active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              className="igm-icon-btn igm-danger"
              onClick={() => onDelete(reel.id)}
              title="Delete reel"
              aria-label="Delete reel"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

function ReelSkeletons() {
  return Array.from({ length: 6 }, (_, i) => (
    <div className="igm-reel igm-skeleton" key={i}>
      <div className="igm-reel-thumb" />
      <div className="igm-reel-body">
        <div className="igm-sk-line" />
        <div className="igm-sk-line short" />
      </div>
    </div>
  ));
}

/* ---------------- Drawer: all reels of one account ---------------- */

function ReelsDrawer({
  account,
  isSingle,
  syncing,
  syncDisabled,
  reloadSignal,
  onClose,
  onSync,
  onToggleAccount,
  onReelsRemoved,
  toast,
}) {
  const accountKey = isSingle ? SINGLE_ID : account.id;

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/admin/instagram/reels', {
        params: { page, limit: PAGE_SIZE, accountId: accountKey },
        signal: ctrl.signal,
      });
      if (res.data.success) {
        const list = res.data.data || [];
        if (list.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setReels(list);
        setTotalPages(res.data.totalPages || 1);
        setTotal(
          typeof res.data.total === 'number'
            ? res.data.total
            : typeof res.data.totalCount === 'number'
            ? res.data.totalCount
            : null
        );
        setLoadedOnce(true);
      }
    } catch (err) {
      if (isCanceled(err)) return;
      console.error('Failed to fetch reels:', err);
      setError('Could not load reels. Check your connection and press Refresh.');
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [page, accountKey]);

  useEffect(() => {
    load();
  }, [load, reloadSignal]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      abortRef.current?.abort();
    };
  }, [onClose]);

  const handleToggleReel = useCallback(
    async (id) => {
      const flip = (list) =>
        list.map((r) => (r.id === id ? { ...r, isActive: r.isActive === false } : r));
      setReels(flip);
      try {
        const res = await apiClient.patch(`/api/admin/instagram/reels/${id}/toggle`);
        if (!res.data.success) throw new Error('failed');
      } catch (err) {
        setReels(flip);
        toast(err.response?.data?.message || 'Could not change reel status.', 'error');
      }
    },
    [toast]
  );

  const handleDeleteReel = useCallback(
    async (id) => {
      if (!window.confirm('Delete this reel from the feed?')) return;
      try {
        const res = await apiClient.delete(`/api/admin/instagram/reels/${id}`);
        if (res.data.success) {
          toast('Reel deleted.');
          onReelsRemoved(1);
          setTotal((t) => (t == null ? t : Math.max(0, t - 1)));
          if (reels.length <= 1) {
            if (page > 1) setPage((p) => p - 1);
            else setReels([]);
          } else {
            setReels((list) => list.filter((r) => r.id !== id));
          }
        }
      } catch (err) {
        toast(err.response?.data?.message || 'Could not delete reel.', 'error');
      }
    },
    [reels.length, page, toast, onReelsRemoved]
  );

  const handleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allOnPageSelected = reels.length > 0 && reels.every((r) => selected.has(r.id));

  const handleSelectAll = () => {
    setSelected(allOnPageSelected ? new Set() : new Set(reels.map((r) => r.id)));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected reel${ids.length > 1 ? 's' : ''}?`)) return;
    setBusy(true);
    let done = 0;
    for (const id of ids) {
      try {
        const res = await apiClient.delete(`/api/admin/instagram/reels/${id}`);
        if (res.data.success) done += 1;
      } catch (err) {
        /* keep going */
      }
    }
    setBusy(false);
    if (done) onReelsRemoved(done);
    toast(
      done === ids.length ? `${done} reels deleted.` : `${done} of ${ids.length} reels deleted.`,
      done === ids.length ? 'success' : 'error'
    );
    exitSelectMode();
    load();
  };

  const active = isSingle ? true : account.isActive !== false;

  return (
    <div className="igm-drawer-root">
      <div className="igm-backdrop" onClick={onClose} />
      <aside
        className="igm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isSingle ? 'Single reels' : `Reels of ${account.username}`}
      >
        <header className="igm-drawer-head">
          <div className="igm-drawer-title">
            {isSingle ? (
              <span className="igm-logo igm-logo-sm">
                <Film size={20} />
              </span>
            ) : (
              <div className="igm-avatar" aria-hidden="true">
                {(account.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="igm-account-id">
              <strong>{isSingle ? 'Single reels' : account.name || account.username}</strong>
              {isSingle ? (
                <span>Reels added by link, not from an account</span>
              ) : (
                <a
                  href={`https://www.instagram.com/${account.username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{account.username} <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          <button type="button" className="igm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="igm-drawer-bar">
          {!isSingle ? (
            <div className="igm-row-gap">
              <Switch
                on={active}
                onChange={() => onToggleAccount(account.id)}
                labelOn="Account active"
                labelOff="Account inactive"
              />
              <button
                type="button"
                className="igm-btn igm-btn-ghost igm-btn-sm"
                onClick={() => onSync(account.id)}
                disabled={syncDisabled}
              >
                <RefreshCw size={14} className={syncing ? 'igm-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
          ) : (
            <span />
          )}

          <div className="igm-row-gap">
            <span className="igm-muted-sm">{total != null ? `${total} reels` : ''}</span>
            <button
              type="button"
              className="igm-btn igm-btn-ghost igm-btn-sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'igm-spin' : ''} /> Refresh
            </button>
            {!selectMode ? (
              <button
                type="button"
                className="igm-btn igm-btn-ghost igm-btn-sm"
                onClick={() => setSelectMode(true)}
                disabled={reels.length === 0}
              >
                Select
              </button>
            ) : (
              <button type="button" className="igm-btn igm-btn-ghost igm-btn-sm" onClick={exitSelectMode}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {selectMode && (
          <div className="igm-selectbar">
            <button type="button" className="igm-link-btn" onClick={handleSelectAll}>
              {allOnPageSelected ? 'Clear selection' : 'Select all on this page'}
            </button>
            <span>{selected.size} selected</span>
            <button
              type="button"
              className="igm-btn igm-btn-danger igm-btn-sm"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || busy}
            >
              <Trash2 size={14} /> {busy ? 'Deleting…' : 'Delete selected'}
            </button>
          </div>
        )}

        <div className="igm-drawer-body">
          {error ? (
            <div className="igm-empty igm-empty-error">{error}</div>
          ) : !loadedOnce && loading ? (
            <div className="igm-reels">
              <ReelSkeletons />
            </div>
          ) : reels.length === 0 ? (
            <div className="igm-empty">
              {isSingle
                ? 'No single reels yet. Paste a reel link above to add one.'
                : syncing
                ? 'Scraping reels in background… list will refresh automatically.'
                : 'No reels for this account yet. Press Fetch reels to scrape them.'}
            </div>
          ) : (
            <div className={`igm-reels ${loading ? 'is-loading' : ''}`}>
              {reels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  selectMode={selectMode}
                  selected={selected.has(reel.id)}
                  onSelect={handleSelect}
                  onToggle={handleToggleReel}
                  onDelete={handleDeleteReel}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="igm-pager" aria-label="Reels pages">
              <button
                type="button"
                className="igm-btn igm-btn-ghost igm-btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="igm-btn igm-btn-ghost igm-btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Main page ---------------- */

export default function InstagramReelsManagement() {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [queuedAccountIds, setQueuedAccountIds] = useState(() => new Set());
  const [accountQuery, setAccountQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [drawerReloadSignal, setDrawerReloadSignal] = useState(0);

  const [syncActivity, setSyncActivity] = useState({
    scraperEnabled: true,
    activeAccountId: null,
    activeUsername: null,
    status: 'idle',
    queuedCount: 0,
    currentProgress: { scroll: 0, maxScrolls: 0, scrapedCount: 0, mode: null },
    lastJob: null,
    logs: [],
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: '', type: 'success' }), 4500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fetchSyncActivity = useCallback(async () => {
    try {
      const res = await scraperRequest({
        method: 'GET',
        url: '/api/admin/instagram/sync/activity',
      });
      const act = res?.data?.data || res?.data;
      if (act && typeof act === 'object') {
        const mappedLogs = Array.isArray(act.recentLogs)
          ? act.recentLogs.slice(0, 8).map((l) => ({
              id: l.id,
              time: fmtTimeOnly(l.timestamp),
              text: l.message,
              tone:
                l.level === 'error'
                  ? 'err'
                  : l.level === 'success'
                  ? 'ok'
                  : l.level === 'progress'
                  ? 'sync'
                  : 'info',
            }))
          : [];

        setSyncActivity((prev) => ({
          scraperEnabled: act.scraperEnabled !== false,
          activeAccountId: act.activeAccountId ?? null,
          activeUsername: act.activeUsername ?? null,
          status: act.status || 'idle',
          queuedCount: Number(act.queuedCount || 0),
          currentProgress: act.currentProgress || prev.currentProgress,
          lastJob: act.lastJob || prev.lastJob,
          logs: mappedLogs.length > 0 ? mappedLogs : prev.logs,
        }));

        if (act.activeAccountId != null) {
          setSyncingAccountId(act.activeAccountId);
        } else if (act.status === 'idle') {
          setSyncingAccountId(null);
        }

        const qSet = new Set(
          Array.isArray(act.queuedItems)
            ? act.queuedItems.map((q) => String(q.accountId))
            : []
        );
        setQueuedAccountIds(qSet);
      }
    } catch (_) {
      // Optional endpoint; fallback to accounts polling
    }
  }, []);

  const fetchAccounts = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoadingAccounts(true);
      const res = await apiClient.get('/api/admin/instagram/accounts');
      if (res.data.success) {
        const list = res.data.data || [];
        setAccounts(list);
        const serverSyncing = list.find(
          (a) => String(a.lastSyncStatus || a.syncStatus || '').toUpperCase() === 'SYNCING'
        );
        if (serverSyncing) {
          setSyncingAccountId((cur) => cur ?? serverSyncing.id);
          setSyncActivity((prev) => ({
            ...prev,
            activeAccountId: prev.activeAccountId ?? serverSyncing.id,
            activeUsername: prev.activeUsername ?? serverSyncing.username,
            status: 'syncing',
          }));
        }
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch Instagram accounts:', err);
        showToast('Could not load accounts. Try Refresh.', 'error');
      }
    } finally {
      if (!silent) setLoadingAccounts(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAccounts();
    fetchSyncActivity();
  }, [fetchAccounts, fetchSyncActivity]);

  // Always poll activity lightly when syncing/queued; poll accounts every 2.5s while active
  useEffect(() => {
    const isBusy = syncActivity.status === 'syncing' || syncingAccountId != null || syncActivity.queuedCount > 0;
    if (!isBusy) return undefined;
    const timer = setInterval(() => {
      fetchSyncActivity();
      fetchAccounts({ silent: true });
    }, 2500);
    return () => clearInterval(timer);
  }, [syncActivity.status, syncActivity.queuedCount, syncingAccountId, fetchAccounts, fetchSyncActivity]);

  const parsed = useMemo(() => parseInput(inputUrl), [inputUrl]);

  const inputIssue = useMemo(() => {
    if (parsed.type === 'empty') return null;
    if (parsed.type === 'invalid') {
      return 'This does not look like an @username, profile link or reel link.';
    }
    if (parsed.type === 'account') {
      const exists = accounts.some((a) => (a.username || '').toLowerCase() === parsed.key);
      if (exists) return `@${parsed.label} is already connected. Tap it below to manage its reels.`;
    }
    return null;
  }, [parsed, accounts]);

  const canSubmit = parsed.type === 'account' || parsed.type === 'reel';

  const handleImport = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!canSubmit) {
      showToast('Enter an @username, profile link or reel URL.', 'error');
      return;
    }
    if (inputIssue) {
      showToast(inputIssue, 'error');
      return;
    }

    submittingRef.current = true;
    try {
      setSubmitting(true);
      const res = await scraperRequest({
        method: 'POST',
        url: '/api/admin/instagram/import',
        data: {
          input: inputUrl.trim(),
          category: selectedCategory,
        },
      });
      if (res.data.success) {
        const addedHandle = parsed.type === 'account' ? `@${parsed.label}` : `Reel ${parsed.label}`;
        showToast(res.data.message || `${addedHandle} added.`);
        setInputUrl('');
        await fetchAccounts({ silent: true });
        await fetchSyncActivity();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add this. Try again.', 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSyncAccount = useCallback(
    async (id) => {
      const target = accounts.find((a) => a.id === id);
      const handleLabel = target ? `@${target.username}` : `Account #${id}`;

      setSyncingAccountId(id);
      setSyncActivity((prev) => ({
        ...prev,
        activeAccountId: id,
        activeUsername: target?.username || String(id),
        status: 'syncing',
      }));

      try {
        const res = await scraperRequest({
          method: 'POST',
          url: `/api/admin/instagram/accounts/${id}/sync`,
        });
        if (res.data.success) {
          const data = res.data.data || res.data;
          const totalInDb = data.reelsCount ?? data.totalReels;
          const addedCount = data.newCount ?? data.createdCount ?? 0;

          showToast(
            totalInDb != null
              ? `${handleLabel} synced — ${totalInDb} reels in DB${addedCount ? ` (+${addedCount} new)` : ''}.`
              : `${handleLabel} sync completed.`
          );
          await fetchAccounts({ silent: true });
          await fetchSyncActivity();
          setDrawerReloadSignal((n) => n + 1);
        } else {
          throw new Error(res.data.message || 'Sync failed');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Sync failed.';
        showToast(msg, 'error');
        await fetchSyncActivity();
      } finally {
        setSyncingAccountId(null);
        setSyncActivity((prev) => ({
          ...prev,
          activeAccountId: null,
          activeUsername: null,
          status: 'idle',
        }));
      }
    },
    [accounts, fetchAccounts, fetchSyncActivity, showToast]
  );

  const handleToggleAccount = useCallback(
    async (id) => {
      const flip = (list) =>
        list.map((a) => (a.id === id ? { ...a, isActive: a.isActive === false } : a));
      setAccounts(flip);
      try {
        const res = await apiClient.patch(`/api/admin/instagram/accounts/${id}/toggle`);
        if (!res.data.success) throw new Error('failed');
      } catch (err) {
        setAccounts(flip);
        showToast(err.response?.data?.message || 'Could not change account status.', 'error');
      }
    },
    [showToast]
  );

  const handleDeleteAccount = useCallback(
    async (id) => {
      if (!window.confirm('Remove this account? Its reels stay in the feed unless you delete them.')) return;
      try {
        const res = await apiClient.delete(`/api/admin/instagram/accounts/${id}`);
        if (res.data.success) {
          setAccounts((list) => list.filter((a) => a.id !== id));
          setOpenId((cur) => (cur === id ? null : cur));
          showToast('Account removed.');
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Could not remove account.', 'error');
      }
    },
    [showToast]
  );

  const closeDrawer = useCallback(() => setOpenId(null), []);

  const handleReelsRemoved = useCallback(
    (count) => {
      if (!openId || openId === SINGLE_ID) return;
      setAccounts((list) =>
        list.map((a) =>
          a.id === openId ? { ...a, reelsCount: Math.max(0, (a.reelsCount || 0) - count) } : a
        )
      );
    },
    [openId]
  );

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.username || '').toLowerCase().includes(q) ||
        (a.name || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q)
    );
  }, [accounts, accountQuery]);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive !== false).length,
    [accounts]
  );
  const totalReels = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.reelsCount || 0), 0),
    [accounts]
  );
  const zeroReelAccounts = useMemo(
    () => accounts.filter((a) => (a.reelsCount || 0) === 0).length,
    [accounts]
  );

  const openAccount = useMemo(
    () => (openId && openId !== SINGLE_ID ? accounts.find((a) => a.id === openId) : null),
    [openId, accounts]
  );

  const prog = syncActivity.currentProgress || {};
  const lastJob = syncActivity.lastJob;

  return (
    <div className="igm">
      <div className="igm-toast-wrap" aria-live="polite">
        {toast.message && (
          <div className={`igm-toast igm-toast-${toast.type}`} role="status">
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </div>
        )}
      </div>

      <header className="igm-header">
        <span className="igm-logo">
          <Instagram size={26} />
        </span>
        <div>
          <h2>Instagram Reels</h2>
          <p>Add accounts, fetch reels for 0-reel accounts, and monitor sync progress.</p>
        </div>
      </header>

      <section className="igm-stats" aria-label="Summary">
        <div>
          <strong>{accounts.length}</strong>
          <span>Accounts</span>
        </div>
        <div>
          <strong>{activeAccounts}</strong>
          <span>Active ({zeroReelAccounts} with 0 reels)</span>
        </div>
        <div>
          <strong>{totalReels}</strong>
          <span>Reels from accounts</span>
        </div>
      </section>

      {(syncActivity.status === 'syncing' || lastJob || syncActivity.logs.length > 0) && (
        <section className="igm-card igm-monitor" aria-label="Sync activity">
          <div className="igm-monitor-head">
            <div className="igm-row-gap">
              <Activity size={18} className={syncActivity.status === 'syncing' ? 'igm-spin' : ''} />
              <h3>Sync Activity</h3>
              {syncActivity.status === 'syncing' && syncActivity.activeUsername ? (
                <span className="igm-badge igm-badge-sync">
                  Scraping @{syncActivity.activeUsername}
                  {prog.maxScrolls > 0 ? ` · Scroll ${prog.scroll}/${prog.maxScrolls}` : ''}
                  {prog.scrapedCount > 0 ? ` · ${prog.scrapedCount} found` : ''}
                </span>
              ) : (
                <span className="igm-badge">Idle</span>
              )}
              {syncActivity.queuedCount > 0 && (
                <span className="igm-badge igm-badge-warn">+{syncActivity.queuedCount} queued</span>
              )}
            </div>
            <button
              type="button"
              className="igm-link-btn"
              onClick={() => {
                fetchSyncActivity();
                fetchAccounts({ silent: true });
              }}
            >
              Refresh status
            </button>
          </div>

          {lastJob && syncActivity.status !== 'syncing' && (
            <p className="igm-muted" style={{ marginBottom: 8 }}>
              Last run (@{lastJob.username}): <b>{lastJob.scraped ?? 0}</b> found,{' '}
              <b>+{lastJob.created ?? 0}</b> new, <b>{lastJob.totalReels ?? 0}</b> total in DB (
              {lastJob.success ? 'Success' : lastJob.error || 'Failed'})
            </p>
          )}

          {syncActivity.logs.length > 0 && (
            <ul className="igm-activity-list">
              {syncActivity.logs.map((item) => (
                <li key={item.id} className={`igm-activity-item is-${item.tone}`}>
                  <span className="igm-activity-time">{item.time}</span>
                  <span className="igm-activity-text">{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Add */}
      <section className="igm-card">
        <h3>Add an account or reel</h3>
        <p className="igm-muted">
          Paste an @username or profile link to connect an account, or a reel link such as{' '}
          <code>instagram.com/reel/XXXX</code> to add one reel.
        </p>

        <form className="igm-form" onSubmit={handleImport} noValidate>
          <div className="igm-field igm-field-grow">
            <label htmlFor="igm-input">@username, profile link or reel link</label>
            <input
              id="igm-input"
              type="text"
              className={`igm-input ${inputIssue ? 'has-issue' : ''}`}
              placeholder="@username or https://www.instagram.com/reel/…"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
            />
          </div>

          <div className="igm-field">
            <label htmlFor="igm-category">Category</label>
            <select
              id="igm-category"
              className="igm-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={submitting}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="igm-btn igm-btn-primary igm-form-btn"
            disabled={submitting || !canSubmit || !!inputIssue}
          >
            <Plus size={18} />
            {submitting ? 'Adding…' : parsed.type === 'reel' ? 'Add reel' : 'Add account'}
          </button>
        </form>

        {inputIssue && (
          <p className="igm-issue" role="alert">
            <AlertCircle size={14} /> {inputIssue}
          </p>
        )}
        {!inputIssue && canSubmit && (
          <p className="igm-ok">
            <CheckCircle2 size={14} />
            {parsed.type === 'reel'
              ? `Reel ${parsed.label} will be added.`
              : `@${parsed.label} will be connected.`}
          </p>
        )}
      </section>

      {/* Accounts */}
      <section className="igm-section">
        <div className="igm-section-head">
          <h3>
            <Users size={20} /> Accounts <small>{accounts.length}</small>
          </h3>
          <div className="igm-tools">
            {accounts.length > 4 && (
              <label className="igm-search">
                <Search size={14} />
                <input
                  type="search"
                  placeholder="Search accounts"
                  value={accountQuery}
                  onChange={(e) => setAccountQuery(e.target.value)}
                />
              </label>
            )}
            <button
              type="button"
              className="igm-btn igm-btn-ghost igm-btn-sm"
              onClick={() => {
                fetchAccounts();
                fetchSyncActivity();
              }}
              disabled={loadingAccounts}
            >
              <RefreshCw size={14} className={loadingAccounts ? 'igm-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="igm-accounts">
          <button type="button" className="igm-account igm-single" onClick={() => setOpenId(SINGLE_ID)}>
            <span className="igm-logo igm-logo-sm">
              <Film size={20} />
            </span>
            <span className="igm-account-id">
              <strong>Single reels</strong>
              <span>Reels added by link</span>
            </span>
            <ChevronRight size={18} className="igm-go" />
          </button>

          {filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              acc={acc}
              syncing={syncingAccountId === acc.id}
              queued={queuedAccountIds.has(String(acc.id))}
              syncDisabled={syncingAccountId !== null}
              onOpen={setOpenId}
              onSync={handleSyncAccount}
              onToggle={handleToggleAccount}
              onDelete={handleDeleteAccount}
            />
          ))}
        </div>

        {loadingAccounts && accounts.length === 0 && <div className="igm-empty">Loading accounts…</div>}
        {!loadingAccounts && accounts.length === 0 && (
          <div className="igm-empty">No accounts yet. Paste an @username above to connect one.</div>
        )}
        {accounts.length > 0 && filteredAccounts.length === 0 && (
          <div className="igm-empty">No account matches “{accountQuery}”.</div>
        )}
      </section>

      {openId && (openId === SINGLE_ID || openAccount) && (
        <ReelsDrawer
          key={openId}
          account={openAccount}
          isSingle={openId === SINGLE_ID}
          syncing={syncingAccountId === openId}
          syncDisabled={syncingAccountId !== null}
          reloadSignal={drawerReloadSignal}
          onClose={closeDrawer}
          onSync={handleSyncAccount}
          onToggleAccount={handleToggleAccount}
          onReelsRemoved={handleReelsRemoved}
          toast={showToast}
        />
      )}
    </div>
  );
}