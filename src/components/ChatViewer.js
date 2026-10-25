import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import apiClient from '../services/apiClient';
import {
    Search, ArrowLeft, ArrowDown, Loader2, MessageSquare,
    Users, Radio, Zap, Lock, Bot
} from 'lucide-react';
import './ChatViewer.css';

/*
  BACKEND (live data ke liye ek endpoint chahiye):

  GET /api/admin/chats/activity
  {
    "success": true,
    "summary": { "usersToday": 12, "messagesToday": 140, "tokensToday": 52000 },   // optional
    "data": [
      {
        "userId": 5,
        "lastMessageAt": "2026-10-23T10:15:00.000Z",
        "lastMessage": "text...",
        "lastSender": "USER",          // "USER" ya AI
        "messagesToday": 14,
        "tokensToday": 3200            // optional
      }
    ]
  }

  Sirf un users ko bhejo jinhone chat ki hai. Baaki users /api/admin/users se aate hain.
*/

const POLL_MS = 5000;
const USERS_REFRESH_MS = 120000;
const LIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minute me message aaya = "Live"
const PAGE_SIZE = 100;

/* ---------- helpers ---------- */
const toMs = (v) => {
    const t = v ? new Date(v).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
};

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const hueOf = (id) => {
    const s = String(id);
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
};

const clock = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const relTime = (ms, now) => {
    if (!ms) return '';
    const diff = now - ms;
    if (diff < 60 * 1000) return 'now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    if (ms >= startOfDay) return clock(ms);
    if (ms >= startOfDay - 24 * 60 * 60 * 1000) return 'Yesterday';
    return new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const dayLabel = (ms, now) => {
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    if (ms >= startOfDay) return 'Today';
    if (ms >= startOfDay - 24 * 60 * 60 * 1000) return 'Yesterday';
    return new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

const dayKey = (ms) => new Date(ms).toDateString();
const msgText = (m) => m.message || m.response || '';
const isUserMsg = (m) => m.sender === 'USER';

const useNow = (ms) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
};

// Tab chhupa ho to polling nahi karta (server load aur battery bachti hai)
const usePolling = (fn, ms, { enabled = true, immediate = true, resetKey = null } = {}) => {
    const saved = useRef(fn);
    useEffect(() => { saved.current = fn; }, [fn]);

    useEffect(() => {
        if (!enabled) return undefined;
        const run = () => { if (!document.hidden) saved.current(); };
        if (immediate) saved.current();
        const id = setInterval(run, ms);
        document.addEventListener('visibilitychange', run);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', run);
        };
    }, [ms, enabled, immediate, resetKey]);
};

const GROUP_LABEL = { live: 'Live now', today: 'Earlier today', earlier: 'Earlier', none: 'No chats yet' };

/* ---------- small components ---------- */
const Stat = ({ icon: Icon, label, value, tone, title }) => (
    <div className={`cv-stat ${tone || ''}`} title={title}>
        <div className="cv-stat-icon"><Icon size={18} /></div>
        <div className="cv-stat-text">
            <div className="cv-stat-value">{value}</div>
            <div className="cv-stat-label">{label}</div>
        </div>
    </div>
);

const Avatar = ({ user, live, size = '' }) => (
    <span className={`cv-avatar ${size}`} style={{ '--h': hueOf(user.id) }}>
        {(user.fullName || user.email || 'U')[0].toUpperCase()}
        {live && <i className="cv-avatar-live" />}
    </span>
);

