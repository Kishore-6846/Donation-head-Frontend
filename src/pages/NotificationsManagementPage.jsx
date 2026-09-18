import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Search,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  Calendar,
  Layers
} from 'lucide-react';

export default function NotificationsManagementPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Announcement',
    targetAudience: 'All Trusts',
    actionText: '',
    actionLink: '',
    status: 'Published'
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingNotif(null);
    setFormData({
      title: '',
      message: '',
      category: 'Announcement',
      targetAudience: 'All Trusts',
      actionText: '',
      actionLink: '',
      status: 'Published'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (n) => {
    setEditingNotif(n);
    setFormData({
      title: n.title || '',
      message: n.message || '',
      category: n.category || 'Announcement',
      targetAudience: n.targetAudience || 'All Trusts',
      actionText: n.actionText || '',
      actionLink: n.actionLink || '',
      status: n.status || 'Published'
    });
    setModalOpen(true);
  };

  const handleSaveNotification = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Title and message are required.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    try {
      const url = editingNotif ? `/api/notifications/${editingNotif._id}` : '/api/notifications';
      const method = editingNotif ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        fetchNotifications();
        setPopup({
          isOpen: true,
          type: 'success',
          title: editingNotif ? 'Notification Updated' : 'Announcement Broadcasted',
          message: editingNotif ? 'Notification was updated.' : 'New announcement broadcasted to all trust dashboards.',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: data.message || 'Operation failed',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      console.error(err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Network error occurred while publishing notification.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const handleDeleteNotification = (n) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Remove Announcement?',
      message: `Delete announcement "${n.title}"?`,
      showCancel: true,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/notifications/${n._id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchNotifications();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const filteredNotifs = notifications.filter(n => {
    const q = search.toLowerCase();
    const titleMatch = n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    const catMatch = categoryFilter === 'All' || n.category.toLowerCase() === categoryFilter.toLowerCase();
    return titleMatch && catMatch;
  });

  const totalCount = notifications.length;
  const publishedCount = notifications.filter(n => n.status === 'Published').length;
  const releaseCount = notifications.filter(n => n.category === 'Release' || n.category === 'Feature').length;
  const complianceCount = notifications.filter(n => n.category === 'Compliance').length;

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Notifications & Updates' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Megaphone size={14} />
            <span>COMMUNICATION & BROADCAST CENTER</span>
          </div>
          <h1 className="mint-hero-title">Notifications &amp; Updates</h1>
          <p className="mint-hero-subtitle">
            Publish system announcements, new features, compliance advisories, and video tutorial alerts visible across all trust admin dashboards.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
            onClick={() => navigate('/superadmin/new-notification')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Broadcast Update</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
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
            <div className="stat-modern-icon"><Send size={22} /></div>
            <span className="stat-modern-val">{publishedCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Live</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Sparkles size={22} /></div>
            <span className="stat-modern-val">{releaseCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Feature Releases</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><ShieldCheck size={22} /></div>
            <span className="stat-modern-val">{complianceCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Compliance Bulletins</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
          <div className="trust-search-wrapper" style={{ width: '100%', maxWidth: '380px' }}>
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
            style={{ width: '180px', height: '40px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Release">Feature Release</option>
            <option value="Announcement">Announcement</option>
            <option value="Compliance">Compliance &amp; 10BD</option>
            <option value="Tutorial">Video Tutorial</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-trust-secondary"
          style={{ padding: '8px 12px' }}
          onClick={fetchNotifications}
          title="Refresh Notifications"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Notifications Timeline Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading broadcast updates...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Megaphone size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Broadcasts Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            No notifications match your current search criteria.
          </p>
          <button type="button" className="btn-trust-primary" onClick={handleOpenCreateModal}>
            Broadcast Update
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredNotifs.map(n => (
            <div
              key={n._id}
              className="trust-card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: n.category === 'Release' ? '#ecfdf5' : (n.category === 'Compliance' ? '#fef3c7' : '#eff6ff'),
                  color: n.category === 'Release' ? '#059669' : (n.category === 'Compliance' ? '#d97706' : '#2563eb'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {n.category === 'Release' ? <Sparkles size={20} /> : (n.category === 'Compliance' ? <ShieldCheck size={20} /> : <Megaphone size={20} />)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {n.title}
                    </h3>
                    <span className="badge-pill badge-info" style={{ fontSize: '11px' }}>
                      {n.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{n.publishDate}</span>
                    </span>
                    <span className={`badge-pill ${n.status === 'Published' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                      {n.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', marginBottom: '10px' }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>
                      Target: <strong style={{ color: '#0f172a' }}>{n.targetAudience || 'All Trusts'}</strong>
                    </span>
                    {n.actionLink && (
                      <a
                        href={n.actionLink}
                        target={n.actionLink.startsWith('http') ? '_blank' : '_self'}
                        rel="noreferrer"
                        className="update-action-btn-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>{n.actionText || 'View Link'}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-table-action"
                  onClick={() => navigate(`/superadmin/new-notification?id=${n._id}`)}
                  title="Edit Announcement"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="btn-table-action delete"
                  onClick={() => handleDeleteNotification(n)}
                  title="Delete Announcement"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        showCancel={popup.showCancel}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
