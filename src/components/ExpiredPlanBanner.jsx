import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Sparkles, CreditCard, Clock, ShieldAlert } from 'lucide-react';
import { isSuperUser } from '../utils/authStorage';
import { checkIsPlanExpired } from '../utils/planUtils';

export default function ExpiredPlanBanner({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Do not show on SuperAdmin routes or for SuperAdmin users
  const pathLower = location.pathname.toLowerCase();
  const isSuperRoute =
    pathLower.startsWith('/superadmin') ||
    pathLower.startsWith('/super-admin') ||
    isSuperUser(user);

  if (isSuperRoute) {
    return null;
  }

  // Check if current Trust Admin's plan is expired
  const isExpired = checkIsPlanExpired(user);
  if (!isExpired) {
    return null;
  }

  const isAlreadyOnUpgradePage = pathLower.includes('upgrade-plan') || pathLower.includes('upgrade');

  return (
    <div
      className="expired-plan-alert-banner"
      style={{
        width: '100%',
        backgroundColor: '#fff1f2',
        borderBottom: '1.5px solid #fecdd3',
        boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        animation: 'slideDownFade 0.3s ease-out'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Left Side: Warning Icon & Message */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#ffe4e6',
              border: '1.5px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(225, 29, 72, 0.15)'
            }}
          >
            <ShieldAlert size={22} className="animate-pulse" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#9f1239',
                  letterSpacing: '-0.2px'
                }}
              >
                Your Subscription Plan Has Expired!
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  letterSpacing: '0.4px'
                }}
              >
                <Clock size={11} />
                Action Required
              </span>
            </div>

            <p
              style={{
                margin: '3px 0 0 0',
                fontSize: '13px',
                color: '#881337',
                lineHeight: '1.4'
              }}
            >
              Your plan validity has ended. You cannot create new donation receipts until you renew. Tap the button to upgrade your subscription.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isAlreadyOnUpgradePage && (
            <button
              type="button"
              onClick={() => navigate('/trust/upgrade-plan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(225, 29, 72, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 14px rgba(225, 29, 72, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(225, 29, 72, 0.3)';
              }}
            >
              <Sparkles size={15} />
              <span>Upgrade Subscription</span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/trust/subscriptions')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #fca5a5',
              backgroundColor: '#ffffff',
              color: '#9f1239',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff1f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <CreditCard size={14} />
            <span>My Subscriptions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
