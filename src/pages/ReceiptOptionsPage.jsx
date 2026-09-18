import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Pencil } from 'lucide-react';

export default function ReceiptOptionsPage() {
  const navigate = useNavigate();
  const [letterStatus, setLetterStatus] = useState('NA');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('donor_appreciation_letter');
      if (saved) {
        setLetterStatus(saved);
      }
    } catch (e) {}
  }, []);

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>TEMPLATE PREFERENCES</span>
          </div>
          <h1 className="mint-hero-title">Receipt Settings</h1>
          <p className="mint-hero-subtitle">
            Configure donor appreciation letters, receipt headers, and layout customizations.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/edit-receipt-options?pr_id=-MzE5')}
          >
            <Pencil size={15} />
            <span>Edit Receipt Settings</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            fontSize: '14px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              flex: '1 1 75%',
              padding: '16px 20px',
              fontWeight: 500,
              color: '#0f172a'
            }}
          >
            Donor Appreciation Letter
          </div>
          <div
            style={{
              flex: '0 0 25%',
              padding: '16px 20px',
              borderLeft: '1px solid #e2e8f0',
              color: '#64748b',
              fontWeight: 600
            }}
          >
            {letterStatus}
          </div>
        </div>
      </div>
    </>
  );
}
