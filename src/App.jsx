import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Footer from './components/Footer';
import Logo from './components/Logo';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TrustDashboardPage from './pages/TrustDashboardPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
import DonationHeadsPage from './pages/DonationHeadsPage';
import DonationReceiptsPage from './pages/DonationReceiptsPage';
import RolesPage from './pages/RolesPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import MyProfilePage from './pages/MyProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AllCertificatesPage from './pages/AllCertificatesPage';
import NewCertificatePage from './pages/NewCertificatePage';
import NewDonationHeadPage from './pages/NewDonationHeadPage';
import BuyStaffUsersPage from './pages/BuyStaffUsersPage';
import UpgradePlanPage from './pages/UpgradePlanPage';
import NewDonationReceiptPage from './pages/NewDonationReceiptPage';
import EditDonationReceiptPage from './pages/EditDonationReceiptPage';
import DownloadBulkReceiptsPage from './pages/DownloadBulkReceiptsPage';
import AddRolePage from './pages/AddRolePage';
import Form10BDReportPage from './pages/Form10BDReportPage';
import ReceiptReportPage from './pages/ReceiptReportPage';
import DonationHeadReportPage from './pages/DonationHeadReportPage';
import DonorReportPage from './pages/DonorReportPage';
import DonationTypeReportPage from './pages/DonationTypeReportPage';
import PaymentModeReportPage from './pages/PaymentModeReportPage';
import ReceiptOptionsPage from './pages/ReceiptOptionsPage';
import EditReceiptOptionsPage from './pages/EditReceiptOptionsPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';
import NewPasswordPage from './pages/NewPasswordPage';
import SupportPage from './pages/SupportPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import CancellationRefundPolicyPage from './pages/CancellationRefundPolicyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PrintReceiptPage from './pages/PrintReceiptPage';
import WhatsAppButton from './components/WhatsAppButton';
import SimplePopup from './components/SimplePopup';

// Super Admin Pages
import PlansManagementPage from './pages/PlansManagementPage';
import UsersManagementPage from './pages/UsersManagementPage';
import EmployeesManagementPage from './pages/EmployeesManagementPage';
import ReceiptTypesPage from './pages/ReceiptTypesPage';
import NotificationsManagementPage from './pages/NotificationsManagementPage';
import SuperAdminReportsPage from './pages/SuperAdminReportsPage';
import AllReceiptsAdminPage from './pages/AllReceiptsAdminPage';
import NewPlanPage from './pages/NewPlanPage';
import NewUserPage from './pages/NewUserPage';
import NewEmployeePage from './pages/NewEmployeePage';
import NewReceiptTypePage from './pages/NewReceiptTypePage';
import NewNotificationPage from './pages/NewNotificationPage';
import ReportTypesPage from './pages/ReportTypesPage';
import NewReportTypePage from './pages/NewReportTypePage';
import PublishedReportsPage from './pages/PublishedReportsPage';
import NewReportPage from './pages/NewReportPage';
import CustomReportsAdminPage from './pages/CustomReportsAdminPage';
import DynamicReportViewerPage from './pages/DynamicReportViewerPage';
import TrustNotificationsPage from './pages/TrustNotificationsPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import TrustDetailsViewPage from './pages/TrustDetailsViewPage';
import {
  getSuperAdminSession,
  getTrustSession,
  setSuperAdminSession,
  setTrustSession,
  clearSuperAdminSession,
  clearTrustSession,
  clearCurrentTabSessions,
  isSuperAdminPath,
  isSuperUser
} from './utils/authStorage';

// Check if a path is a Super Admin route
function isSuperAdminPathCheck(pathLower) {
  return (
    pathLower.startsWith('/superadmin') ||
    pathLower.startsWith('/super-admin') ||
    pathLower === '/plans' ||
    pathLower === '/new-plan' ||
    pathLower.startsWith('/edit-plan') ||
    pathLower === '/users' ||
    pathLower === '/new-user' ||
    pathLower.startsWith('/edit-user') ||
    pathLower === '/employees' ||
    pathLower === '/new-employee' ||
    pathLower.startsWith('/edit-employee') ||
    pathLower === '/receipt-types' ||
    pathLower === '/new-receipt-type' ||
    pathLower.startsWith('/edit-receipt-type') ||
    pathLower === '/all-receipts' ||
    pathLower === '/all-reports' ||
    pathLower === '/published-reports' ||
    pathLower === '/notifications' ||
    pathLower === '/new-notification' ||
    pathLower.startsWith('/edit-notification') ||
    pathLower === '/report-types' ||
    pathLower === '/new-report-type' ||
    pathLower.startsWith('/edit-report-type') ||
    pathLower === '/superadmin-reports'
  );
}

