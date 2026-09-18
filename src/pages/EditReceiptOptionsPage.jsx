import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List } from 'lucide-react';

export default function EditReceiptOptionsPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'File Too Large',
          message: 'Please choose a file smaller than 2MB in size.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedFile) {
        localStorage.setItem('donor_appreciation_letter', selectedFile.name);
      }
    } catch (err) { }

    setPopup({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: 'Receipt options updated successfully.',
      onConfirm: () => {
        setPopup(p => ({ ...p, isOpen: false }));
        navigate('/trust/receipt-options');
      }
    });

    setTimeout(() => {
      navigate('/trust/receipt-options');
    }, 1200);
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>RECEIPT CUSTOMIZATION</span>
          </div>
          <h1 className="mint-hero-title">Edit Receipt Options</h1>
          <p className="mint-hero-subtitle">
            Upload custom donor appreciation letters and personalize donor communications.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/receipt-options')}
            title="View Receipt Settings"
          >
            <List size={16} />
            <span>Receipt Settings</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        <form onSubmit={handleSubmit}>
          {/* Card Container */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px 28px',
              minHeight: '140px',
              boxSizing: 'border-box'
            }}
          >
            <h2
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#212529',
                textDecoration: 'underline',
                margin: '0 0 16px 0'
              }}
            >
              Donor Appreciation Letter:
            </h2>

            <p
              style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#212529',
                margin: '0 0 12px 0'
              }}
            >
              Upload Donor Appreciation Letter Photo (.jpg format, Max 2MB size)
            </p>

            <div style={{ marginTop: '8px' }}>
              <input
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={handleFileChange}
                style={{
                  fontSize: '13.5px',
                  color: '#495057'
                }}
              />
            </div>
          </div>

          {/* Centered Submit Button matching Screenshot 2 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '28px'
            }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 48px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.38)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Themed Simple Popup */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText="OK"
        onConfirm={popup.onConfirm}
      />
    </>
  );
}
