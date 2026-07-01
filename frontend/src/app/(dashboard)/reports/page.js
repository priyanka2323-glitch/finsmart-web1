'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TrendingUp, TrendingDown, PiggyBank, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { makeAPI } from '@/lib/api';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import styles from './reports.module.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const now = new Date();
  const [view, setView] = useState('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) sessionStorage.setItem('token', token);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const api = makeAPI(token);
    const fetch = view === 'monthly'
      ? api.reports.monthly({ month, year })
      : api.reports.yearly({ year });
    fetch.then(setData).catch(console.error).finally(() => setLoading(false));
  }, [view, month, year, token]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className={styles.page}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className="toggle-group">
          <button className={`toggle-btn ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>
            Monthly
          </button>
          <button className={`toggle-btn ${view === 'yearly' ? 'active' : ''}`} onClick={() => setView('yearly')}>
            Yearly
          </button>
        </div>

        <div className={styles.dateFilters}>
          {view === 'monthly' && (
            <select
              className="form-select"
              style={{ width: 140 }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
          <select
            className="form-select"
            style={{ width: 100 }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : view === 'monthly' ? (
        <MonthlyView data={data} />
      ) : (
        <YearlyView data={data} />
      )}
    </div>
  );
}

/* ─── Monthly View ─── */
function MonthlyView({ data }) {
  if (!data) return null;
  const { summary, category_breakdown, daily_spending, bills } = data;

  return (
    <div className={styles.content}>
      {/* Summary cards */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--income-bg)', color: 'var(--income)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-label">Total Income</div>
          <div className="stat-value" style={{ color: 'var(--income)' }}>{formatCurrency(summary.total_income)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}>
            <TrendingDown size={20} />
          </div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" style={{ color: 'var(--expense)' }}>{formatCurrency(summary.total_expense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--savings-bg)', color: 'var(--savings)' }}>
            <PiggyBank size={20} />
          </div>
          <div className="stat-label">Net Savings</div>
          <div className="stat-value" style={{ color: 'var(--savings)' }}>{formatCurrency(summary.savings)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
            <BarChart3 size={20} />
          </div>
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{summary.savings_rate}%</div>
        </div>
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Daily spending line chart */}
        <div className="glass-card-static" style={{ flex: 2 }}>
          <h3 className={styles.chartTitle}>Daily Spending</h3>
          {daily_spending?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={daily_spending} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [formatCurrency(v), 'Spent']}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
                />
                <Line type="monotone" dataKey="total" stroke="#f87171" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="empty-state-text">No spending data this month</p>
            </div>
          )}
        </div>

        {/* Category pie */}
        <div className="glass-card-static" style={{ flex: 1, minWidth: 0 }}>
          <h3 className={styles.chartTitle}>Expense Breakdown</h3>
          {category_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={category_breakdown}
                  dataKey="total"
                  nameKey="category__name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {category_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.category__color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name]}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
                />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="empty-state-text">No expense data</p>
            </div>
          )}
        </div>
      </div>

      {/* Category table + Bills */}
      <div className={styles.chartsRow}>
        {/* Category breakdown table */}
        <div className="glass-card-static" style={{ flex: 2, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px' }}>
            <h3 className={styles.chartTitle}>Category Breakdown</h3>
          </div>
          {category_breakdown?.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Transactions</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {category_breakdown.map((cat, i) => {
                  const share = summary.total_expense > 0
                    ? ((cat.total / summary.total_expense) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: cat.category__color || CHART_COLORS[i % CHART_COLORS.length],
                            flexShrink: 0,
                          }} />
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {cat.category__icon} {cat.category__name}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{cat.count}</td>
                      <td style={{ textAlign: 'right', color: 'var(--expense)', fontWeight: 600 }}>
                        {formatCurrency(cat.total)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${share}%`, background: cat.category__color || 'var(--accent)' }} />
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 36 }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <p className="empty-state-text">No expense categories this month</p>
            </div>
          )}
        </div>

        {/* Bills summary */}
        <div className="glass-card-static" style={{ flex: 1 }}>
          <h3 className={styles.chartTitle} style={{ marginBottom: 20 }}>Bills Summary</h3>
          <div className={styles.billsSummary}>
            <div className={styles.billsSummaryItem}>
              <span className={styles.billsSummaryLabel}>Bills Paid</span>
              <span className={styles.billsSummaryValue} style={{ color: 'var(--income)' }}>
                {formatCurrency(bills?.paid)}
              </span>
            </div>
            <div className={styles.billsSummaryItem}>
              <span className={styles.billsSummaryLabel}>Bills Upcoming</span>
              <span className={styles.billsSummaryValue} style={{ color: 'var(--warning)' }}>
                {formatCurrency(bills?.upcoming)}
              </span>
            </div>
            <div className={styles.billsSummaryItem}>
              <span className={styles.billsSummaryLabel}>Total Bills</span>
              <span className={styles.billsSummaryValue}>
                {formatCurrency((bills?.paid || 0) + (bills?.upcoming || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Yearly View ─── */
function YearlyView({ data }) {
  if (!data) return null;
  const { monthly_data, summary } = data;

  return (
    <div className={styles.content}>
      {/* Summary */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--income-bg)', color: 'var(--income)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-label">Annual Income</div>
          <div className="stat-value" style={{ color: 'var(--income)' }}>{formatCurrency(summary.total_income)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}>
            <TrendingDown size={20} />
          </div>
          <div className="stat-label">Annual Expenses</div>
          <div className="stat-value" style={{ color: 'var(--expense)' }}>{formatCurrency(summary.total_expense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--savings-bg)', color: 'var(--savings)' }}>
            <PiggyBank size={20} />
          </div>
          <div className="stat-label">Annual Savings</div>
          <div className="stat-value" style={{ color: 'var(--savings)' }}>{formatCurrency(summary.total_savings)}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="glass-card-static">
        <h3 className={styles.chartTitle} style={{ marginBottom: 20 }}>Monthly Overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly_data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(v), name.charAt(0).toUpperCase() + name.slice(1)]}
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
            />
            <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px' }}>
          <h3 className={styles.chartTitle}>Month-by-Month</h3>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Month</th>
              <th style={{ textAlign: 'right' }}>Income</th>
              <th style={{ textAlign: 'right' }}>Expenses</th>
              <th style={{ textAlign: 'right' }}>Savings</th>
            </tr>
          </thead>
          <tbody>
            {monthly_data.map((m) => (
              <tr key={m.month}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.month_name}</td>
                <td style={{ textAlign: 'right', color: 'var(--income)', fontWeight: 600 }}>{formatCurrency(m.income)}</td>
                <td style={{ textAlign: 'right', color: 'var(--expense)', fontWeight: 600 }}>{formatCurrency(m.expense)}</td>
                <td style={{ textAlign: 'right', color: m.savings >= 0 ? 'var(--savings)' : 'var(--expense)', fontWeight: 600 }}>
                  {formatCurrency(m.savings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
