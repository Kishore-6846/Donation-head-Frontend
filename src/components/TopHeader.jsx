import React from 'react';
import { useLocation } from 'react-router-dom';
import TrustTopHeader from './TrustTopHeader';
import SuperAdminTopHeader from './SuperAdminTopHeader';

export default function TopHeader(props) {
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  if (isSuperAdmin) {
    return <SuperAdminTopHeader {...props} />;
  }

  return <TrustTopHeader {...props} />;
}
