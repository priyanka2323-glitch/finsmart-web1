'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import {
  User, Mail, Calendar, Shield, Download, Trash2,
  Bell, TrendingDown, Receipt, TrendingUp, Zap, FileText,
  CheckCircle2, LogOut, Loader2,
} from 'lucide-react';
import { makeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import styles from './profile.module.css';

const NOTIF_PREFS_DEFAULT = {
  overspend: true,
  bill:      true,
  savings:   true,
  update:    false,
  report:    true,
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const user  = session?.user;

  const [stats,      setStats]      = useState(null);
  const [prefs,      setPrefs]      = useState(NOTIF_PREFS_DEFAULT);
  const [deleting,   setDeleting]   = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  useEffect(() => {
    if (!token) return;
    const api = makeAPI(token);
    const now = new Date();
    Promise.all([
      api.reports.monthly({ month: now.getMonth() + 1, year: now.getFullYear() }),
      api.reports.yearly({ year: now.getFullYear() }),
    ]).then(([monthly, yearly]) => {
      setStats({ monthly, yearly });
    }).catch(console.error);

    // Load saved prefs from localStorage
    const saved = localStorage.getItem('notif_prefs');
    if (saved) setPrefs(JSON.parse(saved));
  }, [token]);

  const handlePrefChange = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem('notif_prefs', JSON.stringify(updated));
    setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 2000);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const api = makeAPI(token);
      const now = new Date();
      const data = await api.reports.yearly({ year: now.getFullYear() });
      const csv = [
        'Month,Income,Expense,Savings',
        ...(data.monthly_data || []).map(m =>
          `${m.month_name},${m.income},${m.expense},${m.savings}`
        ),
        `TOTAL,${data.summary.total_income},${data.summary.total_expense},${data.summary.total_savings}`,
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `finsmart-${now.getFullYear()}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all data. Are you sure?')) return;
    if (!confirm('Last chance — this cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await signOut({ callbackUrl: '/' });
    } catch (e) {
      alert('Failed to delete account: ' + e.message);
      setDeleting(false);
    }
  };

  const joinedDate = user?.email
    ? 'June 2026'
    : '—';

  const notifItems = [
    { key:'overspend', Icon:TrendingDown, color:'var(--expense)',        label:'Overspending Alerts',   desc:'When you exceed 80% of a category budget' },
    { key:'bill',      Icon:Receipt,      color:'var(--warning)',        label:'Bill Reminders',         desc:'3 days before a recurring bill is due' },
    { key:'savings',   Icon:TrendingUp,   color:'var(--income)',         label:'Savings Milestones',     desc:'When you hit savings rate goals' },
    { key:'report',    Icon:FileText,     color:'var(--text-secondary)', label:'Monthly Report Ready',   desc:'When your monthly summary is available' },
    { key:'update',    Icon:Zap,          color:'var(--savings)',        label:'App Updates & Tips',     desc:'New features and financial tips' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.grid}>

        {/* ── Left column ── */}
        <div className={styles.left}>

          {/* Profile card */}
          <div className="glass-card-static">
            <div className={styles.profileTop}>
              {user?.image ? (
                <Image src={user.image} alt={user.name||'User'} width={80} height={80} className={styles.profileImg}/>
              ) : (
                <div className={styles.profileAvatar}><User size={36}/></div>
              )}
              <div>
                <div className={styles.profileName}>{user?.name || user?.username || 'User'}</div>
                <div className={styles.profileBadge}>
                  <Shield size={12}/> FinSmart Member
                </div>
              </div>
            </div>

            <div className={styles.profileFields}>
              <div className={styles.profileField}>
                <Mail size={15} className={styles.fieldIcon}/>
                <div>
                  <div className={styles.fieldLabel}>Email</div>
                  <div className={styles.fieldValue}>{user?.email || '—'}</div>
                </div>
              </div>
              <div className={styles.profileField}>
                <User size={15} className={styles.fieldIcon}/>
                <div>
                  <div className={styles.fieldLabel}>Username</div>
                  <div className={styles.fieldValue}>{user?.username || user?.name || '—'}</div>
                </div>
              </div>
              <div className={styles.profileField}>
                <Calendar size={15} className={styles.fieldIcon}/>
                <div>
                  <div className={styles.fieldLabel}>Joined</div>
                  <div className={styles.fieldValue}>{joinedDate}</div>
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width:'100%', marginTop:16 }}
              onClick={() => signOut({ callbackUrl:'/login' })}
            >
              <LogOut size={15}/> Sign Out
            </button>
          </div>

          {/* Financial summary */}
          {stats && (
            <div className="glass-card-static">
              <h3 className={styles.sectionTitle}>This Month</h3>
              <div className={styles.statsList}>
                {[
                  { label:'Income',      value:formatCurrency(stats.monthly?.summary?.total_income),  color:'var(--income)'  },
                  { label:'Expenses',    value:formatCurrency(stats.monthly?.summary?.total_expense), color:'var(--expense)' },
                  { label:'Savings',     value:formatCurrency(stats.monthly?.summary?.savings),       color:'var(--savings)' },
                  { label:'Savings Rate',value:`${stats.monthly?.summary?.savings_rate ?? 0}%`,       color:'var(--accent-light)' },
                ].map(s => (
                  <div key={s.label} className={styles.statsRow}>
                    <span className={styles.statsLabel}>{s.label}</span>
                    <span className={styles.statsValue} style={{ color:s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className={styles.right}>

          {/* Notification preferences */}
          <div className="glass-card-static">
            <div className={styles.cardHeader}>
              <h3 className={styles.sectionTitle}><Bell size={16}/> Email Notification Preferences</h3>
              {savedPrefs && (
                <span className={styles.savedBadge}><CheckCircle2 size={13}/> Saved</span>
              )}
            </div>
            <p className={styles.sectionDesc}>Choose which alerts you receive by email.</p>

            <div className={styles.prefList}>
              {notifItems.map(({ key, Icon, color, label, desc }) => (
                <div key={key} className={styles.prefItem}>
                  <div className={styles.prefIcon} style={{ background:`${color}18`, color }}>
                    <Icon size={16}/>
                  </div>
                  <div className={styles.prefText}>
                    <div className={styles.prefLabel}>{label}</div>
                    <div className={styles.prefDesc}>{desc}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={prefs[key]}
                    className={`${styles.toggle} ${prefs[key] ? styles.toggleOn : ''}`}
                    onClick={() => handlePrefChange(key)}
                  >
                    <span className={styles.toggleThumb}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Export & Danger */}
          <div className="glass-card-static">
            <h3 className={styles.sectionTitle}>Data & Account</h3>

            <div className={styles.actionList}>
              <div className={styles.actionItem}>
                <div>
                  <div className={styles.actionLabel}>Export Data</div>
                  <div className={styles.actionDesc}>Download your transactions as a CSV file</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 size={14} className="animate-spin"/> : <><Download size={14}/> Export CSV</>}
                </button>
              </div>

              <div className={styles.divider}/>

              <div className={styles.actionItem}>
                <div>
                  <div className={styles.actionLabel} style={{ color:'var(--expense)' }}>Delete Account</div>
                  <div className={styles.actionDesc}>Permanently delete your account and all data</div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin"/> : <><Trash2 size={14}/> Delete</>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
