import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, Building, Save } from 'lucide-react';

export default function NewUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plansList, setPlansList] = useState([]);

  const [formData, setFormData] = useState({
    trustName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    password: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
    registrationNo: 'REG-' + Date.now().toString().slice(-6),
    panNo: '',
    fcraNo: '',
    section80GRegNo: '',
    plan: 'Standard',
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
    // Fetch active plans for dropdown
    fetch('/api/plans?status=Active')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setPlansList(d.data);
        }
      })
      .catch(() => {});

    if (editId) {
      setLoading(true);
      fetch(`/api/users/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const u = d.data;
            setFormData({
              trustName: u.trustName || u.name || '',
              contactPerson: u.contactPerson || u.name || '',
              email: u.email || '',
              mobile: u.mobile || '',
              password: '',
              registrationNo: u.registrationNo || '',
              panNo: u.panNo || '',
              fcraNo: u.fcraNo || '',
              section80GRegNo: u.section80GRegNo || '',
              plan: u.plan || 'Standard',
              status: u.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching user:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      let numericVal = value.replace(/\D/g, '').slice(0, 10);
      if (numericVal.length > 0 && !/^[6-9]/.test(numericVal)) {
        numericVal = numericVal.replace(/^[^6-9]+/, '');
      }
      setFormData(prev => ({ ...prev, mobile: numericVal }));
      return;
    }
    if (name === 'panNo') {
      const cleanPan = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, panNo: cleanPan }));
      return;
    }
    if (name === 'contactPerson') {
      const cleanName = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, contactPerson: cleanName }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trustName.trim() || !formData.email.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Trust Name and Email ID are mandatory.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Email Address',
        message: 'Please enter a valid email address (e.g. admin@trust.org).',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Mobile Number',
        message: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (formData.contactPerson && !/^[a-zA-Z\s]+$/.test(formData.contactPerson.trim())) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Contact Person Name',
        message: 'Contact Person name must contain only letters and spaces.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.trim())) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid PAN Number',
        message: 'Please enter a valid 10-character PAN number without special characters (e.g. ABCDE1234F).',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users';
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
          title: editId ? 'Trust Account Updated' : 'Trust Registered',
          message: editId
            ? 'The trust account information was successfully updated.'
            : 'New trust was registered successfully. Login credentials generated.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/users');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to save trust user');
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'An error occurred while saving the trust account.',
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
            <span>{editId ? 'EDIT TRUST PROFILE' : 'NEW TRUST REGISTRATION'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? 'Edit Trust Account' : 'Add New User (Trust)'}
          </h1>
          <p className="mint-hero-subtitle">
            Onboard a new NGO or charitable trust account, configure statutory identifiers, and assign a subscription plan.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/superadmin/users')}
            title="View All Users"
          >
            <List size={16} />
            <span>All Users</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading trust account details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Trust Name, Contact Person, Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Trust / Org Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="trustName"
                  value={formData.trustName}
                  onChange={handleChange}
                  placeholder="e.g. Hope Welfare Foundation"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. Managing Trustee / Admin"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Email Address (Login ID) <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@trust.org"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 2: Mobile, Password, Registration No */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Mobile / WhatsApp No</label>
                <input
                  type="tel"
                  name="mobile"
                  maxLength={10}
                  inputMode="numeric"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  {editId ? 'Reset Password (optional)' : 'Initial Password'}
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={editId ? 'Leave blank to keep current' : 'e.g. Admin@2026'}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Registration / NGO Darpan No</label>
                <input
                  type="text"
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  placeholder="e.g. TN/2024/001928"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 3: PAN, FCRA, 80G Reg No */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Trust PAN Number</label>
                <input
                  type="text"
                  name="panNo"
                  value={formData.panNo}
                  onChange={handleChange}
                  placeholder="e.g. AABCT1234F"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={labelStyle}>FCRA Registration No (optional)</label>
                <input
                  type="text"
                  name="fcraNo"
                  value={formData.fcraNo}
                  onChange={handleChange}
                  placeholder="Optional FCRA approval number"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>80G Order / Ref Number</label>
                <input
                  type="text"
                  name="section80GRegNo"
                  value={formData.section80GRegNo}
                  onChange={handleChange}
                  placeholder="e.g. CIT(E)/80G/2023-24/A-102"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 4: Assigned Plan, Account Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div>
                <label style={labelStyle}>Assigned Subscription Plan</label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Free Starter">Free Starter (₹0)</option>
                  <option value="Standard">Standard (Annual)</option>
                  <option value="Premium Pro">Premium Pro (Annual)</option>
                  <option value="Enterprise">Enterprise Tier</option>
                  {plansList.map(p => (
                    <option key={p._id} value={p.name}>
                      {p.name} (₹{p.price}/{p.billingCycle || 'yr'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Active">Active (Full Access)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                  <option value="Suspended">Suspended (Payment Pending)</option>
                </select>
              </div>
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
                <span>{isSubmitting ? 'Saving...' : editId ? 'Update Trust Account' : 'Save & Register Trust'}</span>
              </button>

              <button
                type="button"
                className="btn-trust-outline"
                onClick={() => navigate('/superadmin/users')}
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
