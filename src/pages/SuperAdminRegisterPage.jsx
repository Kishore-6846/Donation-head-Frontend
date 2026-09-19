import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Super Admin registration has been deprecated as Super Admin is a single system owner.
 * Any incoming requests to register are automatically redirected to the Super Admin login page.
 */
export default function SuperAdminRegisterPage() {
  return <Navigate to="/superadmin/login" replace />;
}
