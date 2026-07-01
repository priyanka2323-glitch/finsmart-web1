'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calculator, Loader2, CheckCircle2, TrendingDown, Info } from 'lucide-react';
import { makeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import styles from './tax.module.css';

const DEFAULT_FORM = {
  gross_income: '',
  basic_salary: '',
  hra_received: '',
  rent_paid: '',
  section_80c: '',
  section_80d: '',
  home_loan_interest: '',
  is_metro: true,
};

export default function TaxPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gross_income) { setError('Gross income is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        gross_income: Number(form.gross_income),
        basic_salary: Number(form.basic_salary) || 0,
        hra_received: Number(form.hra_received) || 0,
        rent_paid: Number(form.rent_paid) || 0,
        section_80c: Number(form.section_80c) || 0,
        section_80d: Number(form.section_80d) || 0,
        home_loan_interest: Number(form.home_loan_interest) || 0,
        is_metro: form.is_metro,
      };
      const data = await makeAPI(token).reports.taxEstimate(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate tax.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Form */}
        <div className={styles.formSection}>
          <div className="glass-card-static">
            <div className={styles.formHeader}>
              <div className={styles.formIcon}>
                <Calculator size={22} />
              </div>
              <div>
                <h2 className={styles.formTitle}>Tax Estimator</h2>
                <p className={styles.formSubtitle}>FY 2024–25 · Old vs New Regime</p>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Income section */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Income Details</div>
                <div className={styles.fieldGrid}>
                  <div className="form-group">
                    <label className="form-label">Gross Annual Income *</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="gross_income"
                        type="number"
                        min="0"
                        placeholder="e.g. 1200000"
                        value={form.gross_income}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Basic Salary</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="basic_salary"
                        type="number"
                        min="0"
                        placeholder="e.g. 600000"
                        value={form.basic_salary}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HRA section */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>HRA Details</div>
                <div className={styles.fieldGrid}>
                  <div className="form-group">
                    <label className="form-label">HRA Received</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="hra_received"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.hra_received}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Rent Paid</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="rent_paid"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.rent_paid}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_metro"
                    checked={form.is_metro}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>Metro city (Delhi, Mumbai, Kolkata, Chennai)</span>
                </label>
              </div>

              {/* Deductions */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Deductions (Old Regime)</div>
                <div className={styles.fieldGrid}>
                  <div className="form-group">
                    <label className="form-label">Section 80C <span className={styles.limit}>(max ₹1,50,000)</span></label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="section_80c"
                        type="number"
                        min="0"
                        max="150000"
                        placeholder="0"
                        value={form.section_80c}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section 80D <span className={styles.limit}>(max ₹25,000)</span></label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="section_80d"
                        type="number"
                        min="0"
                        max="25000"
                        placeholder="0"
                        value={form.section_80d}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Home Loan Interest <span className={styles.limit}>(max ₹2,00,000)</span></label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputPrefix}>₹</span>
                      <input
                        className={`form-input ${styles.inputWithPrefix}`}
                        name="home_loan_interest"
                        type="number"
                        min="0"
                        max="200000"
                        placeholder="0"
                        value={form.home_loan_interest}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <><Calculator size={16} /> Calculate Tax</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className={styles.resultsSection}>
          {!result ? (
            <div className="glass-card-static" style={{ height: '100%', minHeight: 300 }}>
              <div className="empty-state" style={{ height: '100%' }}>
                <div className="empty-state-icon"><Calculator size={28} /></div>
                <p className="empty-state-title">Enter your details</p>
                <p className="empty-state-text">Fill in the form and calculate to see your tax comparison</p>
              </div>
            </div>
          ) : (
            <div className={styles.results}>
              {/* Recommendation banner */}
              <div className={`${styles.recommendation} ${result.recommendation.better_regime === 'new' ? styles.recNew : styles.recOld}`}>
                <CheckCircle2 size={20} />
                <div>
                  <div className={styles.recTitle}>
                    {result.recommendation.better_regime === 'new' ? 'New Regime' : 'Old Regime'} is better for you
                  </div>
                  <div className={styles.recSub}>{result.recommendation.message}</div>
                </div>
              </div>

              {/* Regime comparison */}
              <div className={styles.regimeGrid}>
                {/* Old regime */}
                <div className={`glass-card-static ${styles.regimeCard} ${result.recommendation.better_regime === 'old' ? styles.regimeBest : ''}`}>
                  {result.recommendation.better_regime === 'old' && (
                    <div className={styles.bestBadge}>Recommended</div>
                  )}
                  <h3 className={styles.regimeTitle}>Old Regime</h3>
                  <div className={styles.regimeTax}>{formatCurrency(result.old_regime.tax)}</div>
                  <div className={styles.regimeLabel}>Total Tax (incl. 4% cess)</div>

                  <div className={styles.divider} />

                  <div className={styles.regimeDetails}>
                    <RegimeRow label="Gross Income" value={formatCurrency(result.gross_income)} />
                    <RegimeRow label="Total Deductions" value={`-${formatCurrency(result.old_regime.deductions)}`} color="var(--income)" />
                    <RegimeRow label="Taxable Income" value={formatCurrency(result.old_regime.taxable_income)} />
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.breakdownTitle}>Deduction Breakdown</div>
                  <div className={styles.regimeDetails}>
                    <RegimeRow label="Standard Deduction" value={formatCurrency(result.old_regime.breakdown.standard_deduction)} color="var(--income)" />
                    <RegimeRow label="HRA Exemption" value={formatCurrency(result.old_regime.breakdown.hra_exemption)} color="var(--income)" />
                    <RegimeRow label="Section 80C" value={formatCurrency(result.old_regime.breakdown.section_80c)} color="var(--income)" />
                    <RegimeRow label="Section 80D" value={formatCurrency(result.old_regime.breakdown.section_80d)} color="var(--income)" />
                    <RegimeRow label="Home Loan" value={formatCurrency(result.old_regime.breakdown.home_loan)} color="var(--income)" />
                  </div>
                </div>

                {/* New regime */}
                <div className={`glass-card-static ${styles.regimeCard} ${result.recommendation.better_regime === 'new' ? styles.regimeBest : ''}`}>
                  {result.recommendation.better_regime === 'new' && (
                    <div className={styles.bestBadge}>Recommended</div>
                  )}
                  <h3 className={styles.regimeTitle}>New Regime</h3>
                  <div className={styles.regimeTax}>{formatCurrency(result.new_regime.tax)}</div>
                  <div className={styles.regimeLabel}>Total Tax (incl. 4% cess)</div>

                  <div className={styles.divider} />

                  <div className={styles.regimeDetails}>
                    <RegimeRow label="Gross Income" value={formatCurrency(result.gross_income)} />
                    <RegimeRow label="Standard Deduction" value={`-${formatCurrency(result.new_regime.deductions)}`} color="var(--income)" />
                    <RegimeRow label="Taxable Income" value={formatCurrency(result.new_regime.taxable_income)} />
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.infoBox}>
                    <Info size={14} />
                    <span>New regime has simplified slabs with a flat ₹75,000 standard deduction. No other deductions apply.</span>
                  </div>
                </div>
              </div>

              {/* Savings highlight */}
              <div className="glass-card-static" style={{ textAlign: 'center' }}>
                <TrendingDown size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>You save</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                  {formatCurrency(result.recommendation.tax_savings)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  by choosing the {result.recommendation.better_regime} regime
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RegimeRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
