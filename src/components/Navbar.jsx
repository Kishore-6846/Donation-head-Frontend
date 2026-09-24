import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import UpgradePlanModal from './UpgradePlanModal';
import SimplePopup from './SimplePopup';
import {
  Gauge,
  List,
  FileText,
  Users,
  BarChart2,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop dropdown state
  const [staffOpen, setStaffOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStaffOpen, setMobileStaffOpen] = useState(false);
  const [mobileReportsOpen, setMobileReportsOpen] = useState(false);
  const [mobileWelcomeOpen, setMobileWelcomeOpen] = useState(false);

  const staffRef = useRef(null);
  const reportsRef = useRef(null);
  const welcomeRef = useRef(null);

  // Close desktop dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (staffRef.current && !staffRef.current.contains(e.target)) {
        setStaffOpen(false);
      }
      if (reportsRef.current && !reportsRef.current.contains(e.target)) {
        setReportsOpen(false);
      }
      if (welcomeRef.current && !welcomeRef.current.contains(e.target)) {
        setWelcomeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileStaffOpen(false);
    setMobileReportsOpen(false);
    setMobileWelcomeOpen(false);
  }, [location.pathname]);

  const path = location.pathname;
  const isDashboard = path === '/trust' || path === '/trust/' || path === '/trust/index.php' || path === '/trust/index' || path === '/';
  const isDonationHead =
    (path.includes('donation-head') || path.includes('donation_head')) &&
    !path.includes('report');
  const isDonationReceipt =
    (path.includes('donation-receipt') ||
    path.includes('donation_receipt') ||
    path.includes('dl_receipts') ||
    path.includes('dl-receipts') ||
    path.includes('export-receipts')) &&
    !path.includes('report');
  const isStaff =
    path.includes('role') ||
    path.includes('staff') ||
    path.includes('employee');
  const isReports =
    path.includes('reports') ||
    path.includes('10bd') ||
    path.includes('donation_head_report') ||
    path.includes('donation-head-report') ||
    path.includes('donation_type_report') ||
    path.includes('donation-type-report') ||
    path.includes('payment_mode_report') ||
    path.includes('payment-mode-report') ||
    path.includes('donor');
  const isWelcome =
    path.includes('profile') ||
    path.includes('receipt_options') ||
    path.includes('receipt-options') ||
    path.includes('edit_receipt_options') ||
    path.includes('edit-receipt-options') ||
    path.includes('my_subscriptions') ||
    path.includes('my-subscriptions') ||
    path.includes('new_password') ||
    path.includes('new-password') ||
    path.includes('support') ||
    path.includes('certificate');

  return (
    <>
      <header className="header-wrapper">
        <div className="nav-container">
          {/* Brand Logo */}
          <Link to="/trust" className="brand-logo-link" title="NGO Donation Receipt">
            <img src={navLogo} alt="Donation Receipt" className="brand-logo-image" />
          </Link>

          {/* Desktop Navigation Items */}
          <nav className="desktop-nav-menu">
            <ul className="nav-menu-items">
              {/* Dashboard */}
              <li className="nav-item">
                <Link
                  to="/trust"
                  className={`nav-link ${isDashboard ? 'active' : ''}`}
                >
                  <Gauge size={16} />
                  <span>Dashboard</span>
                </Link>
              </li>

              {/* Donation Head */}
              <li className="nav-item">
                <Link
                  to="/trust/donation-head"
                  className={`nav-link ${isDonationHead ? 'active' : ''}`}
                >
                  <List size={16} />
                  <span>Donation Head</span>
                </Link>
              </li>

              {/* Donation Receipt */}
              <li className="nav-item">
                <Link
                  to="/trust/donation-receipt"
                  className={`nav-link ${isDonationReceipt ? 'active' : ''}`}
                >
                  <FileText size={16} />
                  <span>Donation Receipt</span>
                </Link>
              </li>

              {/* Staff Dropdown */}
              <li className="nav-item" ref={staffRef}>
                <button
                  type="button"
                  className={`nav-link ${isStaff || staffOpen ? 'active' : ''}`}
                  onClick={() => {
                    setStaffOpen(!staffOpen);
                    setReportsOpen(false);
                    setWelcomeOpen(false);
                  }}
                >
                  <Users size={16} />
                  <span>Staff</span>
                  <ChevronDown size={14} style={{ marginLeft: '2px' }} />
                </button>
                {staffOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/trust/roles"
                      className={`dropdown-item ${path.includes('roles') || path.includes('add-role') || path.includes('add_role') ? 'active' : ''}`}
                      onClick={() => setStaffOpen(false)}
                    >
                      - Member Roles
                    </Link>
                    <Link
                      to="/trust/staff"
                      className={`dropdown-item ${path.includes('staff') ? 'active' : ''}`}
                      onClick={() => setStaffOpen(false)}
                    >
                      - Staff Members
                    </Link>
                  </div>
                )}
              </li>

              {/* Reports Dropdown */}
              <li className="nav-item" ref={reportsRef}>
                <button
                  type="button"
                  className={`nav-link ${isReports || reportsOpen ? 'active' : ''}`}
                  onClick={() => {
                    setReportsOpen(!reportsOpen);
                    setStaffOpen(false);
                    setWelcomeOpen(false);
                  }}
                >
                  <BarChart2 size={16} />
                  <span>Reports</span>
                  <ChevronDown size={14} style={{ marginLeft: '2px' }} />
                </button>
                {reportsOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/trust/reports-it"
                      className={`dropdown-item ${path.includes('10bd') || path.includes('reports_it') || path.includes('reports-it') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Form No. 10BD
                    </Link>
                    <Link
                      to="/trust/reports"
                      className={`dropdown-item ${path === '/trust/reports.php' || path === '/trust/reports' || path.includes('receipts') || path.includes('receipt-report') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Receipt Reports
                    </Link>
                    <Link
                      to="/trust/donation-head-report"
                      className={`dropdown-item ${path.includes('donation_head_report') || path.includes('donation-head-report') || path.includes('head-wise') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Head-Wise Reports
                    </Link>
                    <Link
                      to="/trust/donor-reports"
                      className={`dropdown-item ${path.includes('donor_reports') || path.includes('donor-reports') || path.includes('donor') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Donor Reports
                    </Link>
                    <Link
                      to="/trust/donation-type-report"
                      className={`dropdown-item ${path.includes('donation_type_report') || path.includes('donation-type-report') || path.includes('/type') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Donation Type Report
                    </Link>
                    <Link
                      to="/trust/payment-mode-report"
                      className={`dropdown-item ${path.includes('payment_mode_report') || path.includes('payment-mode-report') || path.includes('payment-mode') ? 'active' : ''}`}
                      onClick={() => setReportsOpen(false)}
                    >
                      - Payment Mode Report
                    </Link>
                  </div>
                )}
              </li>

              {/* Welcome Dropdown */}
              <li className="nav-item" ref={welcomeRef}>
                <button
                  type="button"
                  className={`nav-link ${isWelcome || welcomeOpen ? 'active' : ''}`}
                  onClick={() => {
                    setWelcomeOpen(!welcomeOpen);
                    setStaffOpen(false);
                    setReportsOpen(false);
                  }}
                >
                  <User size={16} />
                  <span>Welcome</span>
                  <ChevronDown size={14} style={{ marginLeft: '2px' }} />
                </button>
                {welcomeOpen && (
                  <div className="dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '200px' }}>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/my-profile');
                      }}
                    >
                      - My Profile
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/receipt-options');
                      }}
                    >
                      - Receipt Options
                    </button>

                    <button
                      className="dropdown-item"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/all-certificate');
                      }}
                    >
                      <span>- 80G Vault</span>
                      <span style={{ backgroundColor: '#dc3545', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px' }}>
                        New
                      </span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/my-subscriptions');
                      }}
                    >
                      - My Subscriptions
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/new-password');
                      }}
                    >
                      - Change Password
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        navigate('/trust/support');
                      }}
                    >
                      - Support
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setWelcomeOpen(false);
                        onLogout();
                      }}
                    >
                      - LogOut
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </nav>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <ul className="mobile-nav-list">
              {/* Dashboard */}
              <li>
                <Link
                  to="/trust"
                  className={`mobile-nav-link ${isDashboard ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mobile-link-left">
                    <Gauge size={18} />
                    <span>Dashboard</span>
                  </div>
                </Link>
              </li>

              {/* Donation Head */}
              <li>
                <Link
                  to="/trust/donation-head"
                  className={`mobile-nav-link ${isDonationHead ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mobile-link-left">
                    <List size={18} />
                    <span>Donation Head</span>
                  </div>
                </Link>
              </li>

              {/* Donation Receipt */}
              <li>
                <Link
                  to="/trust/donation-receipt"
                  className={`mobile-nav-link ${isDonationReceipt ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mobile-link-left">
                    <FileText size={18} />
                    <span>Donation Receipt</span>
                  </div>
                </Link>
              </li>

              {/* Staff (Accordion) */}
              <li className="mobile-nav-accordion">
                <button
                  type="button"
                  className={`mobile-nav-link ${isStaff ? 'active' : ''}`}
                  onClick={() => setMobileStaffOpen(!mobileStaffOpen)}
                >
                  <div className="mobile-link-left">
                    <Users size={18} />
                    <span>Staff</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: mobileStaffOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {mobileStaffOpen && (
                  <div className="mobile-sub-menu">
                    <Link
                      to="/trust/roles"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Member Roles
                    </Link>
                    <Link
                      to="/trust/staff"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Staff Members
                    </Link>
                  </div>
                )}
              </li>

              {/* Reports (Accordion) */}
              <li className="mobile-nav-accordion">
                <button
                  type="button"
                  className={`mobile-nav-link ${isReports ? 'active' : ''}`}
                  onClick={() => setMobileReportsOpen(!mobileReportsOpen)}
                >
                  <div className="mobile-link-left">
                    <BarChart2 size={18} />
                    <span>Reports</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: mobileReportsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {mobileReportsOpen && (
                  <div className="mobile-sub-menu">
                    <Link
                      to="/trust/reports-it"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Form No. 10BD
                    </Link>
                    <Link
                      to="/trust/reports"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Receipt Reports
                    </Link>
                    <Link
                      to="/trust/donation-head-report"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Head-Wise Reports
                    </Link>
                    <Link
                      to="/trust/donor-reports"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Donor Reports
                    </Link>
                    <Link
                      to="/trust/donation-type-report"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Donation Type Report
                    </Link>
                    <Link
                      to="/trust/payment-mode-report"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Payment Mode Report
                    </Link>
                  </div>
                )}
              </li>

              {/* Welcome (Accordion) */}
              <li className="mobile-nav-accordion">
                <button
                  type="button"
                  className={`mobile-nav-link ${isWelcome ? 'active' : ''}`}
                  onClick={() => setMobileWelcomeOpen(!mobileWelcomeOpen)}
                >
                  <div className="mobile-link-left">
                    <User size={18} />
                    <span>Welcome</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: mobileWelcomeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {mobileWelcomeOpen && (
                  <div className="mobile-sub-menu">
                    <Link
                      to="/trust/my-profile"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - My Profile
                    </Link>
                    <Link
                      to="/trust/receipt-options"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Receipt Options
                    </Link>
                    <Link
                      to="/trust/all-certificate"
                      className="mobile-sub-link"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>- 80G Vault</span>
                      <span style={{ backgroundColor: '#dc3545', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px' }}>
                        New
                      </span>
                    </Link>
                    <Link
                      to="/trust/my-subscriptions"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - My Subscriptions
                    </Link>
                    <Link
                      to="/trust/new-password"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Change Password
                    </Link>
                    <Link
                      to="/trust/support"
                      className="mobile-sub-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      - Support
                    </Link>
                    <button
                      type="button"
                      className="mobile-sub-link"
                      style={{ textAlign: 'left', background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: '#dc3545' }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                    >
                      - LogOut
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Upgrade Subscription Modal */}
      <UpgradePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header-green">
              <h3>Change Password</h3>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsPasswordModalOpen(false); setPasswordSuccess(true); }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" required placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" required placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" required placeholder="Confirm new password" />
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
        isOpen={passwordSuccess}
        type="success"
        title="Password Updated"
        message="Password updated successfully!"
        confirmText="OK"
        onConfirm={() => setPasswordSuccess(false)}
        onCancel={() => setPasswordSuccess(false)}
      />
    </>
  );
}
