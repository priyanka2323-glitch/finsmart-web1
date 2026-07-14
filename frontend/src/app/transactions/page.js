'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, X, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { categories as catApi, makeAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './transactions.module.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TYPE_LABELS = { income: 'Income', expense: 'Expense' };

const formatCategoryOption = (category) => `${TYPE_LABELS[category.type] || category.type} - ${category.name}`;

const FALLBACK_CATEGORIES = [
  { id: 1001, name: 'Food', icon: 'FO', type: 'expense', color: '#e85d04' },
  { id: 1002, name: 'Home Expenses', icon: 'HM', type: 'expense', color: '#dc2626' },
  { id: 1003, name: 'Transportation', icon: 'TR', type: 'expense', color: '#d97706' },
  { id: 1004, name: 'Shopping', icon: 'SH', type: 'expense', color: '#c026d3' },
  { id: 1005, name: 'Healthcare', icon: 'HC', type: 'expense', color: '#dc2626' },
  { id: 1006, name: 'Education', icon: 'ED', type: 'expense', color: '#0284c7' },
  { id: 1007, name: 'Entertainment', icon: 'EN', type: 'expense', color: '#db2777' },
  { id: 1008, name: 'Travel', icon: 'TV', type: 'expense', color: '#0d9488' },
  { id: 1009, name: 'Rent', icon: 'RT', type: 'expense', color: '#7c3aed' },
  { id: 1010, name: 'Electricity', icon: 'EL', type: 'expense', color: '#f59e0b' },
  { id: 1011, name: 'Mobile/Internet', icon: 'MB', type: 'expense', color: '#0891b2' },
  { id: 1012, name: 'Insurance', icon: 'IN', type: 'expense', color: '#4f46e5' },
  { id: 1013, name: 'Taxes', icon: 'TX', type: 'expense', color: '#64748b' },
  { id: 1014, name: 'Salary', icon: 'SA', type: 'income', color: '#16a34a' },
  { id: 1015, name: 'Freelance', icon: 'FR', type: 'income', color: '#0891b2' },
  { id: 1016, name: 'Business', icon: 'BU', type: 'income', color: '#d97706' },
  { id: 1017, name: 'Investment', icon: 'IV', type: 'income', color: '#7c3aed' },
  { id: 1018, name: 'Rental Income', icon: 'RI', type: 'income', color: '#0d9488' },
  { id: 1019, name: 'Other', icon: 'OT', type: 'income', color: '#64748b' },
];

