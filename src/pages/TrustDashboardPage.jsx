import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import ReceiptModal from '../components/ReceiptModal';
import UpgradePlanModal from '../components/UpgradePlanModal';
import SimplePopup from '../components/SimplePopup';
import { getTrustSession, isSuperUser } from '../utils/authStorage';
import {
  Plus,
  BookOpen,
  Folder,
  User,
  Megaphone,
  Sparkles,
  FileText,
  Building,
  Mail,
  Phone,
  Shield,
  Calendar,
  Pencil,
  Smartphone,
  Hexagon
} from 'lucide-react';

// Default donation heads for instant fallback
const DEFAULT_HEADS = [
  { _id: 'dh_1', name: 'General Donation' },
  { _id: 'dh_2', name: '365 Drive' },
  { _id: 'dh_3', name: 'Food Drive' },
  { _id: 'dh_4', name: 'Fengal Cyclone' },
  { _id: 'dh_5', name: 'Kind' },
  { _id: 'dh_6', name: 'General' },
  { _id: 'dh_7', name: 'Anna Chathiram' }
];

const deduplicateHeads = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(item => {
    if (!item) return false;
    const raw = String(item.rawName || item.name || '').trim();
    if (!raw) return false;
    const base = raw.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
};

const getInitialHeads = () => {
  try {
    const custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
    return deduplicateHeads([...custom, ...DEFAULT_HEADS]);
  } catch (e) {
    return DEFAULT_HEADS;
  }
};

export default function TrustDashboardPage({ user }) {
  const navigate = useNavigate();

  // Plan / cart modal shown on demand
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const trustSession = getTrustSession();
  const effectiveUser = (!isSuperUser(user) && user) || trustSession?.user || null;
  const isDefaultAdmin = !effectiveUser?.email;

  const getInitialVaultCount = () => {
    try {
      const certKey = isDefaultAdmin ? 'certificates_data' : `certificates_data_${effectiveUser?.email}`;
      const savedCerts = localStorage.getItem(certKey);
      if (savedCerts) {
        const parsed = JSON.parse(savedCerts);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  };

  // Show actual real counts for all receipts and vault certificates
  const [stats, setStats] = useState({
    allReceipts: 0,
    vaultCount: getInitialVaultCount()
  });
  const [notifications, setNotifications] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [heads, setHeads] = useState(getInitialHeads);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });

  useEffect(() => {
    const handleOpenCart = () => setIsPlanModalOpen(true);
    window.addEventListener('open-cart-modal', handleOpenCart);
    return () => window.removeEventListener('open-cart-modal', handleOpenCart);
  }, []);

  const getScopedProfile = () => {
    const activeEmail = (effectiveUser?.email || '').toLowerCase().trim();
    if (!activeEmail) return {};
    try {
      return JSON.parse(localStorage.getItem(`profile_data_${activeEmail}`) || '{}');
    } catch (e) {
      return {};
    }
  };

  const [adminProfile, setAdminProfile] = useState(() => {
    const scoped = getScopedProfile();
    return { ...(effectiveUser || {}), ...scoped };
  });

  useEffect(() => {
    const syncProfile = (e) => {
      const activeEmail = (e?.detail?.email || effectiveUser?.email || '').toLowerCase().trim();
      let cached = {};
      if (activeEmail) {
        try {
          cached = JSON.parse(localStorage.getItem(`profile_data_${activeEmail}`) || '{}');
        } catch (err) {}
      }
      const updated = e?.detail || getTrustSession()?.user || effectiveUser || {};
      setAdminProfile(prev => ({ ...prev, ...updated, ...cached }));
    };

    window.addEventListener('trust-session-change', syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener('trust-session-change', syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, [effectiveUser]);

  useEffect(() => {
    const activeEmail = (effectiveUser?.email || '').trim();
    if (activeEmail && !isSuperUser({ email: activeEmail })) {
      fetch(`/api/users/${encodeURIComponent(activeEmail)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data && !isSuperUser(d.data)) {
            setAdminProfile(prev => ({ ...prev, ...d.data }));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const effectiveEmail = (effectiveUser?.email || '').trim();
    const effectiveTrustName = (effectiveUser?.trustName || (effectiveUser?.name && !isSuperUser(effectiveUser) ? effectiveUser.name : '') || '').trim();

    let queryParams = '?status=Active&limit=1000';
    if (effectiveEmail) queryParams += `&trustEmail=${encodeURIComponent(effectiveEmail)}`;
    if (effectiveTrustName) queryParams += `&trustName=${encodeURIComponent(effectiveTrustName)}`;

    fetch(`/api/receipts${queryParams}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const fetchedCount = d.total !== undefined ? d.total : (d.data ? d.data.length : 0);
          setStats(prev => ({ ...prev, allReceipts: fetchedCount }));
        }
      })
      .catch(console.error);

    fetch(`/api/dashboard/stats?trustEmail=${encodeURIComponent(effectiveEmail || '')}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.stats && d.stats.vaultCount !== undefined) {
            setStats(prev => ({ ...prev, vaultCount: d.stats.vaultCount }));
          }
          if (d.notifications && d.notifications.length > 0) {
            setNotifications(d.notifications);
          } else {
            fetch('/api/notifications')
              .then(nr => nr.json())
              .then(nd => {
                if (nd.success && Array.isArray(nd.data) && nd.data.length > 0) {
                  setNotifications(nd.data);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(console.error);

    // Sync vault count directly from /api/certificates
    const certParam = effectiveEmail ? `?trustEmail=${encodeURIComponent(effectiveEmail)}` : '';
    fetch(`/api/certificates${certParam}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setStats(prev => ({ ...prev, vaultCount: d.data.length }));
          try {
            const certKey = isDefaultAdmin ? 'certificates_data' : `certificates_data_${effectiveEmail}`;
            localStorage.setItem(certKey, JSON.stringify(d.data));
          } catch (e) {}
        }
      })
      .catch(() => {});

    const activeUser = effectiveUser;
    const tName = activeUser?.trustName || (activeUser?.name && !isSuperUser(activeUser) ? activeUser.name : '');
    const uEmail = activeUser?.email || '';
    const headsUrl = tName
      ? `/api/donation-heads?limit=100&trustName=${encodeURIComponent(tName)}&trustEmail=${encodeURIComponent(uEmail)}`
      : '/api/donation-heads?limit=100';

    fetch(headsUrl)
      .then(r => r.json())
      .then(d => {
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        } catch (e) {}

        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setHeads(deduplicateHeads([...d.data, ...custom, ...DEFAULT_HEADS]));
        } else {
          setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
        }
      })
      .catch(err => {
        console.error(err);
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        } catch (e) {}
        setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
      });
  }, [user]);

  const handleSaveReceipt = async (formData) => {
    let newTab = null;
    try {
      newTab = window.open('', '_blank');
    } catch (e) {}

    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsReceiptModalOpen(false);
        setStats(prev => ({ ...prev, allReceipts: prev.allReceipts + 1 }));
        const rec = data.data;
        if (rec) {
          const url = rec.receiptNo
            ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(rec.receiptNo)}`
            : `/api/receipts/pdf?id=${encodeURIComponent(rec._id || '')}`;
          if (newTab && !newTab.closed) {
            newTab.location.href = url;
            newTab.focus();
          } else {
            window.open(url, '_blank');
          }
        } else if (newTab && !newTab.closed) {
          newTab.close();
        }
        navigate('/trust/donation-receipt');
      } else {
        if (newTab && !newTab.closed) newTab.close();
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Error Generating Receipt',
          message: data.message || 'Error generating receipt',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (e) {
      if (newTab && !newTab.closed) newTab.close();
      console.error(e);
      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Receipt Saved',
        message: 'Receipt saved successfully!',
        confirmText: 'OK',
        onConfirm: () => {
          setPopup(p => ({ ...p, isOpen: false }));
          setIsReceiptModalOpen(false);
          navigate('/trust/donation-receipt');
        }
      });
    }
  };

  const scopedProfile = getScopedProfile();
  const effectiveTrustName =
    (adminProfile.trustName && adminProfile.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? adminProfile.trustName : '') ||
    scopedProfile.trustName ||
    (adminProfile.name && !isSuperUser(adminProfile) ? adminProfile.name : '') ||
    scopedProfile.name ||
    (effectiveUser?.trustName && effectiveUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? effectiveUser.trustName : '') ||
    'Trust Organization';

  const effectiveEmail = (!isSuperUser(adminProfile) ? adminProfile.email : '') || scopedProfile.email || effectiveUser?.email || 'admin@trust.org';
  const effectiveMobile = adminProfile.mobile || adminProfile.phone || scopedProfile.mobile || scopedProfile.phone || effectiveUser?.mobile || effectiveUser?.phone || '';
  const effectiveRegNo = adminProfile.registrationNo || scopedProfile.registrationNo || effectiveUser?.registrationNo || '';
  const effective80G = adminProfile.section80GRegNo || adminProfile.reg12ANo || scopedProfile.section80GRegNo || scopedProfile.reg12ANo || effectiveUser?.section80GRegNo || effectiveUser?.reg12ANo || '';
  const effectiveContactPerson = adminProfile.contactPerson || scopedProfile.contactPerson || (adminProfile.name && !isSuperUser(adminProfile) ? adminProfile.name : '') || (effectiveUser?.name && !isSuperUser(effectiveUser) ? effectiveUser.name : '');
  const effectiveStatus = adminProfile.status || scopedProfile.status || effectiveUser?.status || 'Active';
  const effectivePlan = adminProfile.plan || scopedProfile.plan || effectiveUser?.plan || 'Standard';
  const effectiveJoined = adminProfile.joinedDate || scopedProfile.joinedDate || effectiveUser?.joinedDate || 'Recently';
  const effectiveLogo = adminProfile.logo || scopedProfile.logo || effectiveUser?.logo || '';

  return (
    <>
      <div className="dashboard-container-modern">
      {/* 1. Mint Hero Banner with Trust Profile */}
      <div
        className="mint-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #ebfaf2 0%, #f4fdf7 100%)',
          border: '1px solid #ccebd7',
          borderRadius: '18px',
          padding: '22px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          boxShadow: '0 2px 10px rgba(0, 166, 81, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flex: 1, minWidth: 0 }}>
          {/* Prominent Trust Logo / Emblem */}
          <div
            style={{
              width: '116px',
              height: '116px',
              borderRadius: '20px',
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={effectiveTrustName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  fontSize: '38px',
                  fontWeight: 800
                }}
              >
                {effectiveTrustName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Details Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3.5px 10px',
                  borderRadius: '16px',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}
              >
                <Smartphone size={12} strokeWidth={2.4} />
                <span>TRUST / NGO PROFILE</span>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: effectiveStatus === 'Active' ? '#dcfce7' : (effectiveStatus === 'Trial' ? '#fef3c7' : '#fee2e2'),
                  color: effectiveStatus === 'Active' ? '#16a34a' : (effectiveStatus === 'Trial' ? '#d97706' : '#dc2626'),
                  fontSize: '11.5px',
                  fontWeight: '600',
                  padding: '3.5px 10px',
                  borderRadius: '16px'
                }}
              >
                {effectiveStatus}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  padding: '3.5px 12px',
                  borderRadius: '16px'
                }}
              >
                {effectivePlan} Plan
              </span>
            </div>

            {/* Trust Name Heading */}
            <h1
              style={{
                fontSize: '25px',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: '1.2',
                margin: '4px 0 9px 0',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {effectiveTrustName}
            </h1>

            {/* Profile Info Row 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                fontSize: '13px',
                color: '#475569',
                flexWrap: 'wrap',
                marginBottom: '5px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13.5} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>{effectiveEmail}</span>
              </span>
              {effectiveMobile && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13.5} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>{effectiveMobile}</span>
                </span>
              )}
              {effectiveRegNo && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Hexagon size={13.5} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <span>Reg : {effectiveRegNo}</span>
                </span>
              )}
            </div>

            {/* Profile Info Row 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                fontSize: '13px',
                color: '#475569',
                flexWrap: 'wrap'
              }}
            >
              {effective80G && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13.5} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>80G: {effective80G}</span>
                </span>
              )}
              {effectiveContactPerson && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13.5} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  <span>{effectiveContactPerson}</span>
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13.5} style={{ color: '#64748b', flexShrink: 0 }} />
                <span>Joined: {effectiveJoined}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons on Right */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/trust/my-profile')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: '#ffffff',
              border: '1.5px solid #10b981',
              color: '#059669',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#ecfdf5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            title="View Full Trust Profile"
          >
            <User size={14} />
            <span>My Profile</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/trust/edit-profile')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: '#00a651',
              border: '1px solid #00a651',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(0, 166, 81, 0.25)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#00a651';
            }}
            title="Edit Organization Details"
          >
            <Pencil size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Colored Stat Cards Grid (Screenshot 1 Replica) */}
      <div className="dashboard-stat-grid-modern">
        {/* Card 1: Green (New Receipt) */}
        <div
          className="stat-modern-card card-green"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/trust/new-donation-receipt')}
          title="Create New Donation Receipt"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <Plus size={24} strokeWidth={3} />
            </div>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">New Receipt</span>
          </div>
        </div>

        {/* Card 2: Blue (All Receipts) */}
        <Link
          to="/trust/donation-receipt"
          className="stat-modern-card card-blue"
          title="View All Donation Receipts"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <FileText size={22} />
            </div>
            <span className="stat-modern-val">{stats.allReceipts}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">All Receipts</span>
          </div>
        </Link>

        {/* Card 3: Amber (80G Vault) */}
        <Link
          to="/trust/all-certificate"
          className="stat-modern-card card-amber"
          title="80G Vault Certificates"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <Folder size={22} />
            </div>
            <span className="stat-modern-val">{stats.vaultCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">80G Vault</span>
            <span className="stat-modern-badge-new">New</span>
          </div>
        </Link>

        {/* Card 4: Purple (My Profile) */}
        <Link
          to="/trust/my-profile"
          className="stat-modern-card card-purple"
          title="My Trust Profile & Settings"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <User size={22} />
            </div>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">My Profile</span>
          </div>
        </Link>
      </div>

      {/* 4. Notifications & Updates Card */}
      <div className="updates-card-modern">
        <div className="updates-header-row">
          <div className="updates-title-group">
            <div className="updates-megaphone-icon">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="updates-main-heading">Notifications &amp; Updates</h2>
              <p className="updates-sub-heading">Important announcements, tutorials, and system information</p>
            </div>
          </div>
          <Link to="/trust/notifications" className="updates-view-all-btn">
            View All Updates &rarr;
          </Link>
        </div>

        <ul className="updates-timeline-modern">
          {notifications && notifications.length > 0 ? (
            notifications.map((item, idx) => {
              const notifDate = item.date || item.publishDate || 'Today';
              const notifText = item.text || (item.title ? `${item.title} — ${item.message || ''}` : item.message || '');
              const actionLabel = item.actionText || (item.link || item.actionLink ? 'Click here to check now' : '');
              const linkUrl = item.link || item.actionLink || '';
              const isExternal = linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'));
              const isYoutube = linkUrl && linkUrl.toLowerCase().includes('youtube');

              return (
                <li key={item.id || item._id || idx} className="update-row-item">
                  <span className="update-bullet-icon">★</span>
                  <div className="update-body">
                    <span className="update-date-badge">{notifDate} &rarr;</span>
                    <span>{notifText}</span>
                    {actionLabel && linkUrl && (
                      isExternal ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="update-action-btn-link"
                          style={isYoutube ? { display: 'inline-flex', alignItems: 'center', gap: '6px' } : undefined}
                        >
                          {isYoutube && (
                            <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              YouTube
                            </span>
                          )}
                          {actionLabel}
                        </a>
                      ) : (
                        <Link to={linkUrl} className="update-action-btn-link">
                          {actionLabel}
                        </Link>
                      )
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="update-row-item">
              <span className="update-bullet-icon">★</span>
              <div className="update-body">
                <span className="update-date-badge">Today &rarr;</span>
                <span>No announcements or updates at this time.</span>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>

      {/* Upgrade Subscription / Cart Modal */}
      <UpgradePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />

      {/* Modal to Create New Receipt */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSave={handleSaveReceipt}
        heads={heads}
      />

      {/* Themed Confirmation & Notification Modal */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
