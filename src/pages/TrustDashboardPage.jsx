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
  Pencil
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
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: effectiveLogo ? '#ffffff' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)',
              flexShrink: 0,
              overflow: 'hidden',
              border: effectiveLogo ? '2px solid #e2e8f0' : 'none'
            }}
          >
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={effectiveTrustName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              effectiveTrustName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div className="mint-hero-badge">
                <Building size={13} />
                <span>TRUST / NGO PROFILE</span>
              </div>
              <span className={`badge-pill ${effectiveStatus === 'Active' ? 'badge-success' : (effectiveStatus === 'Trial' ? 'badge-warning' : 'badge-danger')}`}>
                {effectiveStatus}
              </span>
              <span className="badge-pill badge-info" style={{ fontWeight: 600 }}>
                {effectivePlan} Plan
              </span>
            </div>
            <h1 className="mint-hero-title" style={{ fontSize: '24px', marginBottom: '6px' }}>
              {effectiveTrustName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#475569', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={13} style={{ color: '#10b981' }} /> {effectiveEmail}
              </span>
              {effectiveMobile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} style={{ color: '#10b981' }} /> {effectiveMobile}
                </span>
              )}
              {effectiveRegNo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace' }}>
                  <Shield size={13} style={{ color: '#3b82f6' }} /> Reg: {effectiveRegNo}
                </span>
              )}
              {effective80G && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} style={{ color: '#10b981' }} /> 80G: {effective80G}
                </span>
              )}
              {effectiveContactPerson && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={13} style={{ color: '#6366f1' }} /> {effectiveContactPerson}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: '#64748b' }} /> Joined: {effectiveJoined}
              </span>
            </div>
          </div>
        </div>

        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13.5px' }}
            onClick={() => navigate('/trust/my-profile')}
            title="View Full Trust Profile"
          >
            <User size={15} />
            <span>My Profile</span>
          </button>
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13.5px' }}
            onClick={() => navigate('/trust/edit-profile')}
            title="Edit Organization Details"
          >
            <Pencil size={15} />
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
