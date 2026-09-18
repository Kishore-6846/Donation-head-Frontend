import React from 'react';
import { useLocation } from 'react-router-dom';
import TrustDashboardPage from './TrustDashboardPage';
import SuperAdminDashboardPage from './SuperAdminDashboardPage';

export default function DashboardPage(props) {
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  if (isSuperAdmin) {
    return <SuperAdminDashboardPage {...props} />;
  }

  return <TrustDashboardPage {...props} />;
}
