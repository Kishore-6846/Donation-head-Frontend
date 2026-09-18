import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const termsUrl = isSuperAdmin ? '/superadmin/terms-and-conditions' : '/trust/terms-and-conditions';
  const refundUrl = isSuperAdmin ? '/superadmin/cancellation-refund-policy' : '/trust/cancellation-refund-policy';
  const privacyUrl = isSuperAdmin ? '/superadmin/privacy-policy' : '/trust/privacy-policy';

  return (
    <footer className="app-modern-footer">
      <div className="footer-links-group">
        <Link
          to={termsUrl}
          className="footer-link-item"
        >
          Terms &amp; Conditions
        </Link>
        <span className="footer-separator">|</span>
        <Link
          to={refundUrl}
          className="footer-link-item"
        >
          Cancellation &amp; Refunds Policy
        </Link>
        <span className="footer-separator">|</span>
        <Link
          to={privacyUrl}
          className="footer-link-item"
        >
          Privacy Policy
        </Link>
      </div>

      <div className="footer-copyright-text">
        &copy; 2026 DonationReceipt.in. All Rights Reserved.
      </div>
    </footer>
  );
}
