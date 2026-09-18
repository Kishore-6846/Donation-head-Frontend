import React from 'react';
import { Mail, Phone, Youtube, Sparkles, Headphones } from 'lucide-react';

export default function SupportPage() {
  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>HELP & ASSISTANCE</span>
          </div>
          <h1 className="mint-hero-title">Support & Help Desk</h1>
          <p className="mint-hero-subtitle">
            Need assistance with your receipts, certificates, or account? Our dedicated team is here to help.
          </p>
        </div>
      </div>

      <div className="mint-table-card-container">
        {/* Contact Details Table Box: Full width (100%), responsive on mobile */}
        <div className="support-table-box">
          {/* Row 1: Email */}
          <div className="support-row">
            <div className="support-left-cell">
              <Mail size={16} color="#212529" />
              <span>Email</span>
            </div>
            <div className="support-right-cell">
              <a
                href="mailto:support@donationreceipt.in"
                style={{ color: '#00a651', textDecoration: 'none', fontWeight: 600 }}
              >
                support@donationreceipt.in
              </a>
            </div>
          </div>

          {/* Row 2: Call/WhatsApp */}
          <div className="support-row">
            <div className="support-left-cell">
              <Phone size={16} color="#212529" />
              <span>Call/WhatsApp</span>
            </div>
            <div className="support-right-cell">
              <a
                href="https://api.whatsapp.com/send?phone=919082151500"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#00a651', textDecoration: 'none', fontWeight: 600 }}
              >
                +91-90821 51500
              </a>
            </div>
          </div>

          {/* Row 3: Video Tutorials */}
          <div className="support-row" style={{ borderBottom: 'none' }}>
            <div className="support-left-cell">
              <Youtube size={16} color="#212529" />
              <span>Video Tutorials</span>
            </div>
            <div className="support-right-cell">
              <a
                href="https://youtube.com/@DonationReceipt"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#00a651', textDecoration: 'none', fontWeight: 600 }}
              >
                https://youtube.com/@DonationReceipt
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
