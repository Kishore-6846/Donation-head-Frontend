import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Save, Building, Award, Shield, FileText, CheckCircle2, Mail, Key, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage({ user, onUpdateUser }) {
  const getInitialProfile = () => {
    const activeUser = user || (() => {
      try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch (e) { return {}; }
    })();
    const uEmail = (activeUser?.email || '').toLowerCase().trim();

    let parsed = {};
    if (uEmail) {
      try {
        parsed = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
      } catch (e) {}
    }

    return {
      trustName: parsed.name || parsed.trustName || activeUser?.trustName || activeUser?.name || '',
      registrationNo: parsed.registrationNo || activeUser?.registrationNo || '',
      panNo: parsed.panNo || activeUser?.panNo || '',
      fcraNo: parsed.fcraNo || activeUser?.fcraNo || '',
      section80GRegNo: parsed.reg12ANo || parsed.section80GRegNo || activeUser?.section80GRegNo || '',
      address: parsed.address || activeUser?.address || '',
      email: parsed.email || activeUser?.email || '',
      phone: parsed.phone || activeUser?.mobile || activeUser?.phone || '',
      signatoryName: parsed.signatoryName || activeUser?.contactPerson || 'Authorized Trustee',
      signatoryDesignation: parsed.designation || activeUser?.designation || 'Managing Trustee',
      // Dynamic per-admin SMTP email fields
      smtpEmail: parsed.smtpEmail || activeUser?.smtpEmail || activeUser?.email || '',
      smtpPassword: parsed.smtpPassword || activeUser?.smtpPassword || '',
      smtpHost: parsed.smtpHost || activeUser?.smtpHost || 'smtp.gmail.com',
      smtpPort: parsed.smtpPort || activeUser?.smtpPort || 465,
      smtpService: parsed.smtpService || activeUser?.smtpService || 'gmail'
    };
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [savedMessage, setSavedMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProfile(getInitialProfile());
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'mobile') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setProfile(prev => ({ ...prev, [name]: numericVal }));
      return;
    }
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (profile.phone && profile.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsSaving(true);

    const updatedUser = {
      ...(user || {}),
      trustName: profile.trustName,
      name: profile.trustName || user?.name,
      registrationNo: profile.registrationNo,
      panNo: profile.panNo,
      fcraNo: profile.fcraNo,
      section80GRegNo: profile.section80GRegNo,
      address: profile.address,
      email: profile.email,
      mobile: profile.phone,
      contactPerson: profile.signatoryName,
      designation: profile.signatoryDesignation,
      // Save dynamic per-admin SMTP
      smtpEmail: profile.smtpEmail.trim(),
      smtpPassword: profile.smtpPassword.trim(),
      smtpHost: profile.smtpHost.trim() || 'smtp.gmail.com',
      smtpPort: Number(profile.smtpPort) || 465,
      smtpService: profile.smtpService || 'gmail'
    };

    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    localStorage.removeItem('profile_data');
    if (updatedUser.email) {
      localStorage.setItem(`profile_data_${updatedUser.email.toLowerCase()}`, JSON.stringify({
        name: profile.trustName,
        registrationNo: profile.registrationNo,
        panNo: profile.panNo,
        fcraNo: profile.fcraNo,
        reg12ANo: profile.section80GRegNo,
        section80GRegNo: profile.section80GRegNo,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        signatoryName: profile.signatoryName,
        designation: profile.signatoryDesignation,
        smtpEmail: profile.smtpEmail,
        smtpPassword: profile.smtpPassword,
        smtpHost: profile.smtpHost,
        smtpPort: profile.smtpPort,
        smtpService: profile.smtpService
      }));
    }

    // Persist to Backend API
    try {
      const targetId = updatedUser._id || updatedUser.id || updatedUser.email;
      if (targetId) {
        await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        });
      }
    } catch (err) {
      console.warn('Error persisting profile to server:', err);
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setIsSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3500);
  };

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Home', link: '/trust' }, { label: 'My Profile' }]} />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Shield size={12} />
            <span>ORGANIZATION PROFILE & EMAIL SETTINGS</span>
          </div>
          <h1 className="mint-hero-title">My Profile</h1>
          <p className="mint-hero-subtitle">
            Manage your trust legal entity details, registration numbers, letterhead addresses, and outgoing email credentials.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '14px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontWeight: '600', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={20} color="#059669" />
          Profile and Outgoing Email settings updated successfully! All future receipts will reflect these details.
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column: Organization & Email Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Card 1: Trust Details */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#00a651" /> Organization Information
              </h3>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Trust / NGO Legal Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="trustName"
                  className="trust-input"
                  style={{ width: '100%' }}
                  value={profile.trustName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Trust Registration No.
                  </label>
                  <input
                    type="text"
                    name="registrationNo"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.registrationNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Trust PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNo"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.panNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Section 80G / 12A Order Number
                  </label>
                  <input
                    type="text"
                    name="section80GRegNo"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.section80GRegNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    FCRA Registration Number
                  </label>
                  <input
                    type="text"
                    name="fcraNo"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.fcraNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Registered Office Address
                </label>
                <textarea
                  name="address"
                  className="trust-input"
                  style={{ width: '100%', height: '70px', resize: 'vertical' }}
                  rows="2"
                  value={profile.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Phone / WhatsApp Support
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Dynamic Per-Trust Outgoing Email (SMTP) Settings */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="#15803d" /> Outgoing Email Dispatch Settings (Dynamic per Admin)
                </h3>
                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  Dynamic Sender
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: '1.5' }}>
                Configure your own Gmail or SMTP email credentials below so that all 80G receipt emails and attached PDFs are dispatched directly from <strong>your trust's own email address</strong> to donors.
              </p>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Sender Email / Gmail ID:
                  </label>
                  <input
                    type="email"
                    name="smtpEmail"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={profile.smtpEmail}
                    onChange={handleChange}
                    placeholder="e.g. maharajatrust@gmail.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Gmail App Password / SMTP Password:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="smtpPassword"
                      className="trust-input"
                      style={{ width: '100%', paddingRight: '40px' }}
                      value={profile.smtpPassword}
                      onChange={handleChange}
                      placeholder="16-digit Google App Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px', color: '#166534', lineHeight: '1.5' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>💡 How to generate a Gmail App Password (1 minute):</div>
                <div>1. Enable <strong>2-Step Verification</strong> on your Gmail account.</div>
                <div>2. Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#15803d', fontWeight: '700', textDecoration: 'underline' }}>Google App Passwords</a>.</div>
                <div>3. Type App Name <strong>Donation Receipt</strong> and click Generate. Copy the 16-letter password and paste it above!</div>
              </div>
            </div>
          </div>

          {/* Right Column: Signatory & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#00a651" /> Authorized Signatory
              </h3>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Signatory Name
                </label>
                <input
                  type="text"
                  name="signatoryName"
                  className="trust-input"
                  style={{ width: '100%' }}
                  value={profile.signatoryName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Signatory Designation
                </label>
                <input
                  type="text"
                  name="signatoryDesignation"
                  className="trust-input"
                  style={{ width: '100%' }}
                  value={profile.signatoryDesignation}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-trust-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="trust-card" style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="#00a651" /> Statutory 80G Order Note
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                These registration numbers will automatically print on all generated 80G tax exemption receipts and sync into Form No. 10BD filings.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
