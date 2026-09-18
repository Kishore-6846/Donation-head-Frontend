import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumb({ title }) {
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');
  const dashboardLink = isSuperAdmin ? '/superadmin' : '/trust';

  if (!title) return null;

  return (
    <div className="breadcrumb-wrapper">
      <Link to={dashboardLink} className="breadcrumb-link">Dashboard</Link>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-current">{title}</span>
    </div>
  );
}
