import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import {
  Gauge,
  List,
  FileText,
  Users,
  BarChart2,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  LogOut,
  X
} from 'lucide-react';

export default function TrustSidebar({ isOpen, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const normalizedPath = (path || '').toLowerCase().replace(/\/+$/, '') || '/';

  // Track expanded dropdown menus
  const isStaffRoute =
    normalizedPath.includes('roles') ||
    normalizedPath.includes('staff') ||
    normalizedPath.includes('add-role') ||
    normalizedPath.includes('add_role');
  const isReportsRoute =
    normalizedPath.includes('reports') ||
    normalizedPath.includes('10bd') ||
    normalizedPath.includes('donation_head_report') ||
    normalizedPath.includes('donation-head-report') ||
    normalizedPath.includes('donation_type_report') ||
    normalizedPath.includes('donation-type-report') ||
    normalizedPath.includes('payment_mode_report') ||
    normalizedPath.includes('payment-mode-report') ||
    normalizedPath.includes('donor');
  const isWelcomeRoute =
    normalizedPath.includes('profile') ||
    normalizedPath.includes('receipt_options') ||
    normalizedPath.includes('receipt-options') ||
    normalizedPath.includes('edit_receipt_options') ||
    normalizedPath.includes('edit-receipt-options') ||
    normalizedPath.includes('my_subscriptions') ||
    normalizedPath.includes('my-subscriptions') ||
    normalizedPath.includes('new_password') ||
    normalizedPath.includes('new-password') ||
    normalizedPath.includes('support') ||
    normalizedPath.includes('certificate');

  const [staffExpanded, setStaffExpanded] = useState(isStaffRoute);
  const [reportsExpanded, setReportsExpanded] = useState(isReportsRoute);
  const [dynamicReports, setDynamicReports] = useState([]);

  useEffect(() => {
    const localUser = (() => { try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; } })();
    const currentUser = user || localUser;
    const trustName = currentUser?.trustName || currentUser?.name || '';
    let url = '/api/dynamic-reports?status=Published';
    if (trustName) {
      url += `&trust=${encodeURIComponent(trustName)}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          // Strictly exclude platform standard reports from trust admin sidebar
          const standardCodes = ['REP-RCPT-MASTER', 'REP-10BD-STATUTORY', 'REP-HEAD-COLLECTION', 'REP-DONOR-DIRECTORY', 'REP-TYPE-MATRIX', 'REP-PAYMENT-RECON', 'REP-EXEC-INTELLIGENCE'];
          const customOnly = d.data.filter(r => !r.isStandard && !standardCodes.includes(r.code) && !r._id?.startsWith('std_'));
          setDynamicReports(customOnly);
        }
      })
      .catch(e => console.error('Error fetching dynamic reports in sidebar:', e));
  }, [path, user?.trustName, user?.name]);
  const [welcomeExpanded, setWelcomeExpanded] = useState(isWelcomeRoute);

  const isDashboard =
    normalizedPath === '/trust' ||
    normalizedPath === '/trust/' ||
    normalizedPath === '/trust/dashboard' ||
    normalizedPath === '/trust/index.php' ||
    normalizedPath === '/trust/index' ||
    normalizedPath === '/admin' ||
    normalizedPath === '/admin/' ||
    normalizedPath === '/admin/dashboard' ||
    normalizedPath === '/dashboard' ||
    normalizedPath === '/';
  const isDonationHead =
    (normalizedPath.includes('donation-head') || normalizedPath.includes('donation_head')) &&
    !normalizedPath.includes('report');
  const isDonationReceipt =
    (normalizedPath.includes('donation-receipt') ||
    normalizedPath.includes('donation_receipt') ||
    normalizedPath.includes('dl_receipts') ||
    normalizedPath.includes('dl-receipts') ||
    normalizedPath.includes('export-receipts')) &&
    !normalizedPath.includes('report');

  const handleLinkClick = () => {
    if (onClose && window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header / Logo */}
        <div className="sidebar-header">
          <Link to="/trust" className="sidebar-logo-link" onClick={handleLinkClick}>
            <img src={navLogo} alt="Donation Receipt Logo" className="sidebar-logo-img" />
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu-list">
            {/* 1. Dashboard */}
            <li className="sidebar-item">
              <Link
                to="/trust"
                className={`sidebar-link ${isDashboard ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Gauge size={18} />
                </div>
                <span className="sidebar-text">Dashboard</span>
              </Link>
            </li>

            {/* 2. Donation Head */}
            <li className="sidebar-item">
              <Link
                to="/trust/donation-head"
                className={`sidebar-link ${isDonationHead ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <List size={18} />
                </div>
                <span className="sidebar-text">Donation Head</span>
              </Link>
            </li>

            {/* 3. Donation Receipt */}
            <li className="sidebar-item">
              <Link
                to="/trust/donation-receipt"
                className={`sidebar-link ${isDonationReceipt ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <FileText size={18} />
                </div>
                <span className="sidebar-text">Donation Receipt</span>
              </Link>
            </li>

            {/* 4. Staff Dropdown */}
            <li className="sidebar-item">
              <button
                type="button"
                className={`sidebar-link sidebar-dropdown-toggle ${isStaffRoute ? 'active-parent' : ''}`}
                onClick={() => setStaffExpanded(!staffExpanded)}
                aria-expanded={staffExpanded}
              >
                <div className="sidebar-icon-wrap">
                  <Users size={18} />
                </div>
                <span className="sidebar-text">Staff</span>
                <span className="sidebar-chevron">
                  {staffExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>

              {staffExpanded && (
                <ul className="sidebar-submenu">
                  <li>
                    <Link
                      to="/trust/roles"
                      className={`sidebar-sublink ${path.includes('roles') || path.includes('add-role') || path.includes('add_role') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Member Roles</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/staff"
                      className={`sidebar-sublink ${path.includes('staff') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Staff Members</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* 5. Reports Dropdown */}
            <li className="sidebar-item">
              <button
                type="button"
                className={`sidebar-link sidebar-dropdown-toggle ${isReportsRoute ? 'active-parent' : ''}`}
                onClick={() => setReportsExpanded(!reportsExpanded)}
                aria-expanded={reportsExpanded}
              >
                <div className="sidebar-icon-wrap">
                  <BarChart2 size={18} />
                </div>
                <span className="sidebar-text">Reports</span>
                <span className="sidebar-chevron">
                  {reportsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>

              {reportsExpanded && (
                <ul className="sidebar-submenu">
                  {dynamicReports.map(dr => (
                    <li key={dr._id}>
                      <Link
                        to={`/trust/custom-report/${dr._id}`}
                        className={`sidebar-sublink ${path.includes(dr._id) ? 'active' : ''}`}
                        onClick={handleLinkClick}
                        title={dr.title}
                      >
                        <span className="sublink-dot" style={{ backgroundColor: '#059669' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dr.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/trust/reports-it"
                      className={`sidebar-sublink ${path.includes('10bd') || path.includes('reports_it') || path.includes('reports-it') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Form No. 10BD</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/reports"
                      className={`sidebar-sublink ${path === '/trust/reports.php' || path === '/trust/reports' || path.includes('receipts') || path.includes('receipt-report') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Receipt Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/donation-head-report"
                      className={`sidebar-sublink ${path.includes('donation_head_report') || path.includes('donation-head-report') || path.includes('head-wise') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Head-Wise Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/donor-reports"
                      className={`sidebar-sublink ${path.includes('donor_reports') || path.includes('donor-reports') || path.includes('donor') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Donor Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/donation-type-report"
                      className={`sidebar-sublink ${path.includes('donation_type_report') || path.includes('donation-type-report') || path.includes('/type') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Donation Type Report</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/payment-mode-report"
                      className={`sidebar-sublink ${path.includes('payment_mode_report') || path.includes('payment-mode-report') || path.includes('payment-mode') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Payment Mode Report</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* 6. Welcome Dropdown */}
            <li className="sidebar-item">
              <button
                type="button"
                className={`sidebar-link sidebar-dropdown-toggle ${isWelcomeRoute ? 'active-parent' : ''}`}
                onClick={() => setWelcomeExpanded(!welcomeExpanded)}
                aria-expanded={welcomeExpanded}
              >
                <div className="sidebar-icon-wrap">
                  <User size={18} />
                </div>
                <span className="sidebar-text">Welcome</span>
                <span className="sidebar-chevron">
                  {welcomeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>

              {welcomeExpanded && (
                <ul className="sidebar-submenu">
                  <li>
                    <Link
                      to="/trust/my-profile"
                      className={`sidebar-sublink ${path.includes('my-profile') || path === '/trust/profile.php' || path === '/trust/profile' ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>My Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/edit-profile"
                      className={`sidebar-sublink ${path.includes('edit-profile') || path.includes('edit_profile') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Edit Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/receipt-options"
                      className={`sidebar-sublink ${path.includes('receipt_options') || path.includes('receipt-options') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Receipt Options</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/all-certificate"
                      className={`sidebar-sublink ${path.includes('certificate') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="sublink-dot" />
                        <span>80G Vault</span>
                      </div>
                      <span className="sidebar-vault-badge">New</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/my-subscriptions"
                      className={`sidebar-sublink ${path.includes('subscriptions') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>My Subscriptions</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/new-password"
                      className={`sidebar-sublink ${path.includes('new_password') || path.includes('new-password') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Change Password</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/trust/support"
                      className={`sidebar-sublink ${path.includes('support') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Support</span>
                    </Link>
                  </li>
                  {onLogout && (
                    <li>
                      <button
                        type="button"
                        className="sidebar-sublink sidebar-logout-btn"
                        onClick={() => {
                          handleLinkClick();
                          onLogout();
                        }}
                      >
                        <LogOut size={14} />
                        <span>LogOut</span>
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Sidebar Bottom Action Buttons */}
        <div className="sidebar-bottom-actions">
          <button
            type="button"
            className="sidebar-btn-buy-staff"
            onClick={() => {
              handleLinkClick();
              navigate('/trust/buy-staff-users');
            }}
          >
            ₹ Buy Staff Users
          </button>
          <button
            type="button"
            className="sidebar-btn-upgrade"
            onClick={() => {
              handleLinkClick();
              navigate('/trust/upgrade-plan');
            }}
          >
            ₹ Upgrade Subscription
          </button>
        </div>
      </aside>
    </>
  );
}