/* ---------- main ---------- */
const ChatViewer = () => {
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    const [activity, setActivity] = useState({});
    const [summary, setSummary] = useState(null);
    const [activityError, setActivityError] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(0);

    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [newBelow, setNewBelow] = useState(0);

    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [mobileView, setMobileView] = useState('list');
    const [seen, setSeen] = useState({});

    const now = useNow(5000);

    const scrollRef = useRef(null);
    const selectedIdRef = useRef(null);
    const nearBottomRef = useRef(true);
    const prevLenRef = useRef(0);
    const baselineRef = useRef(Date.now());

    /* ----- data: users ----- */
    const fetchUsers = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/admin/users');
            if (res.data?.success && Array.isArray(res.data.data)) setUsers(res.data.data);
        } catch (err) {
            console.error('Fetch users error:', err.message);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    /* ----- data: live activity ----- */
    const fetchActivity = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/admin/chats/activity');
            if (res.data?.success && Array.isArray(res.data.data)) {
                const map = {};
                res.data.data.forEach((a) => {
                    map[String(a.userId)] = { ...a, lastMs: toMs(a.lastMessageAt) };
                });
                setActivity(map);
                setSummary(res.data.summary || null);
                setActivityError(false);
                setUpdatedAt(Date.now());
            } else {
                setActivityError(true);
            }
        } catch (err) {
            setActivityError(true);
        }
    }, []);

    /* ----- data: selected chat ----- */
    const loadChat = useCallback(async (id) => {
        try {
            const res = await apiClient.get(`/api/chat/history/${id}?page=1`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (selectedIdRef.current !== id) return; // user badal chuka hai
            if (res.data?.success && Array.isArray(res.data.data)) {
                const next = res.data.data;
                setMessages((prev) => {
                    const same = prev.length === next.length &&
                        (prev.length === 0 || prev[prev.length - 1].createdAt === next[next.length - 1].createdAt);
                    return same ? prev : next;
                });
            }
        } catch (err) {
            console.error('Chat fetch error:', err.message);
        }
    }, []);

    usePolling(fetchUsers, USERS_REFRESH_MS);
    usePolling(fetchActivity, POLL_MS);
    usePolling(() => loadChat(selectedIdRef.current), POLL_MS, {
        enabled: selectedId !== null,
        immediate: false,
        resetKey: selectedId
    });

    /* ----- merged rows ----- */
    const rows = useMemo(() => users.map((u) => {
        const a = activity[String(u.id)];
        return {
            user: u,
            lastMs: a ? a.lastMs : 0,
            lastMessage: a ? a.lastMessage || '' : '',
            lastSender: a ? a.lastSender : null,
            today: a ? a.messagesToday || 0 : 0,
            tokens: a && a.tokensToday != null ? a.tokensToday : null
        };
    }), [users, activity]);

    const startOfDay = useMemo(() => new Date(now).setHours(0, 0, 0, 0), [now]);

    const groupOf = useCallback((r) => {
        if (!r.lastMs) return 'none';
        if (now - r.lastMs <= LIVE_WINDOW_MS) return 'live';
        return r.lastMs >= startOfDay ? 'today' : 'earlier';
    }, [now, startOfDay]);

    const counts = useMemo(() => {
        const c = { live: 0, today: 0, earlier: 0, none: 0 };
        rows.forEach((r) => { c[groupOf(r)] += 1; });
        return c;
    }, [rows, groupOf]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows
            .filter((r) => {
                const g = groupOf(r);
                if (tab === 'live' && g !== 'live') return false;
                if (tab === 'today' && g !== 'live' && g !== 'today') return false;
                if (!term) return true;
                return (r.user.fullName || '').toLowerCase().includes(term) ||
                    (r.user.email || '').toLowerCase().includes(term);
            })
            .sort((a, b) => (b.lastMs - a.lastMs) ||
                (a.user.fullName || '').localeCompare(b.user.fullName || ''));
    }, [rows, tab, search, groupOf]);

    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, tab]);

    const visible = filtered.slice(0, visibleCount);

    /* ----- stats ----- */
    const usersToday = summary?.usersToday ?? (counts.live + counts.today);
    const messagesToday = summary?.messagesToday ?? rows.reduce((s, r) => s + r.today, 0);
    const hasTokens = summary?.tokensToday != null || rows.some((r) => r.tokens != null);
    const tokensToday = summary?.tokensToday ?? rows.reduce((s, r) => s + (r.tokens || 0), 0);

    /* ----- selection ----- */
    const selectedRow = rows.find((r) => String(r.user.id) === String(selectedId)) || null;

    const handleSelect = (user) => {
        selectedIdRef.current = user.id;
        nearBottomRef.current = true;
        prevLenRef.current = 0;
        setSelectedId(user.id);
        setMobileView('chat');
        setMessages([]);
        setNewBelow(0);
        setChatLoading(true);
        loadChat(user.id).finally(() => {
            if (selectedIdRef.current === user.id) setChatLoading(false);
        });
    };

    // Selected user ki nayi activity "seen" maan lo
    useEffect(() => {
        if (selectedRow && selectedRow.lastMs > (seen[selectedRow.user.id] || 0)) {
            setSeen((s) => ({ ...s, [selectedRow.user.id]: selectedRow.lastMs }));
        }
    }, [selectedRow, seen]);

    const isUnread = (r) => r.lastMs > Math.max(baselineRef.current, seen[r.user.id] || 0);

    /* ----- scrolling ----- */
    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        if (nearBottomRef.current) setNewBelow(0);
    };

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        setNewBelow(0);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const prev = prevLenRef.current;
        prevLenRef.current = messages.length;
        if (prev === 0 || nearBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        } else if (messages.length > prev) {
            setNewBelow((n) => n + messages.length - prev);
        }
    }, [messages]);

    /* ----- render ----- */
    const updatedSecs = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
    const selectedUser = selectedRow ? selectedRow.user : null;
    const selectedLive = selectedRow ? groupOf(selectedRow) === 'live' : false;

    let lastGroup = null;
    let lastDay = null;

    return (
        <div className={`cv-root ${mobileView === 'chat' ? 'is-chat' : ''}`}>
            {/* ===== Stats ===== */}
            <section className="cv-stats" aria-label="AI usage summary">
                <Stat icon={Radio} tone="live" label="Chatting now" value={counts.live} />
                <Stat icon={Users} label="Users today" value={usersToday} />
                <Stat icon={MessageSquare} label="Messages today" value={messagesToday} />
                <Stat
                    icon={Zap}
                    label="AI tokens today"
                    value={hasTokens ? compact.format(tokensToday) : '—'}
                    title={hasTokens ? '' : 'Backend se tokensToday aana baki hai'}
                />
            </section>

            <div className="cv-split">
                {/* ===== Conversation list ===== */}
                <aside className="cv-list">
                    <div className="cv-list-head">
                        <h2>Conversations</h2>
                        <span className={`cv-updated ${activityError ? 'is-error' : ''}`}>
                            <i className="cv-pulse" />
                            {activityError ? 'Live data unavailable' : updatedSecs === null ? 'Connecting...' : `Updated ${updatedSecs}s ago`}
                        </span>
                    </div>

                    <div className="cv-search">
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Search name or email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search users"
                        />
                    </div>

                    <div className="cv-tabs" role="tablist">
                        {[
                            ['all', 'All', rows.length],
                            ['live', 'Live', counts.live],
                            ['today', 'Today', counts.live + counts.today]
                        ].map(([key, label, n]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={tab === key}
                                className={`cv-tab ${tab === key ? 'is-active' : ''}`}
                                onClick={() => setTab(key)}
                            >
                                {label} <span>{n}</span>
                            </button>
                        ))}
                    </div>

                    <div className="cv-rows">
                        {usersLoading ? (
                            <div className="cv-empty"><Loader2 className="cv-spin" size={20} /> Loading users...</div>
                        ) : visible.length === 0 ? (
                            <div className="cv-empty">
                                {tab === 'live' ? 'Abhi koi user AI se baat nahi kar raha.' : 'Koi user nahi mila.'}
                            </div>
                        ) : (
                            visible.map((r) => {
                                const g = groupOf(r);
                                const header = g !== lastGroup ? (
                                    <div className="cv-group" key={`g-${g}`}>
                                        {GROUP_LABEL[g]} <span>{counts[g]}</span>
                                    </div>
                                ) : null;
                                lastGroup = g;

                                const active = String(selectedId) === String(r.user.id);
                                const unread = !active && isUnread(r);

                                return (
                                    <React.Fragment key={r.user.id}>
                                        {header}
                                        <button
                                            type="button"
                                            className={`cv-row ${active ? 'is-active' : ''} ${g === 'live' ? 'is-live' : ''}`}
                                            onClick={() => handleSelect(r.user)}
                                        >
                                            <Avatar user={r.user} live={g === 'live'} />
                                            <span className="cv-row-main">
                                                <span className="cv-row-top">
                                                    <span className="cv-name">{r.user.fullName || r.user.email || 'Unknown'}</span>
                                                    <span className={`cv-time ${unread ? 'is-unread' : ''}`}>{relTime(r.lastMs, now)}</span>
                                                </span>
                                                <span className="cv-row-bot">
                                                    <span className="cv-preview">
                                                        {r.lastMessage ? (
                                                            <>
                                                                <b>{r.lastSender === 'USER' ? 'User' : 'AI'}:</b> {r.lastMessage}
                                                            </>
                                                        ) : r.user.email}
                                                    </span>
                                                    {r.today > 0 && (
                                                        <span className="cv-badge" title="Messages today">{r.today}</span>
                                                    )}
                                                    {unread && <i className="cv-unread" aria-label="New activity" />}
                                                </span>
                                            </span>
                                        </button>
                                    </React.Fragment>
                                );
                            })
                        )}

                        {filtered.length > visibleCount && (
                            <button type="button" className="cv-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                                Show more ({filtered.length - visibleCount})
                            </button>
                        )}
                    </div>
                </aside>

                {/* ===== Chat panel ===== */}
                <section className="cv-chat">
                    {selectedUser ? (
                        <>
                            <header className="cv-chat-head">
                                <button type="button" className="cv-back" onClick={() => setMobileView('list')} aria-label="Back to list">
                                    <ArrowLeft size={22} />
                                </button>
                                <Avatar user={selectedUser} live={selectedLive} size="is-lg" />
                                <div className="cv-chat-title">
                                    <h3>{selectedUser.fullName || selectedUser.email}</h3>
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="cv-chat-pills">
                                    {selectedLive ? (
                                        <span className="cv-pill is-live"><i className="cv-pulse" /> Live</span>
                                    ) : selectedRow && selectedRow.lastMs ? (
                                        <span className="cv-pill">Last active {relTime(selectedRow.lastMs, now)}</span>
                                    ) : null}
                                    {selectedRow && selectedRow.tokens != null && (
                                        <span className="cv-pill" title="AI tokens used today">
                                            <Zap size={13} /> {compact.format(selectedRow.tokens)}
                                        </span>
                                    )}
                                </div>
                            </header>

                            <div className="cv-messages" ref={scrollRef} onScroll={onScroll}>
                                {chatLoading ? (
                                    <div className="cv-empty"><Loader2 className="cv-spin" size={20} /> Loading chat...</div>
                                ) : messages.length ? (
                                    messages.map((msg, i) => {
                                        const ai = !isUserMsg(msg);
                                        const ms = toMs(msg.createdAt);
                                        const sep = ms && dayKey(ms) !== lastDay ? (
                                            <div className="cv-day" key={`d-${i}`}><span>{dayLabel(ms, now)}</span></div>
                                        ) : null;
                                        if (ms) lastDay = dayKey(ms);

                                        return (
                                            <React.Fragment key={msg.id || i}>
                                                {sep}
                                                <div className={`cv-msg ${ai ? 'is-ai' : 'is-user'}`}>
                                                    <div className="cv-bubble">
                                                        <div className="cv-sender">
                                                            {ai ? <><Bot size={13} /> AI Assistant</> : (selectedUser.fullName || 'User')}
                                                        </div>
                                                        <div className="cv-text">{msgText(msg)}</div>
                                                        {ms > 0 && <div className="cv-meta">{clock(ms)}</div>}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <div className="cv-empty"><Lock size={18} /> Is user ki koi conversation nahi mili.</div>
                                )}
                            </div>

                            {newBelow > 0 && (
                                <button type="button" className="cv-newmsg" onClick={scrollToBottom}>
                                    <ArrowDown size={16} /> {newBelow} new {newBelow === 1 ? 'message' : 'messages'}
                                </button>
                            )}

                            <div className="cv-readonly">
                                <Lock size={15} /> Read-only admin view
                            </div>
                        </>
                    ) : (
                        <div className="cv-welcome">
                            <MessageSquare size={40} />
                            <h2>Select a conversation</h2>
                            <p>Left list me jo user AI se abhi baat kar rahe hain wo sabse upar dikhte hain.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ChatViewer;