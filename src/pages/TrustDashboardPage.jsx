import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import ReceiptModal from '../components/ReceiptModal';
import UpgradePlanModal from '../components/UpgradePlanModal';
import SimplePopup from '../components/SimplePopup';
import {
  Plus,
  BookOpen,
  Folder,
  User,
  Megaphone,
  Sparkles,
  FileText
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
  const seen = new Set();
  return list.filter(item => {
    if (!item || !item.name) return false;
    const base = (item.rawName || item.name).replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
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

  const isDefaultAdmin = !user?.email || user?.email === 'admin@donationreceipt.in';

  // Show actual real counts for all receipts and vault certificates
  const [stats, setStats] = useState({
    allReceipts: 0,
    vaultCount: 0
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

  useEffect(() => {
    const effectiveEmail = user?.email || (() => {
      try {
        return JSON.parse(localStorage.getItem('user_info') || '{}')?.email || '';
      } catch (e) {
        return '';
      }
    })();

    const isSuperAdminEmail = effectiveEmail && (effectiveEmail.toLowerCase().includes('superadmin') || effectiveEmail === 'admin@donationreceipt.in');
    const emailParam = (effectiveEmail && !isSuperAdminEmail)
      ? `&trustEmail=${encodeURIComponent(effectiveEmail)}`
      : '';

    fetch(`/api/receipts?status=Active&limit=1000${emailParam}`)
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

    // Sync vault count directly from user-specific certificates in localStorage
    try {
      const certKey = isDefaultAdmin ? 'certificates_data' : `certificates_data_${user?.email}`;
      const savedCerts = localStorage.getItem(certKey);
      if (savedCerts) {
        const parsed = JSON.parse(savedCerts);
        if (Array.isArray(parsed)) {
          setStats(prev => ({ ...prev, vaultCount: parsed.length }));
        }
      } else if (!isDefaultAdmin) {
        setStats(prev => ({ ...prev, vaultCount: 0 }));
      }
    } catch (e) {}

    const activeUser = user || (() => {
      try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch (e) { return {}; }
    })();
    const tName = activeUser?.trustName || (activeUser?.name && !activeUser.name.toLowerCase().includes('super') ? activeUser.name : '');
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

  const trustName = user?.trustName || user?.name || 'Trust Organization';

  return (
    <>
      <div className="dashboard-container-modern">
      {/* 1. Mint Hero Banner (Matches Screenshot 1) */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>GOOD TO SEE YOU AGAIN!</span>
          </div>
          <h1 className="mint-hero-title">Manage Donations. Create Impact.</h1>
          <p className="mint-hero-subtitle">
            Welcome to {trustName}. Everything you need to manage your receipts and reports is right here.
          </p>
        </div>
        <div className="mint-hero-right">
          <span className="mint-hero-tagline">
            Small Contributions Make a Big Difference ♡
          </span>
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
