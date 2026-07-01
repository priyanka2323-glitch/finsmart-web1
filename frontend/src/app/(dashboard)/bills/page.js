'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Trash2, X, Loader2, Receipt, CheckCircle2, Clock, CalendarDays, Repeat } from 'lucide-react';
import { makeAPI } from '@/lib/api';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import styles from './bills.module.css';

const FREQ_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

export default function BillsPage() {
  const { data: session } = useSession();
  const [billList, setBillList] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState('all'); // 'all' | 'upcoming'

  const token = session?.accessToken;

  useEffect(() => {
    if (token) sessionStorage.setItem('token', token);
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const api = makeAPI(token);
      const [all, up, cats] = await Promise.all([
        api.bills.list(),
        api.bills.upcoming(),
        api.categories.list(),
      ]);
      setBillList(all.results || all);
      setUpcoming(up.results || up);
      setCategories(cats.results || cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMonthly = billList.reduce((s, b) => {
    if (b.frequency === 'monthly') return s + Number(b.amount);
    if (b.frequency === 'quarterly') return s + Number(b.amount) / 3;
    if (b.frequency === 'yearly') return s + Number(b.amount) / 12;
    return s;
  }, 0);

  const handlePay = async (id) => {
    setPaying(id);
    try {
      // load Razorpay checkout script
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject; document.body.appendChild(s);
        });
      }

      const order = await makeAPI(token).bills.order(id);
      const options = {
        key: order.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'FinSmart',
        description: `Pay ${order.bill_name}`,
        handler: async function (res) {
          try {
            await makeAPI(token).bills.verify(id, res);
            await fetchData();
            alert('Payment successful');
          } catch (err) {
            console.error(err);
            alert('Verification failed');
          }
        },
        modal: { ondismiss: function(){ setPaying(null); } }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Payment failed');
      setPaying(null);
    }
  };

  const handleSavedBill = async (savedBill) => {
    setShowModal(false);
    if (savedBill?.id) {
      setBillList((prev) => {
        const exists = prev.some((bill) => bill.id === savedBill.id);
        return exists
          ? prev.map((bill) => (bill.id === savedBill.id ? savedBill : bill))
          : [savedBill, ...prev];
      });
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill?')) return;
    setDeleting(id);
    try {
      await makeAPI(token).bills.delete(id);
      setBillList((p) => p.filter((b) => b.id !== id));
      setUpcoming((p) => p.filter((b) => b.id !== id));
    }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const displayList = tab === 'upcoming' ? upcoming : billList;

  return (
    <div className={styles.page}>
      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Receipt size={20} />
          </div>
          <div className="stat-label">Active Bills</div>
          <div className="stat-value">{billList.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}>
            <Repeat size={20} />
          </div>
          <div className="stat-label">Monthly Cost</div>
          <div className="stat-value" style={{ color: 'var(--expense)' }}>{formatCurrency(totalMonthly)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-label">Due in 30 Days</div>
          <div className="stat-value">{upcoming.length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className="toggle-group">
          <button className={`toggle-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            All Bills
          </button>
          <button className={`toggle-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            Upcoming ({upcoming.length})
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditBill(null); setShowModal(true); }}>
          <Plus size={16} /> Add Bill
        </button>
      </div>

      {/* Bills grid */}
      {loading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="glass-card-static">
          <div className="empty-state">
            <div className="empty-state-icon"><Receipt size={28} /></div>
            <p className="empty-state-title">
              {tab === 'upcoming' ? 'No upcoming bills' : 'No bills yet'}
            </p>
            <p className="empty-state-text">
              {tab === 'upcoming'
                ? 'No bills due in the next 30 days'
                : 'Add your recurring bills to track them'}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayList.map((bill) => {
            const days = daysUntil(bill.next_due_date);
            const isOverdue = days < 0;
            const isDueSoon = days >= 0 && days <= 3;
            return (
              <div key={bill.id} className={styles.billCard}>
                <div className={styles.billCardTop}>
                  <div className={styles.billCardIcon}>
                    <Receipt size={20} />
                  </div>
                  <div className={styles.billCardActions}>
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => { setEditBill(bill); setShowModal(true); }}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={() => handleDelete(bill.id)}
                      disabled={deleting === bill.id}
                      title="Delete"
                    >
                      {deleting === bill.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                <div className={styles.billCardName}>{bill.name}</div>
                <div className={styles.billCardAmount}>{formatCurrency(bill.amount)}</div>

                <div className={styles.billCardMeta}>
                  <span className="badge badge-neutral">
                    <Repeat size={11} /> {FREQ_LABELS[bill.frequency] || bill.frequency}
                  </span>
                  <span
                    className={`badge ${isOverdue ? 'badge-expense' : isDueSoon ? 'badge-warning' : 'badge-neutral'}`}
                  >
                    <CalendarDays size={11} />
                    {isOverdue
                      ? `Overdue ${Math.abs(days)}d`
                      : days === 0
                      ? 'Due today'
                      : `Due in ${days}d`}
                  </span>
                </div>

                <div className={styles.billCardDue}>
                  Next due: {formatDate(bill.next_due_date)}
                </div>

                <button
                  className={`btn btn-primary btn-sm ${styles.payBtn}`}
                  onClick={() => handlePay(bill.id)}
                  disabled={paying === bill.id}
                >
                  {paying === bill.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <><CheckCircle2 size={14} /> Mark as Paid</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BillModal
          bill={editBill}
          categories={categories}
          token={session?.accessToken}
          onClose={() => setShowModal(false)}
          onSaved={handleSavedBill}
        />
      )}
    </div>
  );
}

/* ─── Bill Modal ─── */
function BillModal({ bill, categories, token, onClose, onSaved }) {
  const isEdit = !!bill;
  const api = makeAPI(token);
  const [form, setForm] = useState({
    name: bill?.name || '',
    amount: bill?.amount || '',
    category: bill?.category || '',
    frequency: bill?.frequency || 'monthly',
    due_day: bill?.due_day || 1,
    next_due_date: bill?.next_due_date || new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        due_day: Number(form.due_day),
        category: form.category ? Number(form.category) : null,
      };
      const savedBill = isEdit
        ? await api.bills.update(bill.id, payload)
        : await api.bills.create(payload);
      await onSaved(savedBill);
    } catch (err) {
      setError(err.message || 'Failed to save bill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Bill' : 'Add Recurring Bill'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Bill Name</label>
            <input
              className="form-input"
              name="name"
              placeholder="e.g. Netflix, Rent, Gym"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" name="frequency" value={form.frequency} onChange={handleChange}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Due Day (1–31)</label>
              <input
                className="form-input"
                name="due_day"
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Next Due Date</label>
              <input
                className="form-input"
                name="next_due_date"
                type="date"
                value={form.next_due_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category (optional)</label>
            <select className="form-select" name="category" value={form.category} onChange={handleChange}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? 'Save Changes' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
