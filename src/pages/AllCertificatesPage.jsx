import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';

export default function AllCertificatesPage({ user }) {
  const navigate = useNavigate();

  const isDemoAdmin = !user?.email || user?.email === 'admin@donationreceipt.in';
  const storageKey = isDemoAdmin ? 'certificates_data' : `certificates_data_${user?.email}`;

  const [certificates, setCertificates] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return isDemoAdmin ? [
      {
        id: 1,
        regNo: 'AAVCA0216A25CH02',
        validFrom: '23-03-2026',
        validUpto: '22-03-2031'
      }
    ] : [];
  });

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const emailParam = user?.email ? `?trustEmail=${encodeURIComponent(user.email)}` : '';
        const res = await fetch(`/api/certificates${emailParam}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCertificates(data.data);
          try {
            localStorage.setItem(storageKey, JSON.stringify(data.data));
          } catch (lsErr) {
            const lightweightList = data.data.map(c => ({
              ...c,
              page1: c.page1 ? 'uploaded_page1' : '',
              page2: c.page2 ? 'uploaded_page2' : ''
            }));
            try {
              localStorage.setItem(storageKey, JSON.stringify(lightweightList));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Error loading certificates from backend:', err);
      }
    };
    fetchCerts();
  }, [user?.email, storageKey]);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [previewCert, setPreviewCert] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  });

  const handleDelete = (targetId, regNo, certObj) => {
    const effectiveId = targetId || certObj?._id || certObj?.id;
    const effectiveRegNo = regNo || certObj?.regNo;

    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Certificate?',
      message: `Are you sure you want to delete certificate "${effectiveRegNo || 'Selected'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          if (effectiveId) {
            await fetch(`/api/certificates/${effectiveId}?regNo=${encodeURIComponent(effectiveRegNo || '')}`, { method: 'DELETE' });
          } else if (effectiveRegNo) {
            await fetch(`/api/certificates?regNo=${encodeURIComponent(effectiveRegNo)}`, { method: 'DELETE' });
          }
        } catch (e) {
          console.warn('API delete error:', e);
        }

        const updated = certificates.filter(c => {
          const cId = c._id || c.id;
          const matchId = effectiveId && (String(cId) === String(effectiveId) || String(c.id) === String(effectiveId) || String(c._id) === String(effectiveId));
          const matchReg = effectiveRegNo && String(c.regNo).toLowerCase() === String(effectiveRegNo).toLowerCase();
          return !matchId && !matchReg;
        });

        setCertificates(updated);

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (lsErr) {
          const lightweightList = updated.map(c => ({
            ...c,
            page1: c.page1 ? 'uploaded_page1' : '',
            page2: c.page2 ? 'uploaded_page2' : ''
          }));
          try {
            localStorage.setItem(storageKey, JSON.stringify(lightweightList));
          } catch (e) {}
        }

        setPopup(p => ({ ...p, isOpen: false }));
      },
      onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  const filtered = certificates.filter(c =>
    c.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalEntries = filtered.length;

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>TAX COMPLIANCE &amp; 80G VAULT</span>
          </div>
          <h1 className="mint-hero-title">80G Certificate Vault</h1>
          <p className="mint-hero-subtitle">
            Store, preview, and manage verified income tax department 80G approval certificates.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/new-certificate')}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="mint-table-card-container">
        {/* Datatable controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', fontSize: '13.5px', color: '#475569', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="cert-search-input" style={{ fontWeight: 500 }}>Search:</label>
            <input
              id="cert-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certificates..."
              style={{
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                width: '220px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        {/* Table matching Screenshot 1 */}
        <div className="table-responsive">
          <table className="custom-table table-mint" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', width: '40px', borderRight: '1px solid #eee' }}>#</th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', borderRight: '1px solid #eee' }}>
                  80G Registration No. <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', borderRight: '1px solid #eee' }}>
                  Valid from <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', borderRight: '1px solid #eee' }}>
                  Valid upto <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', borderRight: '1px solid #eee', width: '110px' }}>
                  Page 1 <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', borderRight: '1px solid #eee', width: '110px' }}>
                  Page 2 <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '700', color: '#212529', width: '110px' }}>
                  Actions <span style={{ color: '#aaa', fontSize: '10px' }}>&#x25B2;&#x25BC;</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert, index) => (
                <tr key={cert.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px 14px', color: '#333', borderRight: '1px solid #eee' }}>{index + 1}</td>
                  <td style={{ padding: '12px 14px', color: '#333', fontWeight: '500', borderRight: '1px solid #eee' }}>{cert.regNo}</td>
                  <td style={{ padding: '12px 14px', color: '#333', borderRight: '1px solid #eee' }}>{cert.validFrom}</td>
                  <td style={{ padding: '12px 14px', color: '#333', borderRight: '1px solid #eee' }}>{cert.validUpto}</td>
                  <td style={{ padding: '10px 14px', borderRight: '1px solid #eee' }}>
                    {/* Realistic Page 1 Document Thumbnail matching Screenshot 1 */}
                    <div
                      onClick={() => { setPreviewCert(cert); setPreviewPage(1); }}
                      style={{
                        width: '56px',
                        height: '74px',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        padding: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      title="Click to view Page 1"
                    >
                      {/* Top Emblem and Order header */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b91c1c' }} />
                        <div style={{ height: '2px', background: '#334155', width: '80%' }} />
                        <div style={{ height: '1.5px', background: '#64748b', width: '60%' }} />
                      </div>
                      {/* Form lines */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '1px 0' }}>
                        <div style={{ height: '2px', background: '#cbd5e1', width: '95%' }} />
                        <div style={{ height: '2px', background: '#94a3b8', width: '85%' }} />
                        <div style={{ height: '2px', background: '#cbd5e1', width: '90%' }} />
                        <div style={{ height: '2px', background: '#cbd5e1', width: '75%' }} />
                        <div style={{ height: '2px', background: '#cbd5e1', width: '88%' }} />
                      </div>
                      {/* Bottom tricolor border line */}
                      <div style={{ height: '2.5px', background: 'linear-gradient(to right, #ea580c, #ffffff, #16a34a)', width: '100%', borderRadius: '1px' }} />
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', borderRight: '1px solid #eee' }}>
                    {/* Realistic Page 2 Document Thumbnail */}
                    <div
                      onClick={() => { setPreviewCert(cert); setPreviewPage(2); }}
                      style={{
                        width: '56px',
                        height: '74px',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        padding: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      title="Click to view Page 2"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
                        <div style={{ height: '2px', background: '#334155', width: '60%', margin: '0 auto' }} />
                        <div style={{ height: '1.5px', background: '#cbd5e1', width: '90%' }} />
                        <div style={{ height: '1.5px', background: '#cbd5e1', width: '85%' }} />
                        <div style={{ height: '1.5px', background: '#cbd5e1', width: '92%' }} />
                      </div>
                      <div style={{ margin: 'auto', opacity: 0.18, fontSize: '9px', fontWeight: '800', textAlign: 'center' }}>
                        80G
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '14px', height: '6px', borderBottom: '1px solid #475569' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {/* Green Edit button */}
                      <button
                        onClick={() => navigate(`/trust/new-certificate?id=${encodeURIComponent(cert._id || cert.id || '')}&regNo=${encodeURIComponent(cert.regNo || '')}`, { state: { cert } })}
                        style={{
                          backgroundColor: '#ecfdf5',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#059669',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#ecfdf5';
                          e.currentTarget.style.color = '#059669';
                        }}
                        title="Edit Certificate"
                      >
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(cert._id || cert.id, cert.regNo, cert)}
                        style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#dc2626',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        title="Delete"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination row matching Screenshot 1 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '13px', color: '#555' }}>
          <div>
            Showing 1 to {totalEntries} of {totalEntries} entries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              disabled
              style={{
                border: 'none',
                background: 'none',
                color: '#6c757d',
                cursor: 'default',
                padding: '4px 10px',
                fontSize: '13px'
              }}
            >
              Previous
            </button>
            <button
              style={{
                border: '1px solid #dee2e6',
                background: '#ffffff',
                color: '#212529',
                padding: '4px 12px',
                borderRadius: '3px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              1
            </button>
            <button
              disabled
              style={{
                border: 'none',
                background: 'none',
                color: '#6c757d',
                cursor: 'default',
                padding: '4px 10px',
                fontSize: '13px'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Full Certificate Preview Modal */}
      {previewCert && (
        <div
          className="modal-overlay"
          style={{ zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.65)' }}
          onClick={() => setPreviewCert(null)}
        >
          <div
            className="modal-content-box"
            style={{ maxWidth: '640px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1b5e20' }}>
                80G Certificate Preview (Page {previewPage})
              </h3>
              <button
                onClick={() => setPreviewCert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ border: '2px solid #2e7d32', padding: '20px', background: '#fafdfa', borderRadius: '6px', textAlign: 'center' }}>
              {(previewPage === 1 ? previewCert.page1 : previewCert.page2) ? (
                <div>
                  <img
                    src={previewPage === 1 ? previewCert.page1 : previewCert.page2}
                    alt={`80G Certificate Page ${previewPage}`}
                    style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#555' }}>
                    <strong>Reg No:</strong> {previewCert.regNo} | <strong>Valid:</strong> {previewCert.validFrom || 'N/A'} to {previewCert.validUpto || 'N/A'}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #2e7d32', paddingBottom: '14px', marginBottom: '18px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#1b5e20', fontWeight: '800' }}>
                      GOVERNMENT OF INDIA &mdash; INCOME TAX DEPARTMENT
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
                      Order for approval under clause (iv) of first proviso to sub-section (5) of section 80G
                    </p>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#222', textAlign: 'left' }}>
                    <p><strong>Trust Name:</strong> {user?.trustName || 'Trust Organization'}</p>
                    <p><strong>Registration Number (URN):</strong> {previewCert.regNo}</p>
                    <p><strong>PAN:</strong> {user?.panNo || 'N/A'}</p>
                    <p><strong>Approval Valid From:</strong> {previewCert.validFrom || 'N/A'} <strong>To:</strong> {previewCert.validUpto || 'N/A'}</p>
                    <p style={{ marginTop: '14px', fontSize: '12px', color: '#555' }}>
                      This document serves as statutory verification that donations made to this trust are eligible for tax deduction under Section 80G of the Income Tax Act, 1961.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Themed Confirmation & Notification Modal */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText || 'OK'}
        cancelText={popup.cancelText || 'Cancel'}
        onConfirm={popup.onConfirm}
        onCancel={popup.onCancel}
      />
    </>
  );
}
