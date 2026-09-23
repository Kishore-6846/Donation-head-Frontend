import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { ChevronUp, Sparkles, Pencil } from 'lucide-react';
import { getCurrentUser, isSuperUser, getSuperAdminSession, getTrustSession } from '../utils/authStorage';

export default function MyProfilePage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const getActiveUser = () => {
    if (isSuperAdmin) {
      const superSess = getSuperAdminSession()?.user;
      if (superSess && isSuperUser(superSess)) return superSess;
      if (user && isSuperUser(user)) return user;
      return {
        _id: 'usr_superadmin',
        name: 'DONATION RECEIPT SUPER ADMIN',
        trustName: 'DONATION RECEIPT SUPER ADMIN',
        contactPerson: 'Super Administrator',
        email: 'admin@donationreceipt.in',
        role: 'SuperAdmin',
        isSuperAdmin: true,
        status: 'Active'
      };
    }
    const trustSess = getTrustSession()?.user;
    if (trustSess && !isSuperUser(trustSess)) return trustSess;
    if (user && !isSuperUser(user)) return user;
    return {};
  };

  const buildProfileFromUser = (u) => {
    if (!u) u = {};
    const tName = isSuperAdmin
      ? (u.trustName || u.name || 'DONATION RECEIPT SUPER ADMIN')
      : ((u.trustName && u.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? u.trustName : '') || (u.name && !isSuperUser(u) && u.name !== u.contactPerson && u.name !== u.signatoryName ? u.name : '') || (u.name && !isSuperUser(u) ? u.name : '') || 'Trust Organization');
    const rawPrefix = tName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'REC';
    const cPerson = isSuperAdmin
      ? (u.contactPerson || u.name || 'Super Administrator')
      : (u.contactPerson || (u.name && !isSuperUser(u) ? u.name : '') || '');

    return {
      _id: u._id || u.id || '',
      name: tName,
      email: u.email || (isSuperAdmin ? 'admin@donationreceipt.in' : ''),
      phone: u.mobile || u.phone || '',
      address: u.address || '',
      state: u.state || 'Tamil Nadu',
      registrationNo: u.registrationNo || '',
      panNo: u.panNo || '',
      website: u.website || '',
      contactPerson: cPerson,
      contactPersonMobile: u.contactPersonMobile || u.mobile || u.phone || '',
      contactPersonEmail: u.contactPersonEmail || u.email || '',
      logo: u.logo || '',
      signature: u.signature || '',

      emailSubject: u.emailSubject || `Thank You & Stay Connected! - ${tName}`,
      emailBody: u.emailBody || `Thank you for your generous support! Your kindness fuels our mission at ${tName}. Grateful for you!\n${u.website || ''} | ${u.mobile || u.phone || ''} | ${u.email || ''}`,
      signatoryName: u.signatoryName || cPerson,
      signatoryPan: u.signatoryPan || u.panNo || '',
      registrationType: u.registrationType || '12A',
      reg12ANo: u.reg12ANo || u.section80GRegNo || u.registrationNo || '',
      reg12ADate: u.reg12ADate || new Date().toISOString().split('T')[0],
      fcraNo: u.fcraNo || '',
      receiptPrefix: u.receiptPrefix || `${rawPrefix}/2026-27/`,
      receiptStartNumber: u.receiptStartNumber || '1',
      receiptWatermarkText: (u.receiptWatermarkText !== undefined && u.receiptWatermarkText !== null)
        ? u.receiptWatermarkText
        : rawPrefix,

      // Dynamic per-admin SMTP email fields
      smtpEmail: u.smtpEmail || u.email || '',
      smtpPassword: u.smtpPassword || '',
      smtpHost: u.smtpHost || 'smtp.gmail.com',
      smtpPort: u.smtpPort || 465,
      smtpService: u.smtpService || 'gmail'
    };
  };

  const getInitialProfile = () => {
    const activeUser = getActiveUser();
    const userEmail = (activeUser?.email || '').toLowerCase().trim();

    // Check user-scoped cache first
    if (userEmail) {
      const userCache = localStorage.getItem(`profile_data_${userEmail}`);
      if (userCache) {
        try {
          const parsed = JSON.parse(userCache);
          if (parsed && (parsed.email?.toLowerCase() === userEmail || parsed.name)) {
            if (isSuperAdmin && !isSuperUser(parsed)) {
              // Ignore non-super cache for SuperAdmin
            } else if (!isSuperAdmin && isSuperUser(parsed)) {
              // Ignore super cache for Trust
            } else {
              return { ...buildProfileFromUser(activeUser), ...parsed };
            }
          }
        } catch (e) {}
      }
    }

    return buildProfileFromUser(activeUser);
  };

  const [profileData, setProfileData] = useState(getInitialProfile);

  useEffect(() => {
    const activeUser = getActiveUser();
    setProfileData(getInitialProfile());

    // Only fetch live backend record for Trust Admin to avoid overriding SuperAdmin
    if (!isSuperAdmin) {
      const targetId = activeUser._id || activeUser.id || activeUser.email;
      if (targetId) {
        fetch(`/api/users/${encodeURIComponent(targetId)}`)
          .then(r => r.json())
          .then(data => {
            const fetched = data?.data || data?.user || (data?.email ? data : null);
            if (fetched && (fetched.email || fetched.name || fetched.trustName)) {
              if (isSuperUser(fetched)) return;

              const freshProfile = buildProfileFromUser(fetched);
              setProfileData(freshProfile);
              if (fetched.email) {
                localStorage.setItem(`profile_data_${fetched.email.toLowerCase()}`, JSON.stringify(freshProfile));
              }
            }
          })
          .catch(() => {});
      }
    }

    const handleSessionChange = (e) => {
      setProfileData(getInitialProfile());
    };

    window.addEventListener('trust-session-change', handleSessionChange);
    window.addEventListener('superadmin-session-change', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);

    return () => {
      window.removeEventListener('trust-session-change', handleSessionChange);
      window.removeEventListener('superadmin-session-change', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [user, location.pathname, isSuperAdmin]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{isSuperAdmin ? 'SUPER ADMIN PROFILE' : 'TRUST SETTINGS'}</span>
          </div>
          <h1 className="mint-hero-title">My Profile</h1>
          <p className="mint-hero-subtitle">
            {isSuperAdmin
              ? 'Overview of platform super administrator credentials and system configurations.'
              : 'Overview of trust registration numbers, 12A/80G compliance credentials, and receipt configurations.'}
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate(isSuperAdmin ? '/superadmin/edit-profile' : '/trust/edit-profile')}
          >
            <Pencil size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div style={{ paddingBottom: '60px' }}>

        {/* Profile Content: 2-Column Exact Table Layout */}
        <div className="profile-view-grid">
          {/* ================= LEFT COLUMN ================= */}
          <div className="profile-left-col">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* Name */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ width: '38%', padding: '12px 16px', fontWeight: '500', color: '#333' }}>Name (Trust Name)</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    <strong>{profileData.name}</strong>
                  </td>
                </tr>

                {/* Email */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Email</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.email}
                  </td>
                </tr>

                {/* Phone */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Phone</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.phone}
                  </td>
                </tr>

                {/* Address */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Address</td>
                  <td style={{ padding: '12px 16px', color: '#111', lineHeight: '1.5' }}>
                    {profileData.address}
                  </td>
                </tr>

                {/* State */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>State</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.state}
                  </td>
                </tr>

                {/* Registration No. */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Registration No.</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.registrationNo}
                  </td>
                </tr>

                {/* PAN No */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>PAN No</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.panNo}
                  </td>
                </tr>

                {/* Website */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Website</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.website}
                  </td>
                </tr>

                {/* Contact Person */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Contact Person</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.contactPerson}
                  </td>
                </tr>

                {/* Contact Person Mobile No. */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Contact Person Mobile No.</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.contactPersonMobile}
                  </td>
                </tr>

                {/* Contact Person Email */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Contact Person Email</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.contactPersonEmail}
                  </td>
                </tr>

                {/* Logo */}
                <tr>
                  <td style={{ padding: '16px', fontWeight: '500', color: '#333', verticalAlign: 'top' }}>Logo</td>
                  <td style={{ padding: '16px' }}>
                    <div
                      style={{
                        width: '130px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        marginBottom: '10px'
                      }}
                    >
                      {profileData.logo ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', minHeight: '48px', alignItems: 'center' }}>
                            <img src={profileData.logo} alt="Trust Logo" style={{ maxHeight: '52px', maxWidth: '110px', objectFit: 'contain' }} />
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#222' }}>
                            {profileData.name}
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '10px 4px', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                          No logo uploaded yet.
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#555', lineHeight: '1.4' }}>
                      ⓘ Your logo will be displayed as{' '}
                      <span style={{ color: '#0d6efd', textDecoration: 'underline', cursor: 'pointer' }}>
                        Our Esteemed Client
                      </span>{' '}
                      on our website
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* Email Subject */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ width: '38%', padding: '12px 16px', fontWeight: '500', color: '#333' }}>Email Subject</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.emailSubject}
                  </td>
                </tr>

                {/* Email Body */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333', verticalAlign: 'top' }}>Email Body</td>
                  <td style={{ padding: '12px 16px', color: '#333', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                    {profileData.emailBody}
                  </td>
                </tr>

                {/* Outgoing Sender Email (Dynamic per Admin) */}
                <tr style={{ borderBottom: '1px solid #f1f3f5', background: '#f0fdf4' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#166534' }}>Outgoing Dispatch Email</td>
                  <td style={{ padding: '12px 16px', color: '#166534', fontWeight: '500' }}>
                    {profileData.smtpEmail || profileData.email || 'Not configured'}
                    {profileData.smtpPassword ? (
                      <span style={{ marginLeft: '8px', fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                        ✓ Custom Gmail / SMTP Active
                      </span>
                    ) : (
                      <span style={{ marginLeft: '8px', fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                        Platform Default
                      </span>
                    )}
                  </td>
                </tr>

                {/* Authorized Signatory Signature */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333', verticalAlign: 'middle' }}>Authorized Signatory Signature</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ border: '1px solid #eee', background: '#fafafa', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', borderRadius: '4px', minHeight: '44px' }}>
                      {profileData.signature ? (
                        <img
                          src={profileData.signature}
                          alt="Authorized Signature"
                          style={{ maxHeight: '44px', maxWidth: '160px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic', fontSize: '12.5px' }}>
                          No signature photo uploaded yet.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Authorized Signatory Name */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Authorized Signatory Name</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.signatoryName}
                  </td>
                </tr>

                {/* Authorized Signatory PAN */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Authorized Signatory PAN</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.signatoryPan}
                  </td>
                </tr>

                {/* Registration Type (12A Or 10(23C)) */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Registration Type (12A Or 10(23C))</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.registrationType}
                  </td>
                </tr>

                {/* 12A Registration No. */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>12A Registration No.</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.reg12ANo}
                  </td>
                </tr>

                {/* 12A Registration Date */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>12A Registration Date</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.reg12ADate}
                  </td>
                </tr>

                {/* FCRA Registration No. */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>FCRA Registration No.</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.fcraNo || ''}
                  </td>
                </tr>

                {/* Receipt Number Prefix */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Receipt Number Prefix</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    <strong>{profileData.receiptPrefix}</strong>
                  </td>
                </tr>

                {/* Receipt Start Number */}
                <tr style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Receipt Start Number</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.receiptStartNumber}
                  </td>
                </tr>

                {/* Receipt Watermark Text */}
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#333' }}>Receipt Watermark Text</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>
                    {profileData.receiptWatermarkText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            className="btn-primary-green"
            onClick={() => navigate(isSuperAdmin ? '/superadmin/edit-profile' : '/trust/edit-profile')}
            style={{ padding: '10px 28px', fontSize: '14px', borderRadius: '8px' }}
          >
            Edit Profile
          </button>

          <button
            type="button"
            className="btn-primary-green"
            onClick={() => setIsPasswordModalOpen(true)}
            style={{ padding: '10px 28px', fontSize: '14px', borderRadius: '8px' }}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header-green">
              <h3>Change Password</h3>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsPasswordModalOpen(false); setSuccessPopup(true); }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Old Password</label>
                  <input type="password" required className="form-control" placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" required className="form-control" placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" required className="form-control" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-green">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SimplePopup
        isOpen={successPopup}
        type="success"
        title="Password Updated"
        message="Password successfully changed!"
        confirmText="OK"
        onConfirm={() => setSuccessPopup(false)}
        onCancel={() => setSuccessPopup(false)}
      />
    </>
  );
}
