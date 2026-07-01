'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Receipt,
  CheckCheck,
  Trash2,
  Bell,
  AlertTriangle,
  Clock3,
} from 'lucide-react';
import { makeAPI } from '@/lib/api';
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils';
import styles from './notifications.module.css';

const TABS = ['All', 'Unread', 'Bills', 'Alerts', 'Updates'];
const POLL_MS = 60_000;
const READ_KEY = 'finsmart.notifications.read';
const DISMISSED_KEY = 'finsmart.notifications.dismissed';

const NOTIF_ICONS = {
  overdue: {
    icon: <AlertTriangle size={20} />,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
  },
  dueSoon: {
    icon: <Clock3 size={20} />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  dueToday: {
    icon: <Receipt size={20} />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
  },
  empty: {
    icon: <Bell size={20} />,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
};

function loadIdSet(key) {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveIdSet(key, set) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify([...set]));
}

function buildBillNotifications(bills = []) {
  return bills
    .filter((bill) => bill && bill.is_active !== false)
    .map((bill) => {
      const days = daysUntil(bill.next_due_date);

      if (days > 3) return null;

      const overdue = days < 0;
      const dueToday = days === 0;
      const severity = overdue ? 'overdue' : dueToday ? 'dueToday' : 'dueSoon';
      const daysText = overdue
        ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
        : dueToday
          ? 'Due today'
          : `Due in ${days} day${days === 1 ? '' : 's'}`;

      return {
        id: `bill-${bill.id}`,
        category: 'bill',
        severity,
        title: overdue
          ? `${bill.name} is overdue`
          : dueToday
            ? `${bill.name} is due today`
            : `${bill.name} due soon`,
        body: overdue
          ? `${bill.name} was due on ${formatDate(bill.next_due_date)}. Pay ${formatCurrency(bill.amount)} to catch up.`
          : dueToday
            ? `${bill.name} is due today for ${formatCurrency(bill.amount)}.`
            : `${bill.name} is due in ${days} day${days === 1 ? '' : 's'}. Amount: ${formatCurrency(bill.amount)}.`,
        time: daysText,
        read: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const order = { overdue: 0, dueToday: 1, dueSoon: 2 };
      return order[a.severity] - order[b.severity];
    });
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  useEffect(() => {
    if (token) sessionStorage.setItem('token', token);
  }, [token]);

  useEffect(() => {
    setReadIds(loadIdSet(READ_KEY));
    setDismissedIds(loadIdSet(DISMISSED_KEY));
  }, []);

  useEffect(() => {
    saveIdSet(READ_KEY, readIds);
  }, [readIds]);

  useEffect(() => {
    saveIdSet(DISMISSED_KEY, dismissedIds);
  }, [dismissedIds]);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const api = makeAPI(token);
      const bills = await api.bills.list();
      const billList = bills.results || bills || [];
      setNotifications(buildBillNotifications(billList));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)),
    [notifications, dismissedIds]
  );

  const unreadCount = visibleNotifications.filter((n) => !readIds.has(n.id)).length;

  const filtered = visibleNotifications.filter((n) => {
    if (tab === 'Unread') return !readIds.has(n.id);
    if (tab === 'Bills') return n.category === 'bill';
    if (tab === 'Alerts') return n.category === 'alert';
    if (tab === 'Updates') return n.category === 'update';
    return true;
  });

  const markAllRead = () => setReadIds(new Set(visibleNotifications.map((n) => n.id)));
  const markRead = (id) => setReadIds((prev) => new Set([...prev, id]));
  const dismiss = (id) => setDismissedIds((prev) => new Set([...prev, id]));
  const clearAll = () => setDismissedIds(new Set(visibleNotifications.map((n) => n.id)));

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.heading}>Notifications</h2>
          <p className={styles.sub}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className={styles.actions}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          {visibleNotifications.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={clearAll}>
              <Trash2 size={15} /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="toggle-group" style={{ width: 'fit-content' }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`toggle-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'Unread' && unreadCount > 0 && (
              <span className={styles.tabBadge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className="glass-card-static">
            <div className="empty-state">
              <div className="empty-state-icon"><Bell size={28} /></div>
              <p className="empty-state-title">Refreshing notifications</p>
              <p className="empty-state-text">Checking your recurring bills for due and overdue payments.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card-static">
            <div className="empty-state">
              <div className="empty-state-icon"><Bell size={28} /></div>
              <p className="empty-state-title">No notifications</p>
              <p className="empty-state-text">Your recurring bills are all caught up right now.</p>
            </div>
          </div>
        ) : (
          filtered.map((n) => {
            const meta = NOTIF_ICONS[n.severity] || NOTIF_ICONS.empty;
            return (
              <div
                key={n.id}
                className={`${styles.item} ${!readIds.has(n.id) ? styles.unread : ''}`}
                onClick={() => markRead(n.id)}
              >
                {!readIds.has(n.id) && <div className={styles.unreadBar} />}

                <div className={styles.icon} style={{ background: meta.bg, color: meta.color }}>
                  {meta.icon}
                </div>

                <div className={styles.content}>
                  <div className={styles.title}>{n.title}</div>
                  <div className={styles.body}>{n.body}</div>
                  <div className={styles.time}>{n.time}</div>
                </div>

                <div className={styles.itemActions}>
                  {!readIds.has(n.id) && (
                    <button
                      className={styles.readBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                      title="Mark as read"
                    >
                      <CheckCheck size={15} />
                    </button>
                  )}
                  <button
                    className={styles.dismissBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                    title="Dismiss"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