// Protected Route Guard:
// Unauthenticated Super Admin routes redirect to /superadmin/login
// Unauthenticated Trust routes redirect to /trust/login
function ProtectedLayout({ superAdminUser, trustUser }) {
  const location = useLocation();
  const pathLower = location.pathname.toLowerCase();
  const isSuperRoute = isSuperAdminPathCheck(pathLower);

  if (isSuperRoute) {
    if (!superAdminUser) {
      return <Navigate to="/superadmin/login" replace />;
    }
    return <Outlet />;
  }

  // Trust portal routes strictly require trustUser and must NOT be in pending status
  if (!trustUser || trustUser.status === 'Pending' || trustUser.status === 'Pending Approval') {
    return <Navigate to="/trust/login" replace />;
  }

  return <Outlet />;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSuperAdminRoute = isSuperAdminPathCheck(location.pathname.toLowerCase());

  // Global Dialog State to replace browser default popups everywhere
  const [globalDialog, setGlobalDialog] = useState({
    isOpen: false,
    type: 'info',
    title: 'Notice',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    // Intercept native window.alert globally across the entire website
    const originalAlert = window.alert;
    window.alert = (message) => {
      setGlobalDialog({
        isOpen: true,
        type: 'error',
        title: 'Notice',
        message: typeof message === 'object' ? JSON.stringify(message) : String(message),
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => setGlobalDialog(prev => ({ ...prev, isOpen: false })),
        onCancel: () => setGlobalDialog(prev => ({ ...prev, isOpen: false }))
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Manage separate, isolated sessions for Super Admin and Trust Admin
  const [superAdminUser, setSuperAdminUser] = useState(() => getSuperAdminSession()?.user || null);
  const [trustUser, setTrustUser] = useState(() => getTrustSession()?.user || null);

  useEffect(() => {
    const onSuperChange = (e) => setSuperAdminUser(e.detail);
    const onTrustChange = (e) => setTrustUser(e.detail);
    window.addEventListener('superadmin-session-change', onSuperChange);
    window.addEventListener('trust-session-change', onTrustChange);
    return () => {
      window.removeEventListener('superadmin-session-change', onSuperChange);
      window.removeEventListener('trust-session-change', onTrustChange);
    };
  }, []);

  useEffect(() => {
    if (isSuperAdminRoute) {
      const sess = getSuperAdminSession();
      if (sess?.user && isSuperUser(sess.user)) {
        setSuperAdminUser(sess.user);
      }
    } else {
      const sess = getTrustSession();
      if (sess?.user && !isSuperUser(sess.user)) {
        setTrustUser(sess.user);
      }
    }
  }, [location.pathname]);

  const activeSuperUser = (superAdminUser && isSuperUser(superAdminUser)) ? superAdminUser : getSuperAdminSession()?.user;
  const activeTrustUser = (trustUser && !isSuperUser(trustUser)) ? trustUser : getTrustSession()?.user;
  const user = isSuperAdminRoute ? activeSuperUser : activeTrustUser;

  const handleLogout = () => {
    if (isSuperAdminRoute) {
      clearSuperAdminSession();
      setSuperAdminUser(null);
      setTrustUser(null);
      navigate('/superadmin/login', { replace: true });
    } else {
      clearTrustSession();
      setTrustUser(null);
      setSuperAdminUser(null);
      navigate('/trust/login', { replace: true });
    }
  };

  const handleSuperAdminLoginSuccess = (userData) => {
    setSuperAdminUser(userData);
    setTrustUser(null);
  };

  const handleTrustLoginSuccess = (userData) => {
    setTrustUser(userData);
    setSuperAdminUser(null);
  };

  const handleUpdateUser = (updatedUserData) => {
    if (isSuperAdminRoute) {
      setSuperAdminSession(updatedUserData);
      setSuperAdminUser(updatedUserData);
    } else {
      setTrustSession(updatedUserData);
      setTrustUser(updatedUserData);
    }
  };

  const isAuthPage =
    location.pathname.toLowerCase().includes('login') ||
    location.pathname.toLowerCase().includes('register') ||
    location.pathname.toLowerCase().includes('signup') ||
    location.pathname.toLowerCase().includes('registration');
  const isPrintPage = location.pathname.includes('print-receipt') || location.pathname.includes('print_receipt');
  const isPolicyPage =
    location.pathname.toLowerCase().includes('terms-and-conditions') ||
    location.pathname.toLowerCase().includes('cancellation-refund-policy') ||
    location.pathname.toLowerCase().includes('privacy-policy');
  const isPlainLayout = !user || isAuthPage || isPrintPage;

  return (
    <div className={isPlainLayout ? "app-root-plain" : "app-shell-layout"}>
      {!isPlainLayout && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className={isPlainLayout ? "app-plain-column" : "app-main-column"}>
        {!isPlainLayout && (
          <TopHeader
            user={user}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Public Top Header for Policy pages when accessed without login */}
        {!user && isPolicyPage && (
          <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #eef2f5', padding: '14px 20px', width: '100%', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Logo />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/trust/login"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#334155',
                    textDecoration: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  Admin Login
                </Link>
                <Link
                  to="/trust/register"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#ffffff',
                    textDecoration: 'none',
                    backgroundColor: '#00a651'
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          </header>
        )}

        <div
          className={isPlainLayout ? "app-plain-content" : "app-page-container"}
          style={!user && isPolicyPage ? { maxWidth: '1140px', margin: '24px auto', padding: '0 20px' } : undefined}
        >
          <Routes>
            {/* Public Super Admin Auth Routes */}
            <Route
              path="/superadmin/login"
              element={<SuperAdminLoginPage onLoginSuccess={handleSuperAdminLoginSuccess} />}
            />
            <Route
              path="/superAdmin/login"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superadmin/login.php"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superAdmin/login.php"
              element={<Navigate to="/superadmin/login" replace />}
            />

            {/* Super Admin Registration is removed - redirect all registration endpoints to login */}
            <Route
              path="/superadmin/register"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superAdmin/register"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superadmin/signup"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superAdmin/signup"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superadmin/registration"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superAdmin/registration"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superadmin/register.php"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route
              path="/superAdmin/register.php"
              element={<Navigate to="/superadmin/login" replace />}
            />

            {/* Public Login Routes */}
            <Route
              path="/trust/login"
              element={<LoginPage onLoginSuccess={handleTrustLoginSuccess} />}
            />
            <Route
              path="/trust/login.php"
              element={<Navigate to="/trust/login" replace />}
            />
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={handleTrustLoginSuccess} />}
            />
            <Route
              path="/login.php"
              element={<Navigate to="/login" replace />}
            />

            {/* Public Registration Routes */}
            <Route
              path="/trust/register"
              element={trustUser ? <Navigate to="/trust" replace /> : <RegisterPage onLoginSuccess={handleTrustLoginSuccess} />}
            />
            <Route
              path="/trust/register.php"
              element={<Navigate to="/trust/register" replace />}
            />
            <Route
              path="/trust/registration"
              element={<Navigate to="/trust/register" replace />}
            />
            <Route
              path="/trust/registration.php"
              element={<Navigate to="/trust/register" replace />}
            />
            <Route
              path="/register"
              element={trustUser ? <Navigate to="/trust" replace /> : <RegisterPage onLoginSuccess={handleTrustLoginSuccess} />}
            />
            <Route
              path="/register.php"
              element={<Navigate to="/register" replace />}
            />
            <Route
              path="/registration.php"
              element={<Navigate to="/register" replace />}
            />

            {/* Public Legal & Policy Pages (accessible without login or with login) */}
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/terms-and-conditions.php" element={<Navigate to="/terms-and-conditions" replace />} />
            <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicyPage />} />
            <Route path="/cancellation-refund-policy.php" element={<Navigate to="/cancellation-refund-policy" replace />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy-policy.php" element={<Navigate to="/privacy-policy" replace />} />

            <Route path="/trust/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/trust/terms-and-conditions.php" element={<Navigate to="/trust/terms-and-conditions" replace />} />
            <Route path="/trust/cancellation-refund-policy" element={<CancellationRefundPolicyPage />} />
            <Route path="/trust/cancellation-refund-policy.php" element={<Navigate to="/trust/cancellation-refund-policy" replace />} />
            <Route path="/trust/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/trust/privacy-policy.php" element={<Navigate to="/trust/privacy-policy" replace />} />

            <Route path="/superadmin/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/superadmin/terms-and-conditions.php" element={<Navigate to="/superadmin/terms-and-conditions" replace />} />
            <Route path="/superadmin/cancellation-refund-policy" element={<CancellationRefundPolicyPage />} />
            <Route path="/superadmin/cancellation-refund-policy.php" element={<Navigate to="/superadmin/cancellation-refund-policy" replace />} />
            <Route path="/superadmin/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/superadmin/privacy-policy.php" element={<Navigate to="/superadmin/privacy-policy" replace />} />

            {/* Public Receipt View (for donors receiving receipt links) */}
            <Route path="/trust/print-receipt" element={<PrintReceiptPage user={user} />} />
            <Route path="/trust/print_receipt" element={<PrintReceiptPage user={user} />} />
            <Route path="/trust/print-receipt.php" element={<PrintReceiptPage user={user} />} />
            <Route path="/trust/print_receipt.php" element={<PrintReceiptPage user={user} />} />
            <Route path="/print-receipt" element={<PrintReceiptPage user={user} />} />
            <Route path="/print-receipt.php" element={<PrintReceiptPage user={user} />} />

            {/* =========================================================
                Protected Routes (Super Admin & Trust Panels)
                Super Admin requires superAdminUser; Trust requires trustUser
                ========================================================= */}
            <Route element={<ProtectedLayout superAdminUser={superAdminUser} trustUser={trustUser} />}>
              {/* Super Admin Primary Routes */}
              <Route path="/superadmin" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superadmin/" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superAdmin" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superAdmin/" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superAdmin/dashboard" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superAdmin/*" element={<SuperAdminDashboardPage user={user} />} />
              <Route path="/superadmin/plans" element={<PlansManagementPage />} />
              <Route path="/superadmin/new-plan" element={<NewPlanPage />} />
              <Route path="/superadmin/edit-plan/:id" element={<NewPlanPage />} />
              <Route path="/new-plan" element={<NewPlanPage />} />

              <Route path="/superadmin/users" element={<UsersManagementPage />} />
              <Route path="/superadmin/users/:id" element={<TrustDetailsViewPage />} />
              <Route path="/superadmin/view-user/:id" element={<TrustDetailsViewPage />} />
              <Route path="/superadmin/user-details/:id" element={<TrustDetailsViewPage />} />
              <Route path="/superadmin/user/:id" element={<TrustDetailsViewPage />} />
              <Route path="/view-user/:id" element={<TrustDetailsViewPage />} />
              <Route path="/superadmin/new-user" element={<NewUserPage />} />
              <Route path="/superadmin/edit-user/:id" element={<NewUserPage />} />
              <Route path="/new-user" element={<NewUserPage />} />

              <Route path="/superadmin/employees" element={<EmployeesManagementPage />} />
              <Route path="/superadmin/new-employee" element={<NewEmployeePage />} />
              <Route path="/superadmin/edit-employee/:id" element={<NewEmployeePage />} />
              <Route path="/new-employee" element={<NewEmployeePage />} />

              {/* Super Admin Donation Heads Management */}
              <Route path="/superadmin/donation-heads" element={<DonationHeadsPage user={user} />} />
              <Route path="/superadmin/donation-head" element={<DonationHeadsPage user={user} />} />
              <Route path="/superadmin/new-donation-head" element={<NewDonationHeadPage user={user} />} />
              <Route path="/superadmin/edit-donation-head" element={<NewDonationHeadPage user={user} />} />
              <Route path="/superadmin/edit-donation-head/:id" element={<NewDonationHeadPage user={user} />} />

              <Route path="/superadmin/receipt-types" element={<Navigate to="/superadmin/all-receipts" replace />} />
              <Route path="/superadmin/new-receipt-type" element={<Navigate to="/superadmin/all-receipts" replace />} />
              <Route path="/superadmin/edit-receipt-type/:id" element={<Navigate to="/superadmin/all-receipts" replace />} />
              <Route path="/new-receipt-type" element={<Navigate to="/superadmin/all-receipts" replace />} />

              <Route path="/superadmin/all-receipts" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/all_receipts" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/donation-receipts" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/donation-receipt" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/donation_receipt" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/donation_receipts" element={<AllReceiptsAdminPage />} />
              <Route path="/superadmin/donation-receipts.php" element={<Navigate to="/superadmin/all-receipts" replace />} />
              <Route path="/superadmin/donation-receipt.php" element={<Navigate to="/superadmin/all-receipts" replace />} />
              <Route path="/superadmin/all-receipts.php" element={<Navigate to="/superadmin/all-receipts" replace />} />

              <Route path="/superadmin/notifications" element={<NotificationsManagementPage />} />
              <Route path="/superadmin/new-notification" element={<NewNotificationPage />} />
              <Route path="/superadmin/edit-notification/:id" element={<NewNotificationPage />} />
              <Route path="/new-notification" element={<NewNotificationPage />} />

              <Route path="/superadmin/reports" element={<SuperAdminReportsPage />} />
              <Route path="/superadmin/report-types" element={<ReportTypesPage />} />
              <Route path="/superadmin/new-report-type" element={<NewReportTypePage />} />
              <Route path="/superadmin/edit-report-type/:id" element={<NewReportTypePage />} />
              <Route path="/new-report-type" element={<NewReportTypePage />} />

              <Route path="/superadmin/all-reports" element={<PublishedReportsPage />} />
              <Route path="/superadmin/published-reports" element={<PublishedReportsPage />} />
              <Route path="/superadmin/new-report" element={<NewReportPage />} />
              <Route path="/superadmin/edit-report/:id" element={<NewReportPage />} />
              <Route path="/new-report" element={<NewReportPage />} />
              <Route path="/trust/new-report" element={<NewReportPage />} />
              <Route path="/trust/create-report" element={<NewReportPage />} />
              <Route path="/superadmin/report/:id" element={<DynamicReportViewerPage />} />
              <Route path="/superadmin/custom-report/:id" element={<DynamicReportViewerPage />} />
              <Route path="/trust/custom-report/:id" element={<DynamicReportViewerPage />} />
              <Route path="/trust/report/:id" element={<DynamicReportViewerPage />} />

              {/* Super Admin Reports Direct Routes */}
              <Route path="/superadmin/reports-it" element={<Form10BDReportPage user={user} />} />
              <Route path="/superadmin/reports-receipts" element={<ReceiptReportPage user={user} />} />
              <Route path="/superadmin/donation-head-report" element={<DonationHeadReportPage user={user} />} />
              <Route path="/superadmin/donation_head_report" element={<DonationHeadReportPage user={user} />} />
              <Route path="/superadmin/head-wise-report" element={<DonationHeadReportPage user={user} />} />
              <Route path="/superadmin/donor-reports" element={<DonorReportPage user={user} />} />
              <Route path="/superadmin/donor-report" element={<DonorReportPage user={user} />} />
              <Route path="/superadmin/donor_report" element={<DonorReportPage user={user} />} />
              <Route path="/superadmin/donor_reports" element={<DonorReportPage user={user} />} />
              <Route path="/superadmin/donation-type-report" element={<DonationTypeReportPage user={user} />} />
              <Route path="/superadmin/donation_type_report" element={<DonationTypeReportPage user={user} />} />
              <Route path="/superadmin/payment-mode-report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/superadmin/payment_mode_report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/superadmin/payment-report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/superadmin/payment-reports" element={<PaymentModeReportPage user={user} />} />



              {/* Super Admin Short Aliases */}
              <Route path="/plans" element={<PlansManagementPage />} />
              <Route path="/users" element={<UsersManagementPage />} />
              <Route path="/employees" element={<EmployeesManagementPage />} />
              <Route path="/donation-heads" element={<DonationHeadsPage user={user} />} />
              <Route path="/receipt-types" element={<Navigate to="/all-receipts" replace />} />
              <Route path="/report-types" element={<ReportTypesPage />} />
              <Route path="/all-receipts" element={<AllReceiptsAdminPage />} />
              <Route path="/all-reports" element={<PublishedReportsPage />} />
              <Route path="/published-reports" element={<PublishedReportsPage />} />
              <Route path="/notifications" element={<NotificationsManagementPage />} />
              <Route path="/superadmin-reports" element={<SuperAdminReportsPage />} />
              <Route path="/superadmin/revenue" element={<SuperAdminReportsPage />} />
              <Route path="/superadmin/subscription-revenue" element={<SuperAdminReportsPage />} />

              {/* Trust & Admin Dashboard Aliases */}
              <Route path="/admin" element={<TrustDashboardPage user={user} />} />
              <Route path="/admin/" element={<TrustDashboardPage user={user} />} />
              <Route path="/admin/dashboard" element={<TrustDashboardPage user={user} />} />
              <Route path="/dashboard" element={<TrustDashboardPage user={user} />} />
              <Route path="/trust" element={<TrustDashboardPage user={user} />} />
              <Route path="/trust/" element={<TrustDashboardPage user={user} />} />
              <Route path="/trust/index" element={<TrustDashboardPage user={user} />} />
              <Route path="/trust/dashboard" element={<TrustDashboardPage user={user} />} />
              <Route path="/trust/index.php" element={<Navigate to="/trust" replace />} />

              {/* Trust Notifications & Updates */}
              <Route path="/trust/notifications" element={<TrustNotificationsPage user={user} />} />
              <Route path="/trust/updates" element={<TrustNotificationsPage user={user} />} />
              <Route path="/trust/notifications.php" element={<Navigate to="/trust/notifications" replace />} />
              <Route path="/trust/updates.php" element={<Navigate to="/trust/notifications" replace />} />
              <Route path="/admin/notifications" element={<TrustNotificationsPage user={user} />} />

              {/* Donation Heads */}
              <Route path="/trust/donation-head" element={<DonationHeadsPage user={user} />} />
              <Route path="/trust/donation_head" element={<DonationHeadsPage user={user} />} />
              <Route path="/trust/donation-head.php" element={<Navigate to="/trust/donation-head" replace />} />
              <Route path="/trust/donation_head.php" element={<Navigate to="/trust/donation-head" replace />} />
              <Route path="/trust/new-donation-head" element={<NewDonationHeadPage user={user} />} />
              <Route path="/trust/new_donation_head" element={<NewDonationHeadPage user={user} />} />
              <Route path="/trust/new-donation-head.php" element={<Navigate to="/trust/new-donation-head" replace />} />
              <Route path="/trust/new_donation_head.php" element={<Navigate to="/trust/new-donation-head" replace />} />

              {/* Donation Receipts */}
              <Route path="/trust/donation-receipt" element={<DonationReceiptsPage user={user} />} />
              <Route path="/trust/donation_receipt" element={<DonationReceiptsPage user={user} />} />
              <Route path="/trust/donation-receipt.php" element={<Navigate to="/trust/donation-receipt" replace />} />
              <Route path="/trust/donation_receipt.php" element={<Navigate to="/trust/donation-receipt" replace />} />
              <Route path="/trust/dl-receipts" element={<DownloadBulkReceiptsPage user={user} />} />
              <Route path="/trust/dl_receipts" element={<DownloadBulkReceiptsPage user={user} />} />
              <Route path="/trust/dl-receipts.php" element={<Navigate to="/trust/dl-receipts" replace />} />
              <Route path="/trust/dl_receipts.php" element={<Navigate to="/trust/dl-receipts" replace />} />
              <Route path="/trust/export-receipts" element={<DownloadBulkReceiptsPage user={user} />} />
              <Route path="/trust/export-receipts.php" element={<Navigate to="/trust/dl-receipts" replace />} />

              {/* Roles & Permissions */}
              <Route path="/trust/roles" element={<RolesPage user={user} />} />
              <Route path="/trust/roles.php" element={<Navigate to="/trust/roles" replace />} />
              <Route path="/trust/member-roles" element={<RolesPage user={user} />} />
              <Route path="/trust/member_roles" element={<RolesPage user={user} />} />
              <Route path="/trust/member-roles.php" element={<Navigate to="/trust/roles" replace />} />
              <Route path="/trust/member_roles.php" element={<Navigate to="/trust/roles" replace />} />
              <Route path="/trust/add-role" element={<AddRolePage user={user} />} />
              <Route path="/trust/add_role" element={<AddRolePage user={user} />} />
              <Route path="/trust/add-role.php" element={<Navigate to="/trust/add-role" replace />} />
              <Route path="/trust/add_role.php" element={<Navigate to="/trust/add-role" replace />} />
              <Route path="/trust/edit-role/:id" element={<AddRolePage user={user} />} />
              <Route path="/trust/edit-role" element={<AddRolePage user={user} />} />
              <Route path="/trust/edit_role/:id" element={<AddRolePage user={user} />} />
              <Route path="/trust/edit_role" element={<AddRolePage user={user} />} />
              <Route path="/trust/view-role/:id" element={<AddRolePage user={user} />} />
              <Route path="/trust/view_role/:id" element={<AddRolePage user={user} />} />

              {/* Staff Management */}
              <Route path="/trust/staff" element={<StaffPage user={user} />} />
              <Route path="/trust/staff.php" element={<Navigate to="/trust/staff" replace />} />
              <Route path="/trust/trust-staff" element={<StaffPage user={user} />} />
              <Route path="/trust/trust_staff" element={<StaffPage user={user} />} />
              <Route path="/trust/trust-staff.php" element={<Navigate to="/trust/staff" replace />} />
              <Route path="/trust/trust_staff.php" element={<Navigate to="/trust/staff" replace />} />

              {/* Reports */}
              <Route path="/trust/reports-it" element={<Form10BDReportPage user={user} />} />
              <Route path="/trust/reports_it" element={<Form10BDReportPage user={user} />} />
              <Route path="/trust/reports-it.php" element={<Navigate to="/trust/reports-it" replace />} />
              <Route path="/trust/reports_it.php" element={<Navigate to="/trust/reports-it" replace />} />
              <Route path="/trust/reports/10bd" element={<Form10BDReportPage user={user} />} />
              <Route path="/trust/reports/10bd.php" element={<Navigate to="/trust/reports-it" replace />} />
              <Route path="/trust/reports/form-10bd" element={<Form10BDReportPage user={user} />} />
              <Route path="/trust/reports" element={<ReceiptReportPage user={user} />} />
              <Route path="/trust/reports.php" element={<Navigate to="/trust/reports" replace />} />
              <Route path="/trust/reports/receipts" element={<ReceiptReportPage user={user} />} />
              <Route path="/trust/reports/receipts.php" element={<Navigate to="/trust/reports" replace />} />
              <Route path="/trust/reports/receipt-reports" element={<ReceiptReportPage user={user} />} />
              <Route path="/trust/reports/receipt_reports" element={<ReceiptReportPage user={user} />} />
              <Route path="/trust/reports-receipt-report" element={<ReceiptReportPage user={user} />} />
              <Route path="/trust/donation-head-report" element={<DonationHeadReportPage user={user} />} />
              <Route path="/trust/donation_head_report" element={<DonationHeadReportPage user={user} />} />
              <Route path="/trust/donation-head-report.php" element={<Navigate to="/trust/donation-head-report" replace />} />
              <Route path="/trust/donation_head_report.php" element={<Navigate to="/trust/donation-head-report" replace />} />
              <Route path="/trust/reports/head-wise" element={<DonationHeadReportPage user={user} />} />
              <Route path="/trust/reports/head-wise.php" element={<Navigate to="/trust/donation-head-report" replace />} />
              <Route path="/trust/reports/head_wise" element={<DonationHeadReportPage user={user} />} />
              <Route path="/trust/reports/head_wise.php" element={<Navigate to="/trust/donation-head-report" replace />} />
              <Route path="/trust/donor-reports" element={<DonorReportPage user={user} />} />
              <Route path="/trust/donor_reports" element={<DonorReportPage user={user} />} />
              <Route path="/trust/donor-reports.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/donor_reports.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/donor-report" element={<DonorReportPage user={user} />} />
              <Route path="/trust/donor_report" element={<DonorReportPage user={user} />} />
              <Route path="/trust/donor-report.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/donor_report.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/reports/donors" element={<DonorReportPage user={user} />} />
              <Route path="/trust/reports/donors.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/reports-donors" element={<DonorReportPage user={user} />} />
              <Route path="/trust/reports/donor" element={<DonorReportPage user={user} />} />
              <Route path="/trust/reports/donor.php" element={<Navigate to="/trust/donor-reports" replace />} />
              <Route path="/trust/reports-donation-head" element={<DonationHeadReportPage user={user} />} />
              <Route path="/trust/donation-type-report" element={<DonationTypeReportPage user={user} />} />
              <Route path="/trust/donation_type_report" element={<DonationTypeReportPage user={user} />} />
              <Route path="/trust/donation-type-report.php" element={<Navigate to="/trust/donation-type-report" replace />} />
              <Route path="/trust/donation_type_report.php" element={<Navigate to="/trust/donation-type-report" replace />} />
              <Route path="/trust/reports-donation-types" element={<DonationTypeReportPage user={user} />} />
              <Route path="/trust/reports/type" element={<DonationTypeReportPage user={user} />} />
              <Route path="/trust/reports/type.php" element={<Navigate to="/trust/donation-type-report" replace />} />
              <Route path="/trust/reports/donation-type" element={<DonationTypeReportPage user={user} />} />
              <Route path="/trust/payment-mode-report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/payment_mode_report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/payment-report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/payment-reports" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/payment_report" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/reports-payment" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/reports-payment-modes" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/payment-mode-report.php" element={<Navigate to="/trust/payment-mode-report" replace />} />
              <Route path="/trust/payment_mode_report.php" element={<Navigate to="/trust/payment-mode-report" replace />} />
              <Route path="/trust/reports/payment-mode" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/reports/payment-mode.php" element={<Navigate to="/trust/payment-mode-report" replace />} />
              <Route path="/trust/reports/payment_mode" element={<PaymentModeReportPage user={user} />} />
              <Route path="/trust/reports/:type" element={<ReportsPage user={user} />} />
              <Route path="/trust/superadmin-reports" element={<CustomReportsAdminPage user={user} />} />
              <Route path="/trust/custom-reports" element={<CustomReportsAdminPage user={user} />} />
              <Route path="/trust/all-reports" element={<PublishedReportsPage user={user} />} />
              <Route path="/trust/published-reports" element={<PublishedReportsPage user={user} />} />

              {/* Profile & Settings */}
              <Route path="/trust/my-profile" element={<MyProfilePage user={activeTrustUser} />} />
              <Route path="/trust/profile" element={<Navigate to="/trust/my-profile" replace />} />
              <Route path="/superadmin/my-profile" element={<MyProfilePage user={activeSuperUser} />} />
              <Route path="/superadmin/profile" element={<Navigate to="/superadmin/my-profile" replace />} />
              <Route path="/my-profile" element={<Navigate to={isSuperAdminRoute ? "/superadmin/my-profile" : "/trust/my-profile"} replace />} />
              <Route path="/profile" element={<Navigate to={isSuperAdminRoute ? "/superadmin/my-profile" : "/trust/my-profile"} replace />} />
              <Route path="/trust/my-profile.php" element={<Navigate to="/trust/my-profile" replace />} />
              <Route path="/trust/profile.php" element={<Navigate to="/trust/my-profile" replace />} />
              <Route path="/trust/edit-profile" element={<EditProfilePage user={activeTrustUser} onUpdateUser={handleUpdateUser} />} />
              <Route path="/trust/edit_profile" element={<Navigate to="/trust/edit-profile" replace />} />
              <Route path="/trust/editprofile" element={<Navigate to="/trust/edit-profile" replace />} />
              <Route path="/superadmin/edit-profile" element={<EditProfilePage user={activeSuperUser} onUpdateUser={handleUpdateUser} />} />
              <Route path="/superadmin/edit_profile" element={<Navigate to="/superadmin/edit-profile" replace />} />
              <Route path="/edit-profile" element={<Navigate to={isSuperAdminRoute ? "/superadmin/edit-profile" : "/trust/edit-profile"} replace />} />
              <Route path="/trust/edit-profile.php" element={<Navigate to="/trust/edit-profile" replace />} />
              <Route path="/trust/edit_profile.php" element={<Navigate to="/trust/edit-profile" replace />} />
              <Route path="/trust/editprofile.php" element={<Navigate to="/trust/edit-profile" replace />} />

              {/* Certificates & 80G Vault */}
              <Route path="/trust/all-certificate" element={<AllCertificatesPage user={user} />} />
              <Route path="/trust/all_certificate" element={<AllCertificatesPage user={user} />} />
              <Route path="/trust/vault" element={<AllCertificatesPage user={user} />} />
              <Route path="/trust/certificate" element={<AllCertificatesPage user={user} />} />
              <Route path="/trust/all-certificate.php" element={<Navigate to="/trust/all-certificate" replace />} />
              <Route path="/trust/all_certificate.php" element={<Navigate to="/trust/all-certificate" replace />} />
              <Route path="/trust/new-certificate" element={<NewCertificatePage user={user} />} />
              <Route path="/trust/new_certificate" element={<NewCertificatePage user={user} />} />
              <Route path="/trust/new-certificate.php" element={<Navigate to="/trust/new-certificate" replace />} />
              <Route path="/trust/new_certificate.php" element={<Navigate to="/trust/new-certificate" replace />} />

              {/* Staff Subscription & Plans */}
              <Route path="/trust/buy-staff-users" element={<BuyStaffUsersPage user={user} />} />
              <Route path="/trust/buy_staff_users" element={<BuyStaffUsersPage user={user} />} />
              <Route path="/trust/buy-staff-users.php" element={<Navigate to="/trust/buy-staff-users" replace />} />
              <Route path="/trust/buy_staff_users.php" element={<Navigate to="/trust/buy-staff-users" replace />} />
              <Route path="/trust/upgrade-plan" element={<UpgradePlanPage user={user} />} />
              <Route path="/trust/upgrade_plan" element={<UpgradePlanPage user={user} />} />
              <Route path="/trust/upgrade-plan.php" element={<Navigate to="/trust/upgrade-plan" replace />} />
              <Route path="/trust/upgrade_plan.php" element={<Navigate to="/trust/upgrade-plan" replace />} />

              {/* Receipt Entry & Edit */}
              <Route path="/trust/new-donation-receipt" element={<NewDonationReceiptPage user={user} />} />
              <Route path="/trust/new_donation_receipt" element={<NewDonationReceiptPage user={user} />} />
              <Route path="/trust/new-donation-receipt.php" element={<Navigate to="/trust/new-donation-receipt" replace />} />
              <Route path="/trust/new_donation_receipt.php" element={<Navigate to="/trust/new-donation-receipt" replace />} />
              <Route path="/trust/edit-donation-receipt" element={<EditDonationReceiptPage user={user} />} />
              <Route path="/trust/edit_donation_receipt" element={<EditDonationReceiptPage user={user} />} />
              <Route path="/trust/edit-donation-receipt.php" element={<EditDonationReceiptPage user={user} />} />
              <Route path="/trust/edit_donation_receipt.php" element={<EditDonationReceiptPage user={user} />} />

              {/* Receipt Options & Settings */}
              <Route path="/trust/receipt-options" element={<ReceiptOptionsPage />} />
              <Route path="/trust/receipt_options" element={<ReceiptOptionsPage />} />
              <Route path="/trust/receipt-settings" element={<ReceiptOptionsPage />} />
              <Route path="/trust/receipt_settings" element={<ReceiptOptionsPage />} />
              <Route path="/trust/receipt-options.php" element={<Navigate to="/trust/receipt-options" replace />} />
              <Route path="/trust/receipt_options.php" element={<Navigate to="/trust/receipt-options" replace />} />
              <Route path="/trust/edit-receipt-options" element={<EditReceiptOptionsPage />} />
              <Route path="/trust/edit_receipt_options" element={<EditReceiptOptionsPage />} />
              <Route path="/trust/edit-receipt-options.php" element={<EditReceiptOptionsPage />} />
              <Route path="/trust/edit_receipt_options.php" element={<EditReceiptOptionsPage />} />

              {/* Account, Subscriptions & Support */}
              <Route path="/trust/my-subscriptions" element={<MySubscriptionsPage />} />
              <Route path="/trust/my_subscriptions" element={<MySubscriptionsPage />} />
              <Route path="/trust/my-subscriptions.php" element={<Navigate to="/trust/my-subscriptions" replace />} />
              <Route path="/trust/my_subscriptions.php" element={<Navigate to="/trust/my-subscriptions" replace />} />

              <Route path="/trust/new-password" element={<NewPasswordPage user={user} />} />
              <Route path="/trust/new_password" element={<NewPasswordPage user={user} />} />
              <Route path="/trust/new-password.php" element={<Navigate to="/trust/new-password" replace />} />
              <Route path="/trust/new_password.php" element={<Navigate to="/trust/new-password" replace />} />
              <Route path="/superadmin/new-password" element={<NewPasswordPage user={user} />} />
              <Route path="/superadmin/new_password" element={<NewPasswordPage user={user} />} />
              <Route path="/superadmin/new-password.php" element={<Navigate to="/superadmin/new-password" replace />} />
              <Route path="/superadmin/new_password.php" element={<Navigate to="/superadmin/new-password" replace />} />
              <Route path="/trust/support" element={<SupportPage />} />
              <Route path="/trust/support.php" element={<Navigate to="/trust/support" replace />} />
              <Route path="/superadmin/support" element={<SupportPage user={user} />} />
              <Route path="/superadmin/support.php" element={<Navigate to="/superadmin/support" replace />} />

            </Route>

            {/* Root and Fallback: Redirect based on active session */}
            <Route
              path="/"
              element={
                trustUser ? (
                  <Navigate to="/trust" replace />
                ) : superAdminUser ? (
                  <Navigate to="/superadmin" replace />
                ) : (
                  <Navigate to="/trust/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={
                isSuperAdminRoute ? (
                  superAdminUser ? <Navigate to="/superadmin" replace /> : <Navigate to="/superadmin/login" replace />
                ) : (
                  trustUser ? <Navigate to="/trust" replace /> : <Navigate to="/trust/login" replace />
                )
              }
            />
          </Routes>
        </div>

        {(!isPlainLayout || (!user && isPolicyPage)) && <Footer />}
      </div>

      {/* Floating WhatsApp Button on every page (except standalone print receipts) */}
      {!isPrintPage && <WhatsAppButton />}

      {/* Global SimplePopup Modal Interceptor for entire website */}
      <SimplePopup
        isOpen={globalDialog.isOpen}
        type={globalDialog.type}
        title={globalDialog.title}
        message={globalDialog.message}
        confirmText={globalDialog.confirmText}
        cancelText={globalDialog.cancelText}
        showCancel={globalDialog.showCancel}
        onConfirm={globalDialog.onConfirm}
        onCancel={globalDialog.onCancel}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
