import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, FileSpreadsheet, Save, Layers } from 'lucide-react';

const AVAILABLE_COLUMNS = [
  'Donor Name',
  'PAN / Unique ID',
  'Mobile / Phone',
  'Email Address',
  'City / State',
  'Donation Type',
  'Donation Head',
  'Payment Mode',
  'Amount (INR)',
  'Receipt No',
  'Receipt Date',
  '80G Section Clause',
  'Approval Order No',
  'Total Cumulative Contributions',
  'Status'
];

export default function NewReportTypePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Statutory Compliance',
    frequency: 'Annual',
    scope: 'Donation Receipts',
    columns: ['Donor Name', 'PAN / Unique ID', 'Amount (INR)', 'Receipt No', 'Receipt Date'],
    sectionClause: 'Section 80G(5)(vi) & Rule 18AB of IT Rules',
    description: '',
    disclaimer: 'This statutory report is compiled for audit and regulatory compliance purposes.',
    status: 'Active'
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/report-types/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const t = d.data;
            setFormData({
              name: t.name || '',
              code: t.code || '',
              category: t.category || 'Statutory Compliance',
              frequency: t.frequency || 'Annual',
              scope: t.scope || 'Donation Receipts',
              columns: Array.isArray(t.columns) ? t.columns : ['Donor Name', 'Amount (INR)', 'Receipt Date'],
              sectionClause: t.sectionClause || '',
              description: t.description || '',
              disclaimer: t.disclaimer || '',
              status: t.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching report type:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleColumn = (col) => {
    setFormData(prev => {
      const exists = prev.columns.includes(col);
      if (exists) {
        return { ...prev, columns: prev.columns.filter(c => c !== col) };
      } else {
        return { ...prev, columns: [...prev.columns, col] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Report Type Name is required.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/report-types/${editId}` : '/api/report-types';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setPopup({
          isOpen: true,
          type: 'success',
          title: editId ? 'Report Type Updated' : 'Report Type Created',
          message: editId
            ? 'Report type schema and parameters updated successfully.'
            : 'New report type created successfully. Trusts and administrators can now access this report structure.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/report-types');
          }
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Operation Failed',
          message: data.message || 'Could not save report type.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to backend server.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={13} />
            <span>{editId ? 'EDIT REPORT TYPE SCHEMA' : 'NEW REPORT TYPE DEFINITION'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? `Edit Report Type: ${formData.name || editId}` : 'Create New Report Type'}
          </h1>
          <p className="mint-hero-subtitle">
            Configure statutory report classification, data collection scopes, audit columns, and frequency for trusts.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-hero-btn-action"
            onClick={() => navigate('/superadmin/report-types')}
          >
            <List size={16} />
            <span>All Report Types</span>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="mint-table-card-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <p>Loading report type details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
              <FileSpreadsheet size={20} color="#059669" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Report Classification &amp; Audit Scope
              </h2>
            </div>

            <div className="trust-form-grid">
              {/* Row 1 */}
              <div className="trust-form-group">
                <label className="trust-form-label">
                  Report Type Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="trust-form-input"
                  placeholder="e.g. 80G Exemption Audit Register"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="trust-form-group">
                <label className="trust-form-label">Report Code Identifier</label>
                <input
                  type="text"
                  name="code"
                  className="trust-form-input"
                  placeholder="e.g. REP_80G_AUDIT (Auto-generated if blank)"
                  value={formData.code}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
              </div>

              <div className="trust-form-group">
                <label className="trust-form-label">Report Category</label>
                <select
                  name="category"
                  className="trust-form-input"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Statutory Compliance">Statutory Compliance</option>
                  <option value="Financial Audit">Financial Audit</option>
                  <option value="Donor Analytics">Donor Analytics</option>
                  <option value="Tax Compliance">Tax Compliance</option>
                  <option value="Operational Audit">Operational Audit</option>
                  <option value="CSR & Endowments">CSR &amp; Endowments</option>
                  <option value="Custom Report">Custom Report</option>
                </select>
              </div>

              {/* Row 2 */}
              <div className="trust-form-group">
                <label className="trust-form-label">Reporting Frequency</label>
                <select
                  name="frequency"
                  className="trust-form-input"
                  value={formData.frequency}
                  onChange={handleChange}
                >
                  <option value="Annual">Annual (Financial Year)</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="On Demand">On Demand / Real-time</option>
                </select>
              </div>

              <div className="trust-form-group">
                <label className="trust-form-label">Data Scope Source</label>
                <select
                  name="scope"
                  className="trust-form-input"
                  value={formData.scope}
                  onChange={handleChange}
                >
                  <option value="Donation Receipts">Donation Receipts Registry</option>
                  <option value="Donors Registry">Donors Directory</option>
                  <option value="Donation Heads">Donation Heads &amp; Causes</option>
                  <option value="Payment Modes">Payment Modes &amp; Gateways</option>
                  <option value="Subscriptions & Quotas">Subscriptions &amp; Quotas</option>
                </select>
              </div>

              <div className="trust-form-group">
                <label className="trust-form-label">Status</label>
                <select
                  name="status"
                  className="trust-form-input"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Row 3: Statutory Section */}
              <div className="trust-form-group trust-col-span-3">
                <label className="trust-form-label">Governing Statutory Section / Rule</label>
                <input
                  type="text"
                  name="sectionClause"
                  className="trust-form-input"
                  placeholder="e.g. Section 80G(5)(vi) of Income Tax Act 1961 / Rule 18AB"
                  value={formData.sectionClause}
                  onChange={handleChange}
                />
              </div>

              {/* Row 4: Columns Picker */}
              <div className="trust-form-group trust-col-span-3">
                <label className="trust-form-label" style={{ marginBottom: '10px' }}>
                  Included Audit Columns &amp; Metrics
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {AVAILABLE_COLUMNS.map(col => {
                    const isChecked = formData.columns.includes(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleToggleColumn(col)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: isChecked ? '600' : '400',
                          border: isChecked ? '1px solid #10b981' : '1px solid #cbd5e1',
                          backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                          color: isChecked ? '#065f46' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{isChecked ? '✓' : '+'}</span>
                        <span>{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Description */}
              <div className="trust-form-group trust-col-span-3">
                <label className="trust-form-label">Report Description &amp; Scope</label>
                <textarea
                  name="description"
                  className="trust-form-textarea"
                  rows="3"
                  placeholder="Briefly explain the purpose and audit coverage of this report type..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Row 6: Disclaimer */}
              <div className="trust-form-group trust-col-span-3">
                <label className="trust-form-label">Statutory Disclaimer &amp; Footer Note</label>
                <textarea
                  name="disclaimer"
                  className="trust-form-textarea"
                  rows="2"
                  placeholder="Legal note or audit disclaimer printed on exported reports..."
                  value={formData.disclaimer}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="form-actions-row" style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn-trust-primary"
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : (editId ? 'Update Report Type' : 'Save & Publish Report Type')}</span>
              </button>

              <button
                type="button"
                className="btn-trust-secondary"
                onClick={() => navigate('/superadmin/report-types')}
                style={{ padding: '12px 24px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