export default function TransactionsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [txList, setTxList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Fetch categories immediately — public endpoint, no token needed
  useEffect(() => {
    catApi.list()
      .then(data => {
        const apiCategories = Array.isArray(data) ? data : (data.results || []);
        setCategories(apiCategories.length ? apiCategories : FALLBACK_CATEGORIES);
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES));
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const api = makeAPI(token);
      const txData = await api.transactions.list({ month, year });
      setTxList(Array.isArray(txData) ? txData : (txData.results || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = txList.filter(tx => {
    if (typeFilter !== 'all' && tx.category_detail?.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return tx.category_detail?.name?.toLowerCase().includes(q) || tx.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalIncome  = filtered.filter(t => t.category_detail?.type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.category_detail?.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    setDeleting(id);
    try { await makeAPI(token).transactions.delete(id); setTxList(p => p.filter(t => t.id !== id)); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const handleSaved = (saved, isEdit) => {
    if (isEdit) setTxList(p => p.map(t => t.id === saved.id ? saved : t));
    else setTxList(p => [saved, ...p]);
    setShowModal(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const categoryOptions = categories.length ? categories : FALLBACK_CATEGORIES;

  return (
    <div className={styles.page}>
      <div className={styles.summaryRow}>
        {[
          { label:'Income',   value:formatCurrency(totalIncome),  color:'var(--income)',  bg:'var(--income-bg)',  Icon:TrendingUp },
          { label:'Expenses', value:formatCurrency(totalExpense), color:'var(--expense)', bg:'var(--expense-bg)', Icon:TrendingDown },
          { label:'Net', value:formatCurrency(totalIncome-totalExpense), color:totalIncome-totalExpense>=0?'var(--income)':'var(--expense)', bg:'var(--savings-bg)', Icon:ArrowLeftRight },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background:bg, color }}><Icon size={20}/></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select className="form-select" style={{width:140}} value={month} onChange={e=>setMonth(Number(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" style={{width:100}} value={year} onChange={e=>setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="toggle-group">
            {['all','income','expense'].map(t => (
              <button key={t} className={`toggle-btn ${typeFilter===t?'active':''}`} onClick={() => setTypeFilter(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon}/>
            <input className={`form-input ${styles.searchInput}`} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className={styles.clearSearch} onClick={()=>setSearch('')}><X size={14}/></button>}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTx(null); setShowModal(true); }}>
            <Plus size={16}/> Add
          </button>
        </div>
      </div>

      <div className="glass-card-static" style={{padding:0,overflow:'hidden'}}>
        {loading ? (
          <div className={styles.loadingWrap}><Loader2 size={28} className="animate-spin" style={{color:'var(--accent)'}}/></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ArrowLeftRight size={28}/></div>
            <p className="empty-state-title">No transactions found</p>
            <p className="empty-state-text">Add your first transaction to get started</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead><tr>
              <th>Category</th><th>Date</th><th>Description</th><th>Type</th>
              <th style={{textAlign:'right'}}>Amount</th><th style={{textAlign:'right'}}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div className={styles.catCell}>
                      <div className={styles.catIcon} style={{background:`${tx.category_detail?.color||'#10b981'}22`}}>
                        <span>{tx.category_detail?.icon||'💰'}</span>
                      </div>
                      <div className={styles.catText}>
                        <span className={styles.catName}>{tx.category_detail?.name||'—'}</span>
                        <span className={`badge ${tx.category_detail?.type==='income'?'badge-income':'badge-expense'} ${styles.catTypeBadge}`}>
                          {tx.category_detail?.type ? TYPE_LABELS[tx.category_detail.type] : '—'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.dateCell}>{formatDate(tx.date)}</td>
                  <td className={styles.descCell}>{tx.description||'—'}</td>
                  <td><span className={`badge ${tx.category_detail?.type==='income'?'badge-income':'badge-expense'}`}>{tx.category_detail?.type||'—'}</span></td>
                  <td style={{textAlign:'right'}}>
                    <span style={{color:tx.category_detail?.type==='income'?'var(--income)':'var(--expense)',fontWeight:600}}>
                      {tx.category_detail?.type==='income'?'+':'-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={()=>{setEditTx(tx);setShowModal(true);}}><Pencil size={14}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={()=>handleDelete(tx.id)} disabled={deleting===tx.id}>
                        {deleting===tx.id?<Loader2 size={14} className="animate-spin"/>:<Trash2 size={14}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <TransactionModal tx={editTx} categories={categoryOptions} token={token} onClose={()=>setShowModal(false)} onSaved={handleSaved}/>
      )}
    </div>
  );
}

function TransactionModal({ tx, categories, token, onClose, onSaved }) {
  const isEdit = !!tx;
  const api = makeAPI(token);
  console.log('Modal token:', token ? token.substring(0, 20) + '...' : 'MISSING');
  const [form, setForm] = useState({
    amount: tx?.amount || '',
    category: tx?.category || '',
    date: tx?.date || new Date().toISOString().split('T')[0],
    description: tx?.description || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { setError('Please select a category.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        category: Number(form.category),
      };
      const saved = isEdit ? await api.transactions.update(tx.id, payload) : await api.transactions.create(payload);
      onSaved(saved, isEdit);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const income  = categories.filter(c => c.type === 'income');
  const expense = categories.filter(c => c.type === 'expense');

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit?'Edit Transaction':'Add Transaction'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
              <option value="">Select category</option>
              {income.length > 0 && <optgroup label="Income">
                {income.map(c => <option key={c.id} value={c.id}>{c.icon} {formatCategoryOption(c)}</option>)}
              </optgroup>}
              {expense.length > 0 && <optgroup label="Expense">
                {expense.map(c => <option key={c.id} value={c.id}>{c.icon} {formatCategoryOption(c)}</option>)}
              </optgroup>}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input className="form-input" type="text" placeholder="Add a note…"
              value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>
          <div style={{display:'flex',gap:12,marginTop:4}}>
            <button type="button" className="btn btn-secondary" style={{flex:1}} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{flex:1}} disabled={saving}>
              {saving?<Loader2 size={16} className="animate-spin"/>:isEdit?'Save Changes':'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
