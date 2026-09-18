import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Sparkles, Home, ChevronRight, Mail } from 'lucide-react';

export default function CancellationRefundPolicyPage() {
  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>SUBSCRIPTION POLICY</span>
          </div>
          <h1 className="mint-hero-title">Cancellation &amp; Refund Policy</h1>
          <p className="mint-hero-subtitle">
            Information regarding subscriptions, billing cycles, renewals, and refunds for DonationReceipt.in.
          </p>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="mint-table-card-container" style={{ padding: '32px 36px', width: '100%', marginBottom: '30px', boxSizing: 'border-box' }}>

        {/* Introduction Note */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', color: '#166534', fontSize: '14px', lineHeight: '1.6' }}>
          Thank you for choosing donationreceipt.in. Please read this cancellation/refund policy carefully before subscribing to our services. By subscribing to our services, you agree to the terms and conditions outlined below.
        </div>

        {/* Policy Section 1: Subscription and Payment */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Subscription and Payment:
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Our subscription plans are billed annually. The subscription fee is payable in full at the time of subscribing to our services.
          </p>
        </div>

        {/* Policy Section 2: Cancellation */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Cancellation:
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            As our subscription plans are billed annually, cancellation requests can only be processed at the end of the subscription period. To cancel your subscription, please contact our support team at <a href="mailto:info@donationreceipt.in" style={{ color: '#00a651', textDecoration: 'none', fontWeight: '600' }}>info@donationreceipt.in</a> prior to the renewal date.
          </p>
        </div>

        {/* Policy Section 3: Refunds */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Refunds:
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            We do not offer refunds for cancellation or early termination of subscriptions. Once the subscription fee has been paid, it is non-refundable, even if you choose to cancel your subscription before the end of the subscription period.
          </p>
        </div>

        {/* Policy Section 4: Non-Usage */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Non-Usage:
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Failure to use our services does not entitle you to a refund or credit. We encourage you to take advantage of our free trial and utilize our platform during the trial period to ensure it meets your requirements.
          </p>
        </div>

        {/* Policy Section 5: Modifications */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Modifications to the Policy:
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            We reserve the right to modify this cancellation/refund policy at any time without prior notice. Any changes to the policy will be effective immediately upon posting on our website. By continuing to use our services, you accept and agree to the updated policy.
          </p>
        </div>

        {/* Precedence Note */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Please note that this cancellation/refund policy is subject to our terms and conditions. In case of any discrepancies or conflicts between this policy and our terms and conditions, the terms and conditions shall prevail.
          </p>
        </div>

        {/* Contact Support Box */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={20} color="#00a651" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
              Have questions regarding cancellations or billing?
            </div>
            <div style={{ fontSize: '13.5px', color: '#475569' }}>
              If you have any questions or concerns regarding our cancellation/refund policy, please contact our support team at{' '}
              <a href="mailto:info@donationreceipt.in" style={{ color: '#00a651', textDecoration: 'none', fontWeight: '600' }}>
                info@donationreceipt.in
              </a>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
