import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import {
  Gauge,
  Boxes,
  Users,
  UserCheck,
  FileText,
  Megaphone,
  BarChart2,
  User,
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
  Building,
  Layers,
  X
} from 'lucide-react';

export default function SuperAdminSidebar({ isOpen, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const normalizedPath = (path || '').toLowerCase().replace(/\/+$/, '') || '/';

  // Dropdown states
  const isReportsRoute = normalizedPath.includes('report');
  const isWelcomeRoute = normalizedPath.includes('profile') || normalizedPath.includes('password') || normalizedPath.includes('support');

  const [reportsExpanded, setReportsExpanded] = useState(isReportsRoute);
  const [welcomeExpanded, setWelcomeExpanded] = useState(isWelcomeRoute);
  const [dynamicReports, setDynamicReports] = useState([]);

  React.useEffect(() => {
    fetch('/api/dynamic-reports?status=Published')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setDynamicReports(d.data);
        }
      })
      .catch(e => console.error('Error fetching dynamic reports in sidebar:', e));
  }, [path]);

  const isDashboard =
    normalizedPath === '/superadmin' ||
    normalizedPath === '/superadmin/' ||
    normalizedPath === '/superadmin/dashboard';
  const isPlans = normalizedPath.includes('plan');
  const isUsers = (normalizedPath.includes('user') && !normalizedPath.includes('employee') && !normalizedPath.includes('buy-staff'));
  const isEmployees = normalizedPath.includes('employee');
  const isDonationHeads = (normalizedPath.includes('donation-head') || normalizedPath.includes('donation_head')) && !normalizedPath.includes('report');
  const isReceipts = (normalizedPath.includes('all-receipts') || normalizedPath.includes('all_receipts') || (normalizedPath.includes('receipt') && !normalizedPath.includes('report')));
  const isNotifications = normalizedPath.includes('notification');

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
          <Link to="/superadmin" className="sidebar-logo-link" onClick={handleLinkClick}>
            <img src={navLogo} alt="Super Admin Logo" className="sidebar-logo-img" />
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
                to="/superadmin"
                className={`sidebar-link ${isDashboard ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Gauge size={18} />
                </div>
                <span className="sidebar-text">Dashboard</span>
              </Link>
            </li>

            {/* 2. Plans Management */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/plans"
                className={`sidebar-link ${isPlans ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Boxes size={18} />
                </div>
                <span className="sidebar-text">Plans</span>
              </Link>
            </li>

            {/* 3. Users Management (Trusts) */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/users"
                className={`sidebar-link ${isUsers ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Users size={18} />
                </div>
                <span className="sidebar-text">Users (Trusts)</span>
              </Link>
            </li>

            {/* 4. Employee Management (Super Admin Staff) */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/employees"
                className={`sidebar-link ${isEmployees ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <UserCheck size={18} />
                </div>
                <span className="sidebar-text">Employees</span>
              </Link>
            </li>

            {/* 5. Donation Head Management */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/donation-heads"
                className={`sidebar-link ${isDonationHeads ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Layers size={18} />
                </div>
                <span className="sidebar-text">Donation Head</span>
              </Link>
            </li>

            {/* 5. All Donation Receipts */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/all-receipts"
                className={`sidebar-link ${isReceipts ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <FileText size={18} />
                </div>
                <span className="sidebar-text">Donation Receipts</span>
              </Link>
            </li>

            {/* 7. Notifications & Updates */}
            <li className="sidebar-item">
              <Link
                to="/superadmin/notifications"
                className={`sidebar-link ${isNotifications ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-icon-wrap">
                  <Megaphone size={18} />
                </div>
                <span className="sidebar-text">Notifications</span>
              </Link>
            </li>

            {/* 8. Reports Dropdown */}
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
                  <li>
                    <Link
                      to="/superadmin/reports-it"
                      className={`sidebar-sublink ${path.includes('10bd') || path.includes('reports-it') || path.includes('reports_it') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Form No. 10BD</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/reports-receipts"
                      className={`sidebar-sublink ${path === '/superadmin/reports-receipts' || path.includes('receipt-reports') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Receipt Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/donation-head-report"
                      className={`sidebar-sublink ${path.includes('head-report') || path.includes('head-wise') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Head-Wise Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/donor-reports"
                      className={`sidebar-sublink ${path.includes('donor-report') || path.includes('donor_report') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Donor Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/donation-type-report"
                      className={`sidebar-sublink ${path.includes('donation-type-report') || path.includes('donation_type_report') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Donation Type Report</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/payment-mode-report"
                      className={`sidebar-sublink ${path.includes('payment-mode-report') || path.includes('payment_mode_report') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Payment Mode Report</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/all-reports"
                      className={`sidebar-sublink ${path.includes('all-reports') || path.includes('published-reports') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>All Published Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/new-report"
                      className={`sidebar-sublink ${path.includes('new-report') || path.includes('create-report') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Create Report</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* 9. Super Admin Settings / Welcome */}
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
                      to="/superadmin/my-profile"
                      className={`sidebar-sublink ${path.includes('/superadmin/my-profile') || path === '/superadmin/profile' ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Super Admin Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/edit-profile"
                      className={`sidebar-sublink ${path.includes('/superadmin/edit-profile') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Edit Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/new-password"
                      className={`sidebar-sublink ${path.includes('/superadmin/new-password') || path.includes('/superadmin/new_password') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>Change Password</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/superadmin/support"
                      className={`sidebar-sublink ${path.includes('/superadmin/support') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sublink-dot" />
                      <span>System Support</span>
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
              navigate('/superadmin/new-plan');
            }}
          >
            + Create New Plan
          </button>
          <button
            type="button"
            className="sidebar-btn-upgrade"
            onClick={() => {
              handleLinkClick();
              navigate('/superadmin/new-user');
            }}
          >
            + Add New User
          </button>
        </div>
      </aside>
    </>
  );
}
