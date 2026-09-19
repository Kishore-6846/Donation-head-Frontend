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
  Boxes,
  Users,
  KeyRound,
  CreditCard
} from 'lucide-react';

export default function SuperAdminTopHeader({ user, onLogout, onToggleSidebar }) {
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
        }
      })
      .catch(() => {});
  }, []);

  const adminName = user?.name || 'Super Administrator';
  const roleTitle = 'Super Admin';

  const handleProfileClick = () => {
    if (window.innerWidth <= 768) {
      setUserMenuOpen(false);
      navigate('/superadmin/my-profile');
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

        {/* Super Admin Console Badge */}
        <div className="top-header-trust-badge" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <span className="trust-status-pulse" style={{ backgroundColor: '#10b981' }} />
          <span className="trust-badge-name" style={{ color: '#047857', fontWeight: 700, letterSpacing: '0.3px' }}>
            SUPER ADMIN CONSOLE
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
            title="Broadcast Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="top-header-notif-badge">{notifications.length}</span>
            )}
          </button>

          {notificationOpen && (
            <div className="top-header-dropdown notif-dropdown" style={{ width: '360px' }}>
              <div className="dropdown-panel-header">
                <div>
                  <h4 className="panel-title">Platform Broadcasts</h4>
                  <p className="panel-subtitle">{notifications.length} active announcements</p>
                </div>
                <span className="panel-badge-pill">Live</span>
              </div>
              <div className="notif-items-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.slice(0, 4).map((n, idx) => (
                  <div key={n._id || idx} className="notif-item unread">
                    <div className="notif-icon-circle blue">
                      <Sparkles size={16} />
                    </div>
                    <div className="notif-content">
                      <p className="notif-title" style={{ fontWeight: 600 }}>{n.title}</p>
                      <span className="notif-time">{n.publishDate || 'Today'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-panel-footer">
                <Link
                  to="/superadmin/notifications"
                  className="dropdown-view-all-link"
                  onClick={() => setNotificationOpen(false)}
                >
                  Manage All Broadcasts &rarr;
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
            <div className="user-avatar-circle" style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 700 }}>
              <span>S</span>
            </div>
            <div className="user-meta-wrap">
              <span className="user-welcome-label">Logged In As</span>
              <span className="user-name-label">{adminName}</span>
            </div>
            <ChevronDown size={15} className={`chevron-transition ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="top-header-dropdown user-dropdown" style={{ textAlign: 'left' }}>
              <div className="user-dropdown-header" style={{ textAlign: 'left' }}>
                <p className="dropdown-user-name" style={{ textAlign: 'left' }}>{adminName}</p>
                <p className="dropdown-user-role" style={{ textAlign: 'left' }}>{roleTitle} Account</p>
              </div>
              <div className="user-dropdown-links" style={{ textAlign: 'left' }}>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/superadmin/my-profile');
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
                    navigate('/superadmin/edit-profile');
                  }}
                >
                  <Pencil size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Edit Profile</span>
                </button>
                <div className="user-dropdown-divider" />
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/superadmin/plans');
                  }}
                >
                  <Boxes size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Plans Management</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/superadmin/users');
                  }}
                >
                  <Users size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Users (Trusts)</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/superadmin/reports');
                  }}
                >
                  <CreditCard size={16} />
                  <span style={{ textAlign: 'left', flex: 1 }}>Subscription Revenue</span>
                </button>
                <button
                  type="button"
                  className="user-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/superadmin/new-password');
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
