'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt, ChevronRight, CalendarDays, AlertTriangle, Send, Loader2, MessageCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { makeAPI } from '@/lib/api';
import { formatCurrency, getGreeting, CHART_COLORS } from '@/lib/utils';
import Link from 'next/link';
import styles from './dashboard.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;
  const now = new Date();
  const [monthly, setMonthly] = useState(null);
  const [yearly, setYearly] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) sessionStorage.setItem('token', token);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const api = makeAPI(token);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    Promise.all([
      api.reports.monthly({ month, year }),
      api.reports.yearly({ year }),
      api.bills.upcoming(),
      api.transactions.list({ month, year }),
      api.reports.anomalies().catch(() => ({ anomalies: [] })),
    ])
      .then(([m, y, b, tx, anom]) => {
        setMonthly(m);
        setYearly(y);
        setUpcomingBills((Array.isArray(b) ? b : b.results || []).slice(0, 4));
        setRecentTx((Array.isArray(tx) ? tx : tx.results || []).slice(0, 5));
        setAnomalies(anom?.anomalies || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    
    try {
      const resp = await makeAPI(token).reports.aiChat(userMsg);
      setChatMessages(prev => [...prev, { role: 'assistant', content: resp.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingGrid}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }

  const summary = monthly?.summary || {};
  const yearlyData = yearly?.monthly_data || [];
  const categoryData = (monthly?.category_breakdown || []).slice(0, 6);

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <div>
          <h2 className={styles.greetTitle}>
            {getGreeting()}, {user?.username} 👋
          </h2>
          <p className={styles.greetSub}>
            Here's your financial overview for {MONTHS[now.getMonth()]} {now.getFullYear()}
          </p>
        </div>
        <div className={styles.dateBadge}>
          <CalendarDays size={14} />
          {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div className="glass-card-static" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderLeft: '4px solid #ff6b6b', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertTriangle size={20} color="#ff6b6b" />
            <h3 style={{ margin: 0, color: '#ff6b6b', fontSize: '14px', fontWeight: '600' }}>Spending Alerts</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {anomalies.slice(0, 3).map((anom, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < Math.min(2, anomalies.length - 1) ? '1px solid #333' : 'none' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#e0e0e0' }}>{anom.icon} {anom.category}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>↑ {anom.increase_pct}% from average</p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#ff6b6b' }}>+{formatCurrency(anom.difference)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Income"
          value={formatCurrency(summary.total_income)}
          icon={<TrendingUp size={20} />}
          color="income"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary.total_expense)}
          icon={<TrendingDown size={20} />}
          color="expense"
        />
        <StatCard
          label="Net Savings"
          value={formatCurrency(summary.savings)}
          icon={<PiggyBank size={20} />}
          color="savings"
        />
        <StatCard
          label="Savings Rate"
          value={`${summary.savings_rate ?? 0}%`}
          icon={<Wallet size={20} />}
          color="accent"
        />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Yearly area chart */}
        <div className="glass-card-static" style={{ flex: 2 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Income vs Expenses — {now.getFullYear()}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yearlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v, name) => [formatCurrency(v), name === 'income' ? 'Income' : 'Expense']}
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
              />
              <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="glass-card-static" style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Spending by Category</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total"
                  nameKey="category__name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.category__color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name]}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="empty-state-text">No expense data this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow}>
        {/* Recent transactions */}
        <div className="glass-card-static" style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Transactions</h3>
            <Link href="/transactions" className={styles.viewAll}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {recentTx.length > 0 ? (
            <div className={styles.txList}>
              {recentTx.map((tx) => (
                <div key={tx.id} className={styles.txRow}>
                  <div
                    className={styles.txIcon}
                    style={{ background: `${tx.category_detail?.color || '#10b981'}22` }}
                  >
                    <span style={{ fontSize: 16 }}>{tx.category_detail?.icon || '💰'}</span>
                  </div>
                  <div className={styles.txInfo}>
                    <span className={styles.txName}>{tx.category_detail?.name || 'Transaction'}</span>
                    <span className={styles.txDate}>{tx.date}</span>
                  </div>
                  <span
                    className={styles.txAmount}
                    style={{ color: tx.category_detail?.type === 'income' ? 'var(--income)' : 'var(--expense)' }}
                  >
                    {tx.category_detail?.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <p className="empty-state-text">No transactions this month</p>
            </div>
          )}
        </div>

        {/* Upcoming bills */}
        <div className="glass-card-static" style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Upcoming Bills</h3>
            <Link href="/bills" className={styles.viewAll}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {upcomingBills.length > 0 ? (
            <div className={styles.billList}>
              {upcomingBills.map((bill) => {
                const daysLeft = Math.ceil(
                  (new Date(bill.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={bill.id} className={styles.billRow}>
                    <div className={styles.billIcon}>
                      <Receipt size={16} />
                    </div>
                    <div className={styles.billInfo}>
                      <span className={styles.billName}>{bill.name}</span>
                      <span className={styles.billDue}>
                        {daysLeft <= 0 ? 'Due today' : `Due in ${daysLeft}d`}
                      </span>
                    </div>
                    <span className={styles.billAmount}>{formatCurrency(bill.amount)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <p className="empty-state-text">No upcoming bills in 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Financial Advisor */}
      <div className="glass-card-static" style={{ marginTop: '24px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={18} /> Financial Advisor
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '280px' }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', textAlign: 'center', padding: '20px' }}>
                <p>Ask me about your finances. I can help analyze spending, budget planning, and financial advice.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: msg.role === 'user' ? 'var(--accent-light)' : '#333',
                    color: msg.role === 'user' ? '#000' : '#fff',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999' }}>
                <Loader2 size={14} className="animate-spin" />
                <span style={{ fontSize: '13px' }}>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent-light)',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: '600',
                opacity: chatLoading || !chatInput.trim() ? 0.5 : 1
              }}
            >
              {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorMap = {
    income: { bg: 'var(--income-bg)', color: 'var(--income)' },
    expense: { bg: 'var(--expense-bg)', color: 'var(--expense)' },
    savings: { bg: 'var(--savings-bg)', color: 'var(--savings)' },
    accent: { bg: 'var(--accent-glow)', color: 'var(--accent-light)' },
  };
  const c = colorMap[color] || colorMap.accent;
  return (
    <div className="stat-card animate-fadeIn">
      <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: c.color }}>{value}</div>
    </div>
  );
}
