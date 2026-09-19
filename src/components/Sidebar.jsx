import React from 'react';
import { useLocation } from 'react-router-dom';
import TrustSidebar from './TrustSidebar';
import SuperAdminSidebar from './SuperAdminSidebar';
import { isSuperAdminPath } from '../utils/authStorage';

export default function Sidebar(props) {
  const location = useLocation();
  const isSuperAdmin =
    location.pathname.toLowerCase().startsWith('/superadmin') ||
    location.pathname.toLowerCase().startsWith('/super-admin') ||
    isSuperAdminPath(location.pathname);

  if (isSuperAdmin) {
    return <SuperAdminSidebar {...props} />;
  }

  return <TrustSidebar {...props} />;
}
