import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';
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
} from 'lucide-react';
import './InstagramReelsManagement.css';

const CATEGORIES = ['Motivation', 'Gentleman Grooming', 'Direct Selling'];
const PAGE_SIZE = 12;
const SINGLE_ID = 'none'; // reels that were added by URL and do not belong to an account
const RESERVED_PATHS = ['reel', 'reels', 'p', 'tv', 'explore', 'stories', 'accounts'];

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

const isCanceled = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

/** Understands @username, profile links and reel links. */
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

/* ---------------- Account card (tap to open its reels) ---------------- */

const AccountCard = memo(function AccountCard({
  acc,
  syncing,
  syncDisabled,
  onOpen,
  onSync,
  onToggle,
  onDelete,
}) {
  const active = acc.isActive !== false;
  return (
    <article className={`igm-account ${active ? '' : 'is-off'}`}>
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
          <ChevronRight size={18} className="igm-go" />
        </div>
        <div className="igm-account-meta">
          <span className="igm-chip">{acc.category || 'General'}</span>
          <span>
            <b>{acc.reelsCount || 0}</b> reels
          </span>
          <span className="igm-muted-sm">Synced {fmtDate(acc.lastSyncedAt)}</span>
        </div>
      </button>

      <div className="igm-account-actions">
        <Switch on={active} onChange={() => onToggle(acc.id)} labelOn="Active" labelOff="Inactive" />
        <div className="igm-row-gap">
          <button
            type="button"
            className="igm-btn igm-btn-ghost igm-btn-sm"
            onClick={() => onSync(acc.id)}
            disabled={syncDisabled}
          >
            <RefreshCw size={14} className={syncing ? 'igm-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync'}
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
          setPage(page - 1); // last page became empty after deletes
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
  }, [load]);

  // Esc closes, page behind stops scrolling, request is cancelled on close
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
            else {
              setReels([]);
            }
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

  // One delete at a time, so a big selection never hits the server all at once.
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
        /* keep going, report at the end */
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
                : 'No reels for this account yet. Press Sync now to fetch them.'}
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
  // Add form
  const [inputUrl, setInputUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [accountQuery, setAccountQuery] = useState('');
  const [openId, setOpenId] = useState(null); // account id, SINGLE_ID, or null

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const res = await apiClient.get('/api/admin/instagram/accounts');
      if (res.data.success) setAccounts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch Instagram accounts:', err);
      showToast('Could not load accounts. Try Refresh.', 'error');
    } finally {
      setLoadingAccounts(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  /* ----- Duplicate check while typing ----- */

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

  /* ----- Actions ----- */

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
      const res = await apiClient.post('/api/admin/instagram/import', {
        input: inputUrl.trim(),
        category: selectedCategory,
      });
      if (res.data.success) {
        showToast(res.data.message || 'Added successfully.');
        setInputUrl('');
        fetchAccounts();
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
      try {
        setSyncingAccountId(id);
        const res = await apiClient.post(`/api/admin/instagram/accounts/${id}/sync`);
        if (res.data.success) {
          showToast('Account synced. Press Refresh in the reels list to see new reels.');
          fetchAccounts();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Sync failed.', 'error');
      } finally {
        setSyncingAccountId(null);
      }
    },
    [fetchAccounts, showToast]
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

  // keeps the "N reels" number on the card correct after deletes, without refetching
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

  /* ----- Derived ----- */

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

  const openAccount = useMemo(
    () => (openId && openId !== SINGLE_ID ? accounts.find((a) => a.id === openId) : null),
    [openId, accounts]
  );

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
          <p>Add accounts, then tap an account to manage its reels.</p>
        </div>
      </header>

      <section className="igm-stats" aria-label="Summary">
        <div>
          <strong>{accounts.length}</strong>
          <span>Accounts</span>
        </div>
        <div>
          <strong>{activeAccounts}</strong>
          <span>Active</span>
        </div>
        <div>
          <strong>{totalReels}</strong>
          <span>Reels from accounts</span>
        </div>
      </section>

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
              onClick={fetchAccounts}
              disabled={loadingAccounts}
            >
              <RefreshCw size={14} className={loadingAccounts ? 'igm-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="igm-accounts">
          {/* Reels that were added by link */}
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