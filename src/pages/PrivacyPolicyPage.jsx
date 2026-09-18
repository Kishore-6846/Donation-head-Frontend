import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Home, ChevronRight, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>DATA PRIVACY &amp; PROTECTION</span>
          </div>
          <h1 className="mint-hero-title">Privacy Policy</h1>
          <p className="mint-hero-subtitle">
            How DonationReceipt.in collects, protects, stores, and handles your organizational and donor information.
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
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '12px' }}>
          This Privacy Policy describes how DonationReceipt.in (“Company”, “We”, “Us”, or “Our”) collects, uses, stores, processes, and protects information when you access or use our website, platform, and related services (“Service”).
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '24px' }}>
          By accessing or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.
        </p>

        {/* Section 1 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            1. Information We Collect
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            While using the Service, we may collect and process certain information including:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>organization details</li>
            <li>authorized user details</li>
            <li>donor-related records and receipt information</li>
            <li>email addresses</li>
            <li>phone numbers</li>
            <li>addresses</li>
            <li>uploaded documents and certificates</li>
            <li>usage and device information</li>
            <li>technical and diagnostic information</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            2. Usage Data and Technical Information
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            We may automatically collect technical information such as:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>IP address</li>
            <li>browser type and version</li>
            <li>device information</li>
            <li>operating system</li>
            <li>pages visited</li>
            <li>timestamps</li>
            <li>session activity</li>
            <li>referral sources</li>
            <li>diagnostic and analytics information</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            This information may be used for security, analytics, troubleshooting, service improvement, and operational purposes.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            3. Cookies and Tracking Technologies
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            The Service may use cookies, session identifiers, and similar technologies for:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>authentication</li>
            <li>session management</li>
            <li>user preferences</li>
            <li>security</li>
            <li>analytics</li>
            <li>improving user experience</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Users may disable cookies through browser settings, though certain features of the Service may not function properly.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            4. Use of Information
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            The Company may use collected information for purposes including:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>providing and maintaining the Service</li>
            <li>generating donation receipts and reports</li>
            <li>account management</li>
            <li>customer support</li>
            <li>service-related communication</li>
            <li>security and fraud prevention</li>
            <li>analytics and service improvement</li>
            <li>legal and compliance requirements</li>
            <li>operational administration</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0', fontWeight: '500' }}>
            The Company does not sell donor data or client data to third parties for marketing purposes.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            No donor data belonging to a registered client shall be intentionally shared with unrelated third parties without authorization except where required for providing the Service, legal compliance, or valid operational purposes.
          </p>
        </div>

        {/* Section 5 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            5. Communication
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            The Company may contact users through email, telephone, SMS, WhatsApp, or other electronic communication channels regarding:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>subscription renewals</li>
            <li>expiry reminders</li>
            <li>support matters</li>
            <li>policy updates</li>
            <li>service notifications</li>
            <li>operational communications</li>
            <li>security notifications</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Users may opt out of certain promotional communications where applicable.
          </p>
        </div>

        {/* Section 6 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            6. Third-Party Service Providers
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Company may utilize third-party service providers including hosting providers, communication gateways, analytics providers, payment processors, cloud infrastructure providers, and technical vendors for operating and supporting the Service.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Such providers may process limited information strictly as necessary for providing the Service.
          </p>
        </div>

        {/* Section 7 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            7. Data Retention and Account Expiry
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Company retains account information, donor records, uploaded documents, receipts, reports, and related data only for as long as reasonably necessary for providing the Service, maintaining system integrity, supporting legitimate business and operational purposes, complying with legal obligations, resolving disputes, and enforcing agreements.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            In the event of subscription expiry or non-renewal:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>the account may continue to remain accessible in a limited-access or read-only mode for up to 90 days from the expiry date,</li>
            <li>during this period, the registered organization may be provided an opportunity to renew the subscription and/or export available records and data,</li>
            <li>creation of new receipts and usage of certain platform features may be restricted during the applicable period.</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            If the subscription remains inactive beyond the applicable retention period:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>the Company may export and share available records or receipts with the registered email address associated with the account before deletion,</li>
            <li>the Company reserves the right to permanently remove or delete account data, donor information, uploaded documents, receipts, reports, and associated records from its active systems and related storage infrastructure without further liability.</li>
          </ul>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            Organizations are advised to maintain appropriate backups or exports of important records and documents.
          </p>
        </div>

        {/* Section 8 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            8. Data Security
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: '0 0 8px 0' }}>
            The Company takes commercially reasonable measures to protect information against unauthorized access, disclosure, misuse, or destruction.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            However, no method of internet transmission or electronic storage is completely secure, and the Company cannot guarantee absolute security.
          </p>
        </div>

        {/* Section 9 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            9. Disclosure of Information
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', marginBottom: '8px' }}>
            The Company may disclose information:
          </p>
          <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
            <li>where required by applicable law</li>
            <li>in response to legal requests or lawful authorities</li>
            <li>to protect rights, security, or property</li>
            <li>to investigate misuse or fraud</li>
            <li>during business restructuring, mergers, acquisitions, or transfers</li>
            <li>with user consent</li>
          </ul>
        </div>

        {/* Section 10 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            10. Third-Party Links
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Service may contain links to third-party websites or services. The Company is not responsible for the content, security, privacy practices, or policies of third-party platforms.
          </p>
        </div>

        {/* Section 11 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            11. Children’s Privacy
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Service is not intended for use by individuals under the age of 13. The Company does not knowingly collect personal information from children.
          </p>
        </div>

        {/* Section 12 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            12. Changes to This Privacy Policy
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', margin: 0 }}>
            The Company reserves the right to update or modify this Privacy Policy at any time. Updated versions shall become effective upon publication on the website. Continued use of the Service after such changes constitutes acceptance of the revised Privacy Policy.
          </p>
        </div>

        {/* Section 13: Contact */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 24px', marginTop: '30px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0' }}>
            13. Contact Us
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 10px 0' }}>
            For any questions or concerns regarding this Privacy Policy or data-related matters, you may contact us at:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
            <Mail size={16} color="#00a651" style={{ flexShrink: 0 }} />
            <a href="mailto:info@donationreceipt.in" style={{ color: '#00a651', textDecoration: 'none', fontWeight: '600' }}>
              info@donationreceipt.in
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
