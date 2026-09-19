import React from 'react';
import { useLocation } from 'react-router-dom';
import TrustTopHeader from './TrustTopHeader';
import SuperAdminTopHeader from './SuperAdminTopHeader';
import { isSuperAdminPath } from '../utils/authStorage';

export default function TopHeader(props) {
  const location = useLocation();
  const isSuperAdmin =
    location.pathname.toLowerCase().startsWith('/superadmin') ||
    location.pathname.toLowerCase().startsWith('/super-admin') ||
    isSuperAdminPath(location.pathname);

  if (isSuperAdmin) {
    return <SuperAdminTopHeader {...props} />;
  }

  return <TrustTopHeader {...props} />;
}
