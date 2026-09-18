import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, Award, ShieldCheck, List } from 'lucide-react';

export default function NewCertificatePage({ user }) {
  const navigate = useNavigate();

  const isDemoAdmin = !user?.email || user?.email === 'admin@donationreceipt.in';
  const storageKey = isDemoAdmin ? 'certificates_data' : `certificates_data_${user?.email}`;

  const [formData, setFormData] = useState({
    regNo: '',
    validFrom: '',
    validUpto: ''
  });

  const [page1File, setPage1File] = useState(null);
  const [page2File, setPage2File] = useState(null);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.regNo.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Input Required',
        message: 'Please enter 80G Registration No.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    const saved = localStorage.getItem(storageKey);
    let list = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (err) { }
    }

    const newCert = {
      id: Date.now(),
      regNo: formData.regNo.trim(),
      validFrom: formData.validFrom || '23-03-2026',
      validUpto: formData.validUpto || '22-03-2031',
      page1: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=60',
      page2: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=60'
    };

    list.unshift(newCert);
    localStorage.setItem(storageKey, JSON.stringify(list));

    setPopup({
      isOpen: true,
      type: 'success',
      title: 'Certificate Added!',
      message: '80G Certificate successfully added to your vault.',
      confirmText: 'OK',
      onConfirm: () => {
        setPopup(p => ({ ...p, isOpen: false }));
        navigate('/trust/all-certificate');
      }
    });
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>TAX EXEMPTION VAULT</span>
          </div>
          <h1 className="mint-hero-title">Add 80G Certificate</h1>
          <p className="mint-hero-subtitle">
            Register and upload official 80G tax exemption certificates to attach to donation receipts.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/all-certificate')}
            title="View All Certificates"
          >
            <List size={16} />
            <span>All Certificates</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        <form onSubmit={handleSubmit}>
          {/* Row 1: 3 Columns matching Screenshot 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '22px'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration No.:
              </label>
              <input
                type="text"
                name="regNo"
                placeholder="80G Registration No."
                value={formData.regNo}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '6px 12px',
                  fontSize: '13.5px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#495057'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration Valid From:
              </label>
              <input
                type="text"
                name="validFrom"
                placeholder="Select Date"
                value={formData.validFrom}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '6px 12px',
                  fontSize: '13.5px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#495057'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration Valid Upto:
              </label>
              <input
                type="text"
                name="validUpto"
                placeholder="Select Date"
                value={formData.validUpto}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '6px 12px',
                  fontSize: '13.5px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#495057'
                }}
              />
            </div>
          </div>

          {/* Row 2: 3 Columns grid so Column 2 aligns precisely with "Valid From" column above */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '36px'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                Upload 80G Certificate photo Page-1 (.jpg file, Max 2MB)
              </label>
              <div
                style={{
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  backgroundColor: '#ffffff'
                }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={(e) => setPage1File(e.target.files[0])}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    color: '#495057',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                Upload 80G Certificate photo Page-2 (.jpg file, Max 2MB)
              </label>
              <div
                style={{
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  backgroundColor: '#ffffff'
                }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={(e) => setPage2File(e.target.files[0])}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    color: '#495057',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Empty 3rd column for alignment */}
            <div></div>
          </div>

          {/* Centered Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '11px 48px',
                fontSize: '14.5px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Themed Popup instead of native browser alert */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText || 'OK'}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
