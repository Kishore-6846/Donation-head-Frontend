import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Plus,
  Download,
  Check,
  Trash2,
  Pencil,
  Eye,
  Mail,
  Shield,
  Send,
  Sparkles
} from 'lucide-react';

export default function DonationReceiptsPage({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' or 'Inactive'
  const [receipts, setReceipts] = useState([]);
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  });


  const location = useLocation();
  const localUser = (() => { try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; } })();
  const effectiveEmail = (user?.email || localUser?.email || '').trim();
  const effectiveTrustName = (user?.trustName || localUser?.trustName || (user?.name && !user.name.toLowerCase().includes('super') ? user.name : (localUser?.name && !localUser.name.toLowerCase().includes('super') ? localUser.name : '')) || '').trim();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let url = `/api/receipts?status=${activeTab}&search=${encodeURIComponent(searchTerm)}&limit=100`;
      if (isSuperAdmin) {
        url += '&isSuperAdmin=true';
      } else {
        if (effectiveEmail) url += `&trustEmail=${encodeURIComponent(effectiveEmail)}`;
        if (effectiveTrustName) url += `&trustName=${encodeURIComponent(effectiveTrustName)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let list = data.data;
        // Strict tenant isolation guard in Trust Admin panel:
        if (!isSuperAdmin) {
          const eLower = effectiveEmail.toLowerCase();
          const tLower = effectiveTrustName.toLowerCase();
          list = list.filter(r => {
            const rEmail = (r.trustEmail || '').toLowerCase();
            const rCreated = (r.createdBy || '').toLowerCase();
            const rTrust = (r.trustName || '').toLowerCase();
            const matchEmail = eLower && (rEmail === eLower || rCreated === eLower);
            const matchTrust = tLower && tLower !== 'trust organization' && (rTrust === tLower);
            return matchEmail || matchTrust;
          });
        }
        setReceipts(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeads = async () => {
    try {
      const res = await fetch('/api/donation-heads');
      const data = await res.json();
      if (data.success) {
        setHeads(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [activeTab, searchTerm, user]);

  useEffect(() => {
    fetchHeads();
  }, []);


  const handleToggleStatus = (receipt) => {
    const nextStatus = receipt.status === 'Active' ? 'Inactive' : 'Active';
    const isMovingToInactive = receipt.status === 'Active';

    setPopup({
      isOpen: true,
      type: 'confirm',
      title: isMovingToInactive ? 'Move to Inactive?' : 'Restore Receipt?',
      message: isMovingToInactive
        ? `Are you sure you want to move receipt "${receipt.receiptNo}" to Inactive Receipts?`
        : `Are you sure you want to restore receipt "${receipt.receiptNo}" to Active Receipts?`,
      confirmText: isMovingToInactive ? 'Move to Inactive' : 'Restore',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await fetch(`/api/receipts/${receipt._id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
          });
          fetchReceipts();
        } catch (e) {
          console.error(e);
        }
        setPopup(p => ({ ...p, isOpen: false }));
      },
      onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  const handleSendWhatsApp = (receipt) => {
    const rawPhone = (receipt.phone || receipt.mobile || '').toString().trim();
    if (!rawPhone) return;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const phone = digitsOnly.startsWith('91') && digitsOnly.length > 10 ? digitsOnly : `91${digitsOnly}`;
    const currentTrustName = user?.trustName || 'our Trust';
    const printUrl = receipt.receiptNo
      ? `${window.location.origin}/api/receipts/pdf?receiptNo=${encodeURIComponent(receipt.receiptNo)}`
      : `${window.location.origin}/api/receipts/pdf?id=${encodeURIComponent(receipt._id)}`;
    const text = encodeURIComponent(
      `Hello ${receipt.donorName},\n\nThank you for your generous donation of ₹${Number(receipt.amount).toFixed(2)} to ${currentTrustName} under head "${receipt.donationHead}".\n\nYour 80G Receipt Number: ${receipt.receiptNo}\nReceipt Date: ${receipt.receiptDate}\n\nYou can view and download your 80G Receipt PDF here:\n${printUrl}\n\nThank you for supporting our mission!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  const handleSendEmail = (receipt) => {
    const email = (receipt.email || '').trim();
    if (!email) return;
    const currentTrustName = user?.trustName || 'our Trust';
    const subject = encodeURIComponent(`Donation Receipt - ${receipt.receiptNo} | ${currentTrustName}`);
    const printUrl = receipt.receiptNo
      ? `${window.location.origin}/api/receipts/pdf?receiptNo=${encodeURIComponent(receipt.receiptNo)}`
      : `${window.location.origin}/api/receipts/pdf?id=${encodeURIComponent(receipt._id)}`;
    const body = encodeURIComponent(
      `Dear ${receipt.donorName},\n\nThank you for your generous donation of ₹${Number(receipt.amount).toFixed(2)} to ${currentTrustName} under head "${receipt.donationHead}".\n\nReceipt Details:\nReceipt Number: ${receipt.receiptNo}\nReceipt Date: ${receipt.receiptDate}\nDonation Head: ${receipt.donationHead}\nAmount: ₹${Number(receipt.amount).toFixed(2)}\n\nYou can view and download your 80G Donation Receipt PDF here:\n${printUrl}\n\nThank you for supporting our mission!\n\nWarm regards,\n${currentTrustName}`
    );
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  };

  const handleBulkDownload = () => {
    // Generate CSV export
    const headers = ['Receipt No', 'Donor Name', 'Phone', 'PAN', 'Type', 'Head', 'Amount', 'Date', 'Ref', 'Created By'];
    const rows = receipts.map(r => [
      `"${r.receiptNo}"`,
      `"${r.donorName}"`,
      `"${r.phone || ''}"`,
      `"${r.panNo || ''}"`,
      `"${r.type || ''}"`,
      `"${r.donationHead || ''}"`,
      `"${r.amount}"`,
      `"${r.receiptDate}"`,
      `"${r.reference || ''}"`,
      `"${r.createdBy || 'Admin'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Donation_Receipts_${activeTab}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const filtered = receipts.filter(r => {
    const s = searchTerm.toLowerCase();
    const phone = (r.phone || r.mobile || '').toLowerCase();
    const email = (r.email || '').toLowerCase();
    return (
      r.receiptNo.toLowerCase().includes(s) ||
      r.donorName.toLowerCase().includes(s) ||
      phone.includes(s) ||
      email.includes(s) ||
      (r.donationHead && r.donationHead.toLowerCase().includes(s))
    );
  });
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>80G TAX-EXEMPT RECEIPTS</span>
          </div>
          <h1 className="mint-hero-title">Manage Donation Receipts</h1>
          <p className="mint-hero-subtitle">
            Generate, view, and manage all trust donation receipts with instant 80G tax exemption.
          </p>
        </div>
        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/new-donation-receipt')}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New</span>
          </button>
          <button
            type="button"
            className="mint-btn-download"
            onClick={() => navigate('/trust/dl-receipts')}
          >
            <Download size={15} />
            <span>Download Bulk Receipts</span>
          </button>
        </div>
      </div>

      {/* Tab Buttons (Active Receipt vs Inactive Receipt) */}
      <div className="tabs-row" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`tab-button ${activeTab === 'Active' ? 'active-tab selected' : 'inactive-tab'}`}
          onClick={() => {
            setActiveTab('Active');
            setCurrentPage(1);
          }}
        >
          <Check size={16} /> Active Receipt
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'Inactive' ? 'active-tab selected' : 'inactive-tab'}`}
          onClick={() => {
            setActiveTab('Inactive');
            setCurrentPage(1);
          }}
        >
          <Trash2 size={16} /> Inactive Receipt
        </button>
      </div>

      {/* Table Card Container */}
      <div className="mint-table-card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '13.5px',
                backgroundColor: '#ffffff',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
            <label htmlFor="receipts-search" style={{ fontWeight: '500' }}>Search:</label>
            <input
              id="receipts-search"
              type="text"
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                width: '220px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table table-mint">
              <thead>
                <tr>
                  <th className="sortable">Receipt No. <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Name <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Phone <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Type <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Donation Head <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Amount <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Receipt Date <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Reference <span className="sort-icon">▲▼</span></th>
                  <th className="sortable">Date Created <span className="sort-icon">▲▼</span></th>
                  <th>Action</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((rec) => (
                  <tr key={rec._id}>
                    <td style={{ fontWeight: '600', color: '#212529' }}>
                      {rec.receiptNo}
                    </td>
                    <td style={{ fontWeight: '500' }}>{rec.donorName}</td>
                    <td>{rec.phone || rec.mobile || ''}</td>
                    <td>{rec.type || 'Voluntary Donation'}</td>
                    <td>{rec.donationHead}</td>
                    <td style={{ fontWeight: '600' }}>
                      ₹ {Number(rec.amount).toFixed(2)}
                    </td>
                    <td>{rec.receiptDate}</td>
                    <td>{rec.reference || ''}</td>
                    <td>{rec.dateCreated || rec.receiptDate}</td>
                    <td>
                      <div className="actions-cell">
                        {/* Edit Button */}
                        <button
                          className="action-btn"
                          title="Edit Receipt"
                          onClick={() => navigate(`/trust/edit-donation-receipt?pr_id=Mjk1NjIw&rid=${rec._id}`, { state: { receipt: rec } })}
                        >
                          <Pencil size={12} />
                        </button>

                        {/* View/Print Receipt PDF */}
                        <a
                          href={`${rec.receiptNo ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(rec.receiptNo)}` : `/api/receipts/pdf?id=${encodeURIComponent(rec._id)}`}${effectiveEmail ? `&trustEmail=${encodeURIComponent(effectiveEmail)}` : ''}${effectiveTrustName ? `&trustName=${encodeURIComponent(effectiveTrustName)}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn"
                          title="View & Print 80G Receipt PDF"
                          onClick={(e) => {
                            const url = `${rec.receiptNo
                              ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(rec.receiptNo)}`
                              : `/api/receipts/pdf?id=${encodeURIComponent(rec._id)}`}${effectiveEmail ? `&trustEmail=${encodeURIComponent(effectiveEmail)}` : ''}${effectiveTrustName ? `&trustName=${encodeURIComponent(effectiveTrustName)}` : ''}`;
                            const win = window.open(url, '_blank');
                            if (win) {
                              e.preventDefault();
                              win.focus();
                            }
                          }}
                        >
                          <Eye size={12} />
                        </a>

                        {/* Delete / Inactivate */}
                        <button
                          className="action-btn"
                          title={activeTab === 'Active' ? 'Move to Inactive' : 'Restore Receipt'}
                          onClick={() => handleToggleStatus(rec)}
                        >
                          <Trash2 size={12} />
                        </button>

                        {/* WhatsApp Button (Only shown if mobile/phone is provided) */}
                        {Boolean(rec.phone || rec.mobile) && (
                          <button
                            className="action-btn"
                            title={`Share on WhatsApp (${rec.phone || rec.mobile})`}
                            onClick={() => handleSendWhatsApp(rec)}
                            aria-label="Share on WhatsApp"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{ display: 'block' }}
                            >
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                          </button>
                        )}

                        {/* Email Button (Only shown if email is provided) */}
                        {Boolean(rec.email) && (
                          <button
                            className="action-btn"
                            title={`Send Receipt by Email (${rec.email})`}
                            onClick={() => handleSendEmail(rec)}
                            aria-label="Send Receipt by Email"
                          >
                            <Mail size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Shield size={12} color="#444" /> {rec.createdBy || 'Admin'}
                      </span>
                    </td>
                  </tr>
                ))}

                {currentEntries.length === 0 && (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                      {loading ? 'Loading receipts...' : `No ${activeTab.toLowerCase()} receipts found`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="table-pagination-row">
            <div>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
              {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Themed Confirmation & Notification Modal */}
        <SimplePopup
          isOpen={popup.isOpen}
          type={popup.type}
          title={popup.title}
          message={popup.message}
          confirmText={popup.confirmText}
          cancelText={popup.cancelText}
          onConfirm={popup.onConfirm}
          onCancel={popup.onCancel}
        />
      </>
    );
  }
