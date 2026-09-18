import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import {
  Megaphone,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Video,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function TrustNotificationsPage({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        // Fallback to /api/dashboard/stats
        const statsRes = await fetch('/api/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success && Array.isArray(statsData.notifications)) {
          setNotifications(statsData.notifications);
        }
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifs = notifications.filter(n => {
    const q = search.toLowerCase().trim();
    const titleMatch = (n.title || '').toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q);
    const catMatch = categoryFilter === 'All' || (n.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return titleMatch && catMatch;
  });

  const totalCount = notifications.length;
  const releaseCount = notifications.filter(n => (n.category || '').toLowerCase() === 'release' || (n.category || '').toLowerCase() === 'feature').length;
  const complianceCount = notifications.filter(n => (n.category || '').toLowerCase() === 'compliance').length;
  const announcementCount = notifications.filter(n => (n.category || '').toLowerCase() === 'announcement' || (n.category || '').toLowerCase() === 'general').length;

  const getCategoryIcon = (category = '') => {
    const cat = category.toLowerCase();
    if (cat === 'release' || cat === 'feature') return <Sparkles size={20} />;
    if (cat === 'compliance') return <ShieldCheck size={20} />;
    if (cat === 'tutorial' || cat === 'video') return <Video size={20} />;
    return <Megaphone size={20} />;
  };

  const getCategoryColorStyles = (category = '') => {
    const cat = category.toLowerCase();
    if (cat === 'release' || cat === 'feature') {
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    }
    if (cat === 'compliance') {
      return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
    }
    if (cat === 'tutorial' || cat === 'video') {
      return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    }
    return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
  };

  return (
    <div className="dashboard-container-modern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Breadcrumb
        items={[
          { label: 'Trust Dashboard', link: '/trust' },
          { label: 'Notifications & Updates' }
        ]}
      />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Megaphone size={13} />
            <span>PLATFORM ANNOUNCEMENTS &amp; UPDATES</span>
          </div>
          <h1 className="mint-hero-title">All Notifications &amp; System Updates</h1>
          <p className="mint-hero-subtitle">
            Stay informed with important official announcements, statutory compliance advisories, feature updates, and video tutorials.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust')}
            title="Return to Dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Megaphone size={22} /></div>
            <span className="stat-modern-val">{totalCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Broadcasts</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Sparkles size={22} /></div>
            <span className="stat-modern-val">{releaseCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Feature Releases</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><ShieldCheck size={22} /></div>
            <span className="stat-modern-val">{complianceCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Compliance Bulletins</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Info size={22} /></div>
            <span className="stat-modern-val">{announcementCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">General Advisories</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="trust-card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div className="trust-search-wrapper" style={{ flex: 1, maxWidth: '420px', minWidth: '240px' }}>
            <Search size={16} className="trust-search-icon" />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              className="trust-input trust-search-input"
              style={{ width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="trust-select"
            style={{ width: '200px', height: '40px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories ({totalCount})</option>
            <option value="Release">Feature Release</option>
            <option value="Announcement">Announcement</option>
            <option value="Compliance">Statutory Compliance</option>
            <option value="Tutorial">Video Tutorial</option>
            <option value="Alert">Important Notice</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-trust-secondary"
          style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={fetchNotifications}
          title="Refresh updates"
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading platform announcements...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Megaphone size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
            No Announcements Found
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            {search || categoryFilter !== 'All'
              ? 'No updates match your search or category filter.'
              : 'There are no broadcasts or notifications at the moment.'}
          </p>
          {(search || categoryFilter !== 'All') && (
            <button
              type="button"
              className="btn-trust-primary"
              onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          {filteredNotifs.map((n, idx) => {
            const dateStr = n.publishDate || n.date || 'Today';
            const colorStyles = getCategoryColorStyles(n.category);
            const actionLabel = n.actionText || '';
            const actionUrl = n.actionLink || n.link || '';
            const isExternal = actionUrl && (actionUrl.startsWith('http://') || actionUrl.startsWith('https://'));
            const isYoutube = actionUrl && actionUrl.toLowerCase().includes('youtube');

            return (
              <div
                key={n._id || n.id || idx}
                className="trust-card"
                style={{
                  padding: '22px 26px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '20px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  borderLeft: `4px solid ${colorStyles.color}`
                }}
              >
                <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flex: 1 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: colorStyles.bg,
                      color: colorStyles.color,
                      border: `1px solid ${colorStyles.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {getCategoryIcon(n.category)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {n.title}
                      </h3>

                      {n.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 9px',
                            borderRadius: '20px',
                            backgroundColor: colorStyles.bg,
                            color: colorStyles.color,
                            border: `1px solid ${colorStyles.border}`
                          }}
                        >
                          {n.category}
                        </span>
                      )}

                      <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                      {n.message}
                    </p>

                    {actionLabel && actionUrl && (
                      <div style={{ marginTop: '8px' }}>
                        {isExternal ? (
                          <a
                            href={actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-trust-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              fontSize: '12.5px',
                              textDecoration: 'none',
                              backgroundColor: isYoutube ? '#dc2626' : undefined
                            }}
                          >
                            <span>{actionLabel}</span>
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <Link
                            to={actionUrl}
                            className="btn-trust-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              fontSize: '12.5px',
                              textDecoration: 'none'
                            }}
                          >
                            <span>{actionLabel}</span>
                            <span>&rarr;</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
