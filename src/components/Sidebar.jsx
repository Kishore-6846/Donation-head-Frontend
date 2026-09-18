import React from 'react';
import { useLocation } from 'react-router-dom';
import TrustSidebar from './TrustSidebar';
import SuperAdminSidebar from './SuperAdminSidebar';

export default function Sidebar(props) {
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  if (isSuperAdmin) {
    return <SuperAdminSidebar {...props} />;
  }

  return <TrustSidebar {...props} />;
}
