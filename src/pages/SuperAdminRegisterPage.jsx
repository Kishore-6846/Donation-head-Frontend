import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import { Lock, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { setSuperAdminSession } from '../utils/authStorage';

const INDIAN_STATES = [
  'Andaman Nicobar',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

export default function SuperAdminRegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    consoleTitle: 'DONATION RECEIPT SUPER ADMIN',
    designation: 'Principal Super Administrator',
    state: '',
    securityKey: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericVal }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid Official Email address (e.g. admin@donationreceipt.in).');
      return;
    }

    if (!formData.mobile || formData.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Please enter a password of at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (!formData.state) {
      setError('Please select your State / Operating Region.');
      return;
    }

    if (!agreedPrivacy) {
      setError('Please agree to the Super Admin Governance & Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.fullName,
        contactPerson: formData.fullName,
        trustName: formData.consoleTitle || 'DONATION RECEIPT SUPER ADMIN',
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        state: formData.state,
        role: 'Super Admin',
        isSuperAdmin: true,
        securityKey: formData.securityKey
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      const superAdminUser = {
        id: data.user?.id || data.user?._id || ('usr_superadmin_' + Date.now()),
        name: formData.fullName || 'Super Administrator',
        email: formData.email,
        mobile: formData.mobile,
        trustName: formData.consoleTitle || 'DONATION RECEIPT SUPER ADMIN',
        role: 'Super Admin',
        state: formData.state,
        isSuperAdmin: true
      };

      if (data.success) {
        setSuccessMsg(data.message || 'Super Admin account created successfully!');
        setSuperAdminSession(superAdminUser, data.token);

        if (onLoginSuccess) {
          onLoginSuccess(superAdminUser);
        }

        setTimeout(() => {
          navigate('/superadmin');
        }, 1200);
      } else {
        setError(data.message || 'Registration failed. Please verify the information entered.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Top green accent strip */}
      <div style={{ height: '4px', backgroundColor: '#00a651', width: '100%' }} />

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #eef2f5', padding: '10px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/superadmin/register" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={navLogo} alt="Super Admin Console" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.4px'
              }}
            >
              SUPER ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/superadmin/register"
              style={{
                backgroundColor: '#00a651',
                color: '#ffffff',
                padding: '7px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Registration
            </Link>
            <Link
              to="/superadmin/login"
              style={{
                border: '1px solid #ced4da',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333333',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Green Divider Strip */}
      <div style={{ backgroundColor: '#00a651', height: '5px', width: '100%' }} />

      {/* Registration Card Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 15px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '820px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            
            {/* Green Header Banner */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', textAlign: 'center', padding: '26px 20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }}>
                <Shield size={24} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Create Super Admin Account
              </h2>
              <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0', opacity: 0.95 }}>
                Centralized Platform Administration &amp; Multi-Trust Management
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  padding: '6px 16px',
                  borderRadius: '30px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginTop: '4px'
                }}
              >
                <span>✓ Master Platform Governance</span>
                <span style={{ opacity: 0.7 }}>|</span>
                <span>✓ Trust &amp; Subscription Oversight</span>
                <span style={{ opacity: 0.7 }}>|</span>
                <span>✓ Enterprise 256-Bit SSL Security</span>
              </div>
            </div>

            {/* Card Content Form */}
            <div style={{ padding: '32px 30px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', fontSize: '13.5px', marginBottom: '20px' }}>
                  <AlertCircle size={18} flexShrink={0} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '6px', fontSize: '13.5px', marginBottom: '20px' }}>
                  <CheckCircle2 size={18} flexShrink={0} />
                  <span>{successMsg} Redirecting to Super Admin Console...</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eafaf1' }}>
                  <Shield size={20} color="#00a651" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Super Administrator Registration Form
                  </h3>
                </div>

                {/* Form Fields Grid: 2 columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Super Administrator Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Master Administrator / Sivaraman"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Super Admin Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Official Email Address <span style={{ color: '#ef4444' }}>*</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (This cannot be changed later)
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter official email address"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (Min. 6 characters)
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        minLength={6}
                        placeholder="Create strong password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 42px 10px 14px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        minLength={6}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 42px 10px 14px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Entity / Console Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Console Title / Authority Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="consoleTitle"
                      required
                      placeholder="DONATION RECEIPT SUPER ADMIN"
                      value={formData.consoleTitle}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* State / Region */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Operating State / Region <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Select State / Region</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Master Security Key */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Master Security Key / Pin
                    </label>
                    <input
                      type="text"
                      name="securityKey"
                      placeholder="Enter master security key"
                      value={formData.securityKey}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Privacy & Governance Policy Checkbox */}
                <div style={{ marginTop: '22px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="agreeSuperAdminPrivacy"
                    required
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00a651', marginTop: '2px' }}
                  />
                  <label htmlFor="agreeSuperAdminPrivacy" style={{ fontSize: '13.5px', color: '#334155', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the Super Administrator Governance Terms and{' '}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      style={{ color: '#00a651', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#00a651',
                    color: '#ffffff',
                    border: 'none',
                    padding: '13px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '22px',
                    boxShadow: '0 3px 10px rgba(0, 166, 81, 0.3)',
                    transition: 'background-color 0.2s',
                    letterSpacing: '-0.2px'
                  }}
                >
                  {loading ? 'Registering Super Administrator...' : 'Complete Super Admin Registration'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              {/* Already Registered Link */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  Already have a Super Admin Account?{' '}
                  <Link
                    to="/superadmin/login"
                    style={{ color: '#00a651', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Login to Console.
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer inside card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                textAlign: 'center',
                borderTop: '1px solid #eef2f6',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Lock size={14} color="#00a651" />
              <Link
                to="/trust/login"
                style={{
                  color: '#00a651',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Admin Login</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Support Contacts */}
          <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#6c757d', lineHeight: '1.7' }}>
            Super Admin Help Desk:{' '}
            <a href="mailto:admin@donationreceipt.in" style={{ color: '#00a651', fontWeight: '600' }}>
              admin@donationreceipt.in
            </a>
          </div>
        </div>
      </div>

      {/* Website Footer Area */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #eef2f5', padding: '20px 0' }}>
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '13px',
            color: '#6c757d'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/cancellation-refund-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in Super Admin Console.
          </div>
        </div>
      </footer>
    </div>
  );
}
