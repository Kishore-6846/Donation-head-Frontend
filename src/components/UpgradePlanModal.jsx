import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, RefreshCw, ShieldCheck, Users, TrendingUp, Heart, Phone, Headphones } from 'lucide-react';

const DEFAULT_PLANS = [
  {
    name: 'Basic Plan',
    sub: 'Entry-level for newly registered trusts',
    price: '1,200',
    features: [
      '1 Admin Account',
      '1 Staff User Account Included',
      'Unlimited Donation Receipts',
      'Instant PDF Receipt Generation',
      'Standard Email & WhatsApp Support'
    ]
  },
  {
    name: 'Standard Plan',
    sub: 'Ideal for growing NGOs & Trusts',
    price: '2,500',
    features: [
      '1 Admin Account',
      '2 Staff User Accounts Included',
      'Unlimited Donation Receipts',
      'WhatsApp Receipt Sharing',
      'Form No. 10BD Compliance Reports',
      '80G Tax Exemption Certificates'
    ]
  }
];

export default function UpgradePlanModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    fetch('/api/plans?status=Active')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          const mapped = d.data.map(p => ({
            name: p.name.includes('Plan') ? p.name : `${p.name} Plan`,
            sub: p.description || 'Flexible trust subscription plan',
            price: Number(p.price).toLocaleString('en-IN'),
            features: Array.isArray(p.features) && p.features.length > 0 ? p.features : [
              '1 Admin Account',
              p.staffUserLimit || 'Multi-User Access',
              p.receiptLimit || 'Unlimited Receipts',
              'Form No. 10BD Compliance Reports',
              'Standard Email & Chat Support'
            ]
          }));
          setPlans(mapped);
        }
      })
      .catch(e => console.error('Error fetching plans in modal:', e));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 3000,
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content-box"
        style={{
          maxWidth: '920px',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#333333',
            zIndex: 10,
            padding: '4px',
            lineHeight: 1
          }}
          title="Close"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div style={{ padding: '32px 28px 24px 28px' }}>
          {/* Header Title with green wings */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {/* Left Green Burst Wings */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="12" x2="6" y2="12" />
                <line x1="16" y1="6" x2="8" y2="9" />
                <line x1="16" y1="18" x2="8" y2="15" />
              </svg>
              <h2 style={{ fontSize: '25px', fontWeight: '800', color: '#1a1a1a', margin: 0, letterSpacing: '-0.3px' }}>
                Upgrade to a Plan That Grows With You
              </h2>
              {/* Right Green Burst Wings */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="8" y1="6" x2="16" y2="9" />
                <line x1="8" y1="18" x2="16" y2="15" />
              </svg>
            </div>
            <p style={{ fontSize: '13px', color: '#555555', marginTop: '6px', margin: '6px 0 0 0' }}>
              Choose the perfect plan for your NGO and unlock more power, users &amp; support.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(plans.length || 2, 4)}, 1fr)`,
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            {plans.map((p) => (
              <div
                key={p.name}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '16px 12px 20px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                {/* Plan Name in rich dark green */}
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#166534', textAlign: 'center', margin: '0 0 4px 0' }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', margin: '0 0 12px 0', minHeight: '28px' }}>
                  {p.sub}
                </p>

                {/* Completely Fulfilled Solid Green Color Price Box */}
                <div
                  style={{
                    backgroundColor: '#e7f7eb',
                    border: '1px solid #bfe6c7',
                    borderRadius: '8px',
                    padding: '12px 6px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827', lineHeight: 1.1 }}>
                    ₹{p.price}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px', fontWeight: '600' }}>
                    +18% GST / Year
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: '#2d3748', lineHeight: '1.35' }}>
                      <CheckCircle2 size={13} color="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Pro Rata Upgrade Strip */}
          <div
            onClick={() => {
              onClose();
              navigate('/trust/upgrade-plan');
            }}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '8px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 4px rgba(22, 101, 52, 0.08)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dcfce7';
              e.currentTarget.style.borderColor = '#22c55e';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4';
              e.currentTarget.style.borderColor = '#86efac';
            }}
            title="Click to Upgrade Plan"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '2px solid #16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                  flexShrink: 0
                }}
              >
                <RefreshCw size={18} strokeWidth={2.5} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#166534', display: 'block' }}>
                  Existing Users Can Upgrade Anytime! &rarr;
                </strong>
                <span style={{ fontSize: '11.5px', color: '#4b5563' }}>
                  You will be charged on a pro rata basis for the remaining period of your current subscription. (Click to Upgrade)
                </span>
              </div>
            </div>

            <div
              style={{
                width: '34px',
                height: '42px',
                background: '#ffffff',
                border: '1.5px solid #16a34a',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                fontWeight: '800',
                fontSize: '16px',
                flexShrink: 0
              }}
            >
              ₹
            </div>
          </div>

          {/* 4 Trust Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '4px 0 16px 0',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="#166534" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '11px', color: '#111827', display: 'block' }}>Secure &amp; Reliable</strong>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>Your data is always safe</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Users size={26} color="#166534" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '11px', color: '#111827', display: 'block' }}>Manage Your Team</strong>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>Add &amp; manage staff users</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <TrendingUp size={26} color="#166534" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '11px', color: '#111827', display: 'block' }}>Better Collaboration</strong>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>Work together efficiently</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Heart size={26} color="#166534" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '11px', color: '#111827', display: 'block' }}>More Impact Together</strong>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>Focus on your mission</span>
              </div>
            </div>
          </div>

          {/* Bottom Dark Forest Green Banner */}
          <div
            style={{
              background: '#014c2b',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Headphones size={24} color="#a3e9b5" />
              <div>
                <strong style={{ fontSize: '13px', display: 'block', color: '#ffffff' }}>Need Help? We're Here for You!</strong>
                <span style={{ fontSize: '11px', color: '#c4e8ce' }}>Our team is happy to assist you in choosing the right plan.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#014c2b'
                }}
              >
                <Phone size={16} />
              </div>
              <div>
                <a
                  href="tel:+919082151500"
                  style={{ color: '#ffffff', fontWeight: '800', fontSize: '15px', textDecoration: 'none' }}
                >
                  +91 9082151500
                </a>
                <span style={{ display: 'block', fontSize: '9.5px', color: '#c4e8ce' }}>
                  (Mon - Sat | 10:00 AM - 6:00 PM)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
