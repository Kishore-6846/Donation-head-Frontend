import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Home, ChevronRight, Mail, MapPin } from 'lucide-react';

export default function TermsAndConditionsPage() {
  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>LEGAL AGREEMENT</span>
          </div>
          <h1 className="mint-hero-title">Terms &amp; Conditions</h1>
          <p className="mint-hero-subtitle">
            Rules, guidelines, and legal terms governing the use of DonationReceipt.in.
          </p>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="mint-table-card-container" style={{ padding: '32px 36px', width: '100%', marginBottom: '30px', boxSizing: 'border-box' }}>

        {/* Date note */}
        <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12.5px', fontWeight: '600', padding: '4px 12px', borderRadius: '4px', marginBottom: '18px' }}>
          Last updated: May 29, 2026
        </div>

        {/* Introduction */}
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>
          Welcome to DonationReceipt.in. By accessing or using our website, platform, or services, you agree to comply with and be bound by the following Terms and Conditions. If you do not agree with any part of these Terms, please do not use the Service.
        </p>

        {/* Section 1 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            These Terms and Conditions constitute a legally binding agreement between you and DonationReceipt.in, a product owned and operated by Solution Planets ("Company", "We", "Us", or "Our").
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            By accessing, registering, subscribing to, or using the Service, you acknowledge that you have read, understood, and agreed to be bound by these Terms and all applicable laws and regulations.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            2. Description of Service
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            DonationReceipt.in provides an online platform for NGOs, trusts, charitable organizations, and similar entities to generate, manage, maintain, send, and export donation receipts, donor records, reports, and related compliance documentation.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Company reserves the right to modify, suspend, discontinue, or enhance any part of the Service at any time without prior notice.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            3. Eligibility and User Responsibility
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            By using the Service, you represent that:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>you are authorized to act on behalf of the organization using the platform</li>
            <li>all information provided is accurate and lawful</li>
            <li>donor information uploaded or processed through the platform is collected and used lawfully</li>
            <li>you shall use the Service only for lawful and legitimate purposes</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            You are solely responsible for maintaining the confidentiality of login credentials and for all activities occurring under your account.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            4. Subscription and Access
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            Access to certain features of the Service may require payment of subscription fees.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            Subscription access is valid only for the subscribed duration and subject to successful payment.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Company reserves the right to modify pricing, plans, features, or subscription structures at its discretion.
          </p>
        </div>

        {/* Section 5 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            5. Subscription Expiry, Read-Only Access, and Data Retention
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            In the event of subscription expiry or non-renewal:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>the account may continue to remain accessible in a limited-access or read-only mode for up to 90 days from the expiry date</li>
            <li>during this period, creation of new donation receipts and usage of certain platform features may be restricted or disabled</li>
            <li>the registered organization may continue to view and export available records and data during the applicable read-only period</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 10px 0' }}>
            If the subscription is renewed within the applicable period, normal access may be restored subject to system availability and applicable policies.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            If the subscription remains inactive beyond the applicable retention period:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>the Company may export and share available records or receipts with the registered email address associated with the account</li>
            <li>the Company reserves the right to permanently delete or remove the account, donor records, uploaded documents, receipts, reports, and associated data from its active systems and related storage infrastructure without further liability</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The registered organization is solely responsible for downloading, exporting, and maintaining necessary backups or copies of important records, donor data, receipts, reports, and documents before deletion or loss of access.
          </p>
        </div>

        {/* Section 6 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            6. Intellectual Property
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            All content, software, design elements, trademarks, logos, graphics, features, and materials available through the Service are the property of DonationReceipt.in or its licensors and are protected under applicable intellectual property laws.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            No part of the Service may be copied, reproduced, distributed, modified, reverse-engineered, or exploited without prior written permission.
          </p>
        </div>

        {/* Section 7 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            7. Privacy and Data Protection
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            Use of the Service is also governed by our Privacy Policy.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            By using the Service, you consent to the collection, processing, storage, and usage of information in accordance with the Privacy Policy.
          </p>
        </div>

        {/* Section 8 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            8. Third-Party Services
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Service may integrate with or contain links to third-party websites, APIs, platforms, communication providers, payment gateways, or services.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Company shall not be responsible for the availability, content, security, practices, or policies of any third-party services.
          </p>
        </div>

        {/* Section 9 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            9. Disclaimer of Warranties
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Service is provided on an “as is” and “as available” basis.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            While the Company strives to maintain reliability, accuracy, and availability, the Company does not guarantee that:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>the Service will always be uninterrupted or error-free</li>
            <li>generated documents will meet all legal or compliance requirements in every situation</li>
            <li>the platform will be free from technical issues, delays, or security vulnerabilities</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Use of the Service is at your own risk.
          </p>
        </div>

        {/* Section 10 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            10. Limitation of Liability
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            To the maximum extent permitted by applicable law, DonationReceipt.in and its affiliates, directors, employees, partners, or service providers shall not be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising out of or related to:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>use or inability to use the Service</li>
            <li>loss of data</li>
            <li>unauthorized access</li>
            <li>interruption of service</li>
            <li>deletion of records after retention periods</li>
            <li>errors or omissions in generated documents</li>
            <li>third-party actions or integrations</li>
          </ul>
        </div>

        {/* Section 11 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            11. Communication and Notifications
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Company may send operational, service-related, subscription, renewal, expiry, retention, support, security, policy, or compliance-related communications through email, SMS, WhatsApp, dashboard notifications, or other available communication channels.
          </p>
        </div>

        {/* Section 12 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            12. Modifications to Terms
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Company reserves the right to modify or update these Terms at any time.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Updated Terms shall become effective upon publication on the website. Continued use of the Service after such updates constitutes acceptance of the revised Terms.
          </p>
        </div>

        {/* Section 13 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            13. Governing Law and Jurisdiction
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of India.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Any disputes arising out of or relating to the Service or these Terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra.
          </p>
        </div>

        {/* Section 14: Contact */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 24px', marginTop: '30px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>
            14. Contact Us
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 8px 0' }}>
            For any questions, concerns, or support requests regarding these Terms, you may contact us at:
          </p>
          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '6px' }}>
            Solution Planets
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#475569', marginBottom: '6px' }}>
            <MapPin size={16} color="#00a651" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>6, Naresh Smruti, S. L. Road, Vithal Nagar, Mulund West, Mumbai 400080, India</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
            <Mail size={16} color="#00a651" style={{ flexShrink: 0 }} />
            <a href="mailto:info@solutionplanets.com" style={{ color: '#00a651', textDecoration: 'none', fontWeight: '600' }}>
              info@solutionplanets.com
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
