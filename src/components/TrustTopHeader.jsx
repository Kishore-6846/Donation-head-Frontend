import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  ExternalLink,
  Pencil,
  KeyRound
} from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

export default function TrustTopHeader({ user, onLogout, onToggleSidebar }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    fetch('/api/notifications?limit=5')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setNotifications(d.data);
        } else if (Array.isArray(d.notifications)) {
          setNotifications(d.notifications);
        }
      })
      .catch(() => {
        fetch('/api/dashboard/stats')
          .then(r => r.json())
          .then(d => {
            if (d.notifications) setNotifications(d.notifications);
          })
          .catch(() => {});
      });
  }, []);


  const trustSession = getTrustSession();
  const activeUser = (!isSuperUser(user) && user) || trustSession?.user || {};

  const userEmail = (!isSuperUser(activeUser) ? (activeUser?.email || '') : '').toLowerCase().trim();
  const userScopedProfile = (() => {
    if (!userEmail) return {};
    try {
      return JSON.parse(localStorage.getItem(`profile_data_${userEmail}`) || '{}');
    } catch (e) {
      return {};
    }
  })();

  const trustDisplayName =
    (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') ||
    userScopedProfile.name ||
    (activeUser?.name && !isSuperUser(activeUser) ? activeUser.name : '') ||
    'Trust Organization';
  const roleName =
    activeUser?.contactPerson ||
    userScopedProfile.contactPerson ||
    (activeUser?.name && !isSuperUser(activeUser) ? activeUser.name : '') ||
    'Administrator';
  const userLogo = activeUser?.logo || userScopedProfile.logo;

  const handleProfileClick = () => {
    if (window.innerWidth <= 768) {
      setUserMenuOpen(false);
      navigate('/trust/my-profile');
    } else {
      setUserMenuOpen(prev => !prev);
    }
  };

  return (
    <header className="app-top-header">
      <div className="top-header-left">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="top-header-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Clean Context badge (matching green accent like Super Admin) */}
        <div className="top-header-trust-badge" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <span className="trust-status-pulse" style={{ backgroundColor: '#10b981' }} />
          <span className="trust-badge-name" style={{ color: '#047857', fontWeight: 700 }} title={trustDisplayName}>
            {trustDisplayName}
          </span>
        </div>
      </div>

      <div className="top-header-right">
        {/* Notification Bell */}
        <div className="top-header-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="top-header-icon-btn"
            onClick={() => setNotificationOpen(!notificationOpen)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="top-header-notif-badge">{notifications.length}</span>
            )}
          </button>

          {notificationOpen && (
            <div className="top-header-dropdown notif-dropdown">
              <div className="dropdown-panel-header">
                <div>
                  <h4 className="panel-title">Notifications</h4>
                  <p className="panel-subtitle">{notifications.length} active announcements</p>
                </div>
                <span className="panel-badge-pill">Updates</span>
              </div>
              <div className="notif-items-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n, idx) => (
                    <div key={n.id || n._id || idx} className="notif-item unread">
                      <div className="notif-icon-circle blue">
                        <Sparkles size={16} />
                      </div>
                      <div className="notif-content">
                        <p className="notif-title" style={{ fontWeight: 600 }}>
                          {n.title || n.text}
                        </p>
                        {n.message && (
                          <p className="notif-time" style={{ color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                            {n.message}
                          </p>
                        )}
                        <span className="notif-time" style={{ display: 'block', marginTop: '4px', fontSize: '11px' }}>
                          {n.publishDate || n.date || 'Today'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    No announcements at the moment.
                  </div>
                )}</div>
              <div className="dropdown-panel-footer">
                <Link
                  to="/trust/notifications"
                  className="dropdown-view-all-link"
                  onClick={() => setNotificationOpen(false)}
                >
                  View All Updates &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="top-header-user-wrap" ref={userMenuRef}>
          <button
            type="button"
            className="top-header-user-btn"
            onClick={handleProfileClick}
            aria-expanded={userMenuOpen}
            title="My Profile"
          >
            <div className="user-avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 700 }}>
              {userLogo ? (
                <img src={userLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span>{roleName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-meta-wrap">
              <span className="user-welcome-label">Welcome</span>
              <span className="user-name-label">{roleName}</span>
            </div>
            <ChevronDown size={15} className={`chevron-transition ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="top-header-dropdown user-dropdown" style={{ textAlign: 'left' }}>
              <div className="user-dropdown-header" style={{ textAlign: 'left' }}>
                <p className="dropdown-user-name" style={{ textAlign: 'left' }}>{trustDisplayName}</p>
                <p className="dropdown-user-role" style={{ textAlign: 'left' }}>{roleName} Account</p>
              </div>
              <div className="user-dropdown-links" style={{ textAlign: 'left' }}>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/trust/my-profile');
                  }}
                >
                  <User size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>My Profile</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/trust/edit-profile');
                  }}
                >
                  <Pencil size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Edit Profile</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/trust/receipt-options');
                  }}
                >
                  <Settings size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Receipt Options</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/trust/all-certificate');
                  }}
                >
                  <ShieldCheck size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>80G Vault</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/trust/new-password');
                  }}
                >
                  <KeyRound size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Change Password</span>
                </button>
                <div className="user-dropdown-divider" />
                <button
                  type="button"
                  className="user-dropdown-item logout"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
