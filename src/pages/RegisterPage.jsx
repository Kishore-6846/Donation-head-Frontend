import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import { Lock, FileText, CheckCircle2, AlertCircle, Upload, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';

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

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    trustName: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
    state: '',
    registrationNo: '',
    panNo: '',
    website: '',
    contactPerson: '',
    contactPersonEmail: '',
    contactPersonMobile: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must not exceed 2MB');
        e.target.value = null;
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }
      setError('');
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password || formData.password.length < 6) {
      setError('Please enter a password of at least 6 characters.');
      return;
    }

    if (!agreedPrivacy) {
      setError('Please agree to the Privacy Policy to continue.');
      return;
    }

    if (!formData.state) {
      setError('Please select your State.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        logo: logoPreview || ''
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      const rawPrefix = (formData.trustName || 'REC')
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'REC';

      const registeredProfile = {
        name: formData.trustName,
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        state: formData.state,
        registrationNo: formData.registrationNo || ('REG-' + Date.now().toString().slice(-6)),
        panNo: formData.panNo,
        website: formData.website,
        contactPerson: formData.contactPerson,
        contactPersonMobile: formData.contactPersonMobile || formData.mobile,
        contactPersonEmail: formData.contactPersonEmail || formData.email,
        logo: logoPreview || '',
        emailSubject: `Thank You & Stay Connected! - ${formData.trustName}`,
        emailBody: `Thank you for your generous support! Your kindness fuels our mission at ${formData.trustName}. Grateful for you!\n${formData.website || ''} | ${formData.mobile || ''} | ${formData.email || ''}`,
        signatoryName: formData.contactPerson,
        signatoryPan: formData.panNo,
        registrationType: '12A',
        reg12ANo: formData.registrationNo || ('REG-' + Date.now().toString().slice(-6)),
        reg12ADate: new Date().toISOString().split('T')[0],
        fcraNo: '',
        receiptPrefix: `${rawPrefix}/2026-27/`,
        receiptStartNumber: '1',
        receiptWatermarkText: rawPrefix
      };

      if (data.success) {
        setSuccessMsg(data.message || 'Registration successful! Your 48-Hour Free Trial has started.');
        const fullUser = {
          ...data.user,
          ...registeredProfile,
          trustName: formData.trustName
        };

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(fullUser));
        localStorage.removeItem('profile_data');
        if (formData.email) {
          localStorage.setItem(`profile_data_${formData.email.toLowerCase()}`, JSON.stringify(registeredProfile));
        }

        if (onLoginSuccess) {
          onLoginSuccess(fullUser);
        }

        setTimeout(() => {
          navigate('/trust/');
        }, 1200);
      } else {
        setError(data.message || 'Registration failed. Please check your information.');
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
      <div style={{ height: '4px', backgroundColor: '#00a651', width: '100%' }}></div>

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #eef2f5', padding: '10px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/trust/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={navLogo} alt="Donation Receipt" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
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
              ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/trust/register"
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
              to="/trust/login"
              style={{
                border: '1px solid #ced4da',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333333',
                textDecoration: 'none'
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Green Divider Strip */}
      <div style={{ backgroundColor: '#00a651', height: '5px', width: '100%' }}></div>

      {/* Registration Card Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 15px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '820px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            
            {/* Green Header Banner */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', textAlign: 'center', padding: '26px 20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Create Your Account
              </h2>
              <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0', opacity: 0.95 }}>
                Start Your FREE 48-Hours Trial
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
                <span>✓ No Payment Required During Registration</span>
                <span style={{ opacity: 0.7 }}>|</span>
                <span>✓ Annual Subscription: ₹1200 + GST Only</span>
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
                  <span>{successMsg} Redirecting to your dashboard...</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eafaf1' }}>
                  <FileText size={20} color="#00a651" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    NGO Registration Form
                  </h3>
                </div>

                {/* Form Fields Grid: 2 columns on desktop, 1 on small screens */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                  {/* Trust / NGO Name * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="trustName"
                      required
                      placeholder="Enter Trust / NGO Name"
                      value={formData.trustName}
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

                  {/* Email ID * (This cannot be changed later) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Email ID <span style={{ color: '#ef4444' }}>*</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (This cannot be changed later)
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@yourngo.org"
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

                  {/* Password * */}
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
                        placeholder="Create account password"
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Number * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
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

                  {/* Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Registered street address / city"
                      value={formData.address}
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

                  {/* State * (Select State + 36 Indian states & union territories) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      State <span style={{ color: '#ef4444' }}>*</span>
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
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trust/NGO Registration Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNo"
                      placeholder="e.g. U85300TN2021NPL142443 / 123/2021"
                      value={formData.registrationNo}
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

                  {/* Trust/NGO PAN */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO PAN
                    </label>
                    <input
                      type="text"
                      name="panNo"
                      placeholder="e.g. AAVCA0216A"
                      maxLength={10}
                      value={formData.panNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, panNo: e.target.value.toUpperCase() }))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        textTransform: 'uppercase',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      placeholder="https://yourngo.org"
                      value={formData.website}
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

                  {/* Contact Person * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      placeholder="Authorized Person / Trustee Name"
                      value={formData.contactPerson}
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

                  {/* Contact Person Email * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="contactPersonEmail"
                      required
                      placeholder="person@yourngo.org"
                      value={formData.contactPersonEmail}
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

                  {/* Contact Person Mobile * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person Mobile <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactPersonMobile"
                      required
                      placeholder="Contact person mobile number"
                      value={formData.contactPersonMobile}
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

                  {/* Trust/NGO Logo (Type: jpg, Max. size: 2MB) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Logo{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (Type: jpg, Max. size: 2MB)
                      </span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        onChange={handleLogoChange}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13.5px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      {logoPreview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>
                          <img src={logoPreview} alt="Logo preview" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                          <span style={{ fontSize: '12px', color: '#00a651', fontWeight: '600' }}>✓ Selected</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                      Your logo may be displayed in{' '}
                      <a
                        href="https://donationreceipt.in/our-clients.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#00a651', fontWeight: '600', textDecoration: 'underline' }}
                      >
                        Our Clients
                      </a>{' '}
                      section.
                    </p>
                  </div>
                </div>

                {/* Privacy Policy Checkbox */}
                <div style={{ marginTop: '22px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    required
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00a651', marginTop: '2px' }}
                  />
                  <label htmlFor="agreePrivacy" style={{ fontSize: '13.5px', color: '#334155', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the{' '}
                    <Link
                      to="/trust/privacy-policy"
                      target="_blank"
                      style={{ color: '#00a651', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button: Start Free Trail */}
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
                  {loading ? 'Submitting Registration...' : 'Start Free Trial'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              {/* Already Registered Link */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  Already Registered?{' '}
                  <Link
                    to="/trust/login"
                    style={{ color: '#00a651', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Login to Your Account.
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
              <Shield size={14} color="#00a651" />
              <Link
                to="/superadmin/login"
                style={{
                  color: '#00a651',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>SuperAdmin Login</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Support Contacts */}
          <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#6c757d', lineHeight: '1.7' }}>
            Need help?{' '}
            <a href="mailto:support@donationreceipt.in" style={{ color: '#00a651', fontWeight: '600' }}>
              support@donationreceipt.in
            </a>
            <br />
            Call us:{' '}
            <a href="tel:+919082151500" style={{ color: '#00a651', fontWeight: '600' }}>
              +91 90821 51500
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
            <Link to="/trust/terms-and-conditions" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/trust/cancellation-refund-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/trust/privacy-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
