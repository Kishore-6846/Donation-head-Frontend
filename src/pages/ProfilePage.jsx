import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Save, CheckCircle, Building, Award, Shield, FileText, CheckCircle2 } from 'lucide-react';

export default function ProfilePage({ user, onUpdateUser }) {
  const getInitialProfile = () => {
    const activeUser = user || (() => {
      try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch (e) { return {}; }
    })();
    const uEmail = (activeUser?.email || '').toLowerCase().trim();

    if (uEmail) {
      try {
        const parsed = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
        if (parsed && typeof parsed === 'object' && (parsed.name || parsed.trustName)) {
          return {
            trustName: parsed.name || parsed.trustName || activeUser?.trustName || '',
            registrationNo: parsed.registrationNo || activeUser?.registrationNo || '',
            panNo: parsed.panNo || activeUser?.panNo || '',
            fcraNo: parsed.fcraNo || activeUser?.fcraNo || '',
            section80GRegNo: parsed.reg12ANo || parsed.section80GRegNo || activeUser?.section80GRegNo || '',
            address: parsed.address || activeUser?.address || '',
            email: parsed.email || activeUser?.email || '',
            phone: parsed.phone || activeUser?.mobile || activeUser?.phone || '',
            signatoryName: parsed.signatoryName || activeUser?.contactPerson || 'Authorized Trustee',
            signatoryDesignation: parsed.designation || activeUser?.designation || 'Managing Trustee'
          };
        }
      } catch (e) {}
    }

    return {
      trustName: user?.trustName || user?.name || '',
      registrationNo: user?.registrationNo || '',
      panNo: user?.panNo || '',
      fcraNo: user?.fcraNo || '',
      section80GRegNo: user?.section80GRegNo || '',
      address: user?.address || '',
      email: user?.email || '',
      phone: user?.mobile || user?.phone || '',
      signatoryName: user?.contactPerson || 'Authorized Trustee',
      signatoryDesignation: user?.designation || 'Managing Trustee'
    };
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [savedMessage, setSavedMessage] = useState(false);

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

  const handleSave = (e) => {
    e.preventDefault();

    if (profile.phone && profile.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

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
      designation: profile.signatoryDesignation
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
        designation: profile.signatoryDesignation
      }));
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

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
            <span>ORGANIZATION PROFILE</span>
          </div>
          <h1 className="mint-hero-title">My Profile</h1>
          <p className="mint-hero-subtitle">
            Manage your trust legal entity details, registration numbers, and official letterhead addresses.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '14px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontWeight: '600', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={20} color="#059669" />
          Profile updated successfully! All future receipts and reports will reflect these details.
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Card: Trust Details */}
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
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNo"
                  className="trust-input"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={profile.panNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  80G Unique Registration No. (URN)
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

          {/* Right Card: Signatory & Actions */}
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
                className="btn-trust-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} /> Save Changes
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
