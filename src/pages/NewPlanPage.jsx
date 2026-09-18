import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, Boxes, ArrowLeft, Check, Save } from 'lucide-react';

export default function NewPlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    billingCycle: 'Annual',
    validityDays: '365',
    receiptLimit: 'Unlimited Receipts',
    staffUserLimit: '4 Staff Users',
    features: 'Unlimited Donation Receipts\n4 Staff User Logins\nWhatsApp Receipt Sharing\nForm No. 10BD Compliance Reports\n80G Tax Exemption Certificates',
    badge: '',
    description: '',
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
      fetch(`/api/plans/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const p = d.data;
            setFormData({
              name: p.name || '',
              code: p.code || '',
              price: p.price !== undefined ? String(p.price) : '',
              billingCycle: p.billingCycle || 'Annual',
              validityDays: String(p.validityDays || 365),
              receiptLimit: p.receiptLimit || 'Unlimited Receipts',
              staffUserLimit: p.staffUserLimit || '4 Staff Users',
              features: Array.isArray(p.features) ? p.features.join('\n') : (p.features || ''),
              badge: p.badge || '',
              description: p.description || '',
              status: p.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching plan:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === '') {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Plan Name and Price (₹) are required.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/plans/${editId}` : '/api/plans';
      const method = editId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        price: Number(formData.price),
        validityDays: Number(formData.validityDays) || 365,
        features: formData.features.split('\n').map(f => f.trim()).filter(Boolean)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setPopup({
          isOpen: true,
          type: 'success',
          title: editId ? 'Plan Updated' : 'Plan Created',
          message: editId
            ? 'The subscription plan was updated successfully.'
            : 'New subscription plan was created and published to all trusts.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/plans');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to save plan');
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'An error occurred while saving the plan.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#212529',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    height: '38px',
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#495057',
    backgroundColor: '#ffffff'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{editId ? 'EDIT PLAN CONFIGURATION' : 'NEW SUBSCRIPTION PLAN'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? 'Edit Subscription Plan' : 'Add New Subscription Plan'}
          </h1>
          <p className="mint-hero-subtitle">
            Configure pricing, receipt quotas, staff limits, and platform features for this subscription plan.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/superadmin/plans')}
            title="View All Plans"
          >
            <List size={16} />
            <span>All Plans</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading plan configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Plan Name, Plan Code, Price */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Plan Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Standard, Premium, Enterprise"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Plan Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. PLAN_PRO_ANNUAL"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Price (₹) <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0 for Free, or amount in ₹"
                  min="0"
                  step="1"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 2: Billing Cycle, Validity Days, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Billing Cycle</label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Annual">Annual (1 Year)</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly (3 Months)</option>
                  <option value="Lifetime">Lifetime Access</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Validity (Days)</label>
                <input
                  type="number"
                  name="validityDays"
                  value={formData.validityDays}
                  onChange={handleChange}
                  placeholder="365"
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Active">Active (Available for Trusts)</option>
                  <option value="Inactive">Inactive (Archived)</option>
                </select>
              </div>
            </div>

            {/* ROW 3: Receipt Quota, Staff Users Limit, Badge */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Receipt Quota</label>
                <input
                  type="text"
                  name="receiptLimit"
                  value={formData.receiptLimit}
                  onChange={handleChange}
                  placeholder="e.g. Unlimited Receipts, 1,000 / year"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Staff User Limit</label>
                <input
                  type="text"
                  name="staffUserLimit"
                  value={formData.staffUserLimit}
                  onChange={handleChange}
                  placeholder="e.g. 4 Staff Users, 10 Staff Users"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Highlight Badge / Tag</label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="e.g. POPULAR, RECOMMENDED, BEST VALUE"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 4: Short Description */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Short Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief summary of who this plan is tailored for (e.g. For growing NGOs and active charity trusts)"
                style={inputStyle}
              />
            </div>

            {/* ROW 5: Plan Features (One per line) */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>
                Included Features <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>(One feature per line)</span>
              </label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={5}
                placeholder="Unlimited Donation Receipts&#10;WhatsApp Receipt Sharing&#10;Form No. 10BD Statutory Reports"
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button
                type="submit"
                className="btn-trust-primary"
                disabled={isSubmitting}
                style={{ padding: '10px 24px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Saving...' : editId ? 'Update Plan' : 'Save & Publish Plan'}</span>
              </button>

              <button
                type="button"
                className="btn-trust-outline"
                onClick={() => navigate('/superadmin/plans')}
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
}
