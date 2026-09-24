import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import ShareReceiptModal from '../components/ShareReceiptModal';
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
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';
import { checkIsPlanExpired } from '../utils/planUtils';

export default function DonationReceiptsPage({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' or 'Inactive'
  const [receipts, setReceipts] = useState([]);
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [headFilter, setHeadFilter] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [shareModal, setShareModal] = useState({
    isOpen: false,
    receipt: null,
    mode: 'whatsapp'
  });

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
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');
  const trustSession = getTrustSession();
  const activeUser = (!isSuperUser(user) && user) || (!isSuperAdmin ? trustSession?.user : null) || {};
  const isPlanExpired = !isSuperAdmin && checkIsPlanExpired(activeUser);
  const effectiveEmail = (activeUser?.email || '').trim();
  const effectiveTrustName = (
    (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') ||
    (activeUser?.name && !isSuperUser(activeUser) ? activeUser.name : '') ||
    ''
  ).trim();

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
        if (!isSuperAdmin && (effectiveEmail || (effectiveTrustName && effectiveTrustName.toLowerCase() !== 'trust organization'))) {
          const eLower = effectiveEmail.toLowerCase();
          const tLower = effectiveTrustName.toLowerCase();
          list = list.filter(r => {
            if (!r) return false;
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
      if (data.success && Array.isArray(data.data)) {
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
    const currentStatus = receipt.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const isMovingToInactive = currentStatus === 'Active';
    const targetId = receipt._id || receipt.id || receipt.receiptNo;

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
          const res = await fetch(`/api/receipts/${encodeURIComponent(targetId)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus, receiptNo: receipt.receiptNo })
          });
          if (!res.ok) {
            await fetch(`/api/receipts/${encodeURIComponent(targetId)}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: nextStatus, receiptNo: receipt.receiptNo })
            });
          }
          await fetchReceipts();
        } catch (e) {
          console.error('Error toggling receipt status:', e);
        }
        setPopup(p => ({ ...p, isOpen: false }));
      },
      onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  // Helper to fetch and download receipt PDF file to admin's device
  const downloadReceiptPdfFile = async (receipt) => {
    try {
      const basePdfUrl = receipt.receiptNo
        ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(receipt.receiptNo)}`
        : `/api/receipts/pdf?id=${encodeURIComponent(receipt._id)}`;
      const urlWithTrust = `${basePdfUrl}${effectiveEmail ? `&trustEmail=${encodeURIComponent(effectiveEmail)}` : ''}${effectiveTrustName ? `&trustName=${encodeURIComponent(effectiveTrustName)}` : ''}`;

      const res = await fetch(urlWithTrust);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const safeNo = (receipt.receiptNo || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Donation_Receipt_${safeNo}.pdf`;

      // Auto-trigger browser download so the PDF attachment is immediately available
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 5000);

      const pdfFile = new File([blob], filename, { type: 'application/pdf' });
      return { blob, file: pdfFile, filename };
    } catch (e) {
      console.warn('Could not auto-download PDF:', e);
      return null;
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.length > 0 ? filtered : receipts;
    if (dataToExport.length === 0) {
      setPopup({
        isOpen: true,
        type: 'warning',
        title: 'No Data to Export',
        message: 'There are no donation receipts matching your filters to export.'
      });
      return;
    }

    const headers = [
      'S.No',
      'Receipt No',
      'Donor Name',
      'Phone',
      'Donation Type',
      'Donation Head',
      'Amount (INR)',
      'Receipt Date',
      'Payment Type',
      'Date Created',
      'Created By'
    ];

    const rows = dataToExport.map((r, idx) => [
      idx + 1,
      `"${(r.receiptNo || '').replace(/"/g, '""')}"`,
      `"${(r.donorName || '').replace(/"/g, '""')}"`,
      `"${(r.phone || r.mobile || '').replace(/"/g, '""')}"`,
      `"${(r.type || 'Voluntary Donation').replace(/"/g, '""')}"`,
      `"${(r.donationHead || '').replace(/"/g, '""')}"`,
      Number(r.amount || 0).toFixed(2),
      `"${(r.receiptDate || '').replace(/"/g, '""')}"`,
      `"${(r.paymentMode || r.paymentMethod || r.paymentType || 'Online / UPI').replace(/"/g, '""')}"`,
      `"${(r.dateCreated || r.receiptDate || '').replace(/"/g, '""')}"`,
      `"${(r.createdBy || 'Admin').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTrust = (effectiveTrustName || 'Trust').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${safeTrust}_Donation_Receipts_${activeTab}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract dynamic donation heads from registered heads and existing receipts
  const dynamicHeadList = Array.from(
    new Set([
      ...heads.map(h => h.name || h.headName || h.title),
      ...receipts.map(r => r.donationHead)
    ].filter(Boolean))
  ).sort();

  // Filter receipts based on Search, Donation Head, and Payment Method
  const filtered = (receipts || []).filter(r => {
    if (!r) return false;
    const s = (searchTerm || '').toLowerCase();
    const phone = String(r.phone || r.mobile || '').toLowerCase();
    const email = String(r.email || '').toLowerCase();
    const rNo = String(r.receiptNo || '').toLowerCase();
    const dName = String(r.donorName || '').toLowerCase();
    const dHead = String(r.donationHead || '').toLowerCase();
    const pMode = String(r.paymentMode || r.paymentMethod || r.paymentType || '').toLowerCase();

    const matchesSearch =
      !s ||
      rNo.includes(s) ||
      dName.includes(s) ||
      phone.includes(s) ||
      email.includes(s) ||
      dHead.includes(s) ||
      pMode.includes(s);

    const matchesHead =
      headFilter === 'All' ||
      !headFilter ||
      dHead === headFilter.toLowerCase();

    const matchesPaymentMode =
      paymentModeFilter === 'All' ||
      !paymentModeFilter ||
      pMode === paymentModeFilter.toLowerCase() ||
      (paymentModeFilter.toLowerCase() === 'online / upi' && (pMode.includes('online') || pMode.includes('upi')));

    return matchesSearch && matchesHead && matchesPaymentMode;
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
            onClick={() => {
              if (isPlanExpired) {
                setPopup({
                  isOpen: true,
                  type: 'warning',
                  title: 'Subscription Plan Expired',
                  message: 'Your organization subscription plan has expired. Creating new donation receipts is paused until you renew. Please tap Upgrade to continue.',
                  confirmText: 'Upgrade Subscription',
                  onConfirm: () => {
                    setPopup(p => ({ ...p, isOpen: false }));
                    navigate('/trust/upgrade-plan');
                  }
                });
                return;
              }
              navigate('/trust/new-donation-receipt');
            }}
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

      {/* Tab Buttons (Active Receipt vs Inactive Receipt) & Right Side Export Excel Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="tabs-row" style={{ marginBottom: 0 }}>
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

        {/* Right Side Export to Excel Button */}
        <button
          type="button"
          className="report-btn-export"
          onClick={handleExportExcel}
          title="Export donation receipts to Excel CSV format"
        >
          <FileSpreadsheet size={16} />
          <span>Export to Excel</span>
        </button>
      </div>

      {/* Table Card Container */}
      <div className="mint-table-card-container">
        {/* Controls: Show Entries + Search + Donation Head Filter + Payment Method Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          {/* Show Entries Dropdown */}
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

          {/* Search and Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#475569' }}>
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
                  width: '180px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
              />
            </div>

            {/* Donation Head Dropdown Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#475569' }}>
              <label htmlFor="receipts-head-filter" style={{ fontWeight: '500' }}>Head:</label>
              <select
                id="receipts-head-filter"
                value={headFilter}
                onChange={(e) => {
                  setHeadFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="All">All Donation Heads</option>
                {dynamicHeadList.map((hName) => (
                  <option key={hName} value={hName}>
                    {hName}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Dropdown Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#475569' }}>
              <label htmlFor="receipts-payment-filter" style={{ fontWeight: '500' }}>Payment:</label>
              <select
                id="receipts-payment-filter"
                value={paymentModeFilter}
                onChange={(e) => {
                  setPaymentModeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '140px'
                }}
              >
                <option value="All">All Payment Modes</option>
                <option value="Online / UPI">Online / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="NEFT / RTGS">NEFT / RTGS</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table table-mint">
            <thead>
              <tr>
                <th style={{ width: '55px' }}>S.No</th>
                <th>Receipt No.</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Donation Head</th>
                <th>Amount</th>
                <th>Receipt Date</th>
                <th>Payment Type</th>
                <th>Date Created</th>
                <th>Action</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((rec, idx) => (
                <tr key={rec._id || idx}>
                  <td style={{ fontWeight: '500', color: '#475569' }}>
                    {startIndex + idx + 1}
                  </td>
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
                  <td style={{ fontWeight: '500', color: '#0f172a' }}>
                    {rec.paymentMode || rec.paymentMethod || rec.paymentType || 'Online / UPI'}
                  </td>
                  <td>{rec.dateCreated || rec.receiptDate}</td>
                  <td>
                    <div className="actions-cell">
                      {/* 1. Edit Button */}
                      <button
                        type="button"
                        className="action-btn action-btn-edit"
                        title="Edit Receipt"
                        onClick={() => navigate(`/trust/edit-donation-receipt?pr_id=Mjk1NjIw&rid=${rec._id}`, { state: { receipt: rec } })}
                        aria-label="Edit Receipt"
                      >
                        <Pencil size={12} />
                      </button>

                      {/* 2. View/Print Receipt PDF */}
                      <a
                        href={`${rec.receiptNo ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(rec.receiptNo)}` : `/api/receipts/pdf?id=${encodeURIComponent(rec._id)}`}${effectiveEmail ? `&trustEmail=${encodeURIComponent(effectiveEmail)}` : ''}${effectiveTrustName ? `&trustName=${encodeURIComponent(effectiveTrustName)}` : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn action-btn-view"
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
                        aria-label="View Receipt PDF"
                      >
                        <Eye size={12} />
                      </a>

                      {/* 3. Download Receipt PDF (Placed between View and Delete) */}
                      <button
                        type="button"
                        className="action-btn action-btn-download"
                        title="Download 80G Receipt PDF"
                        onClick={() => downloadReceiptPdfFile(rec)}
                        aria-label="Download Receipt PDF"
                      >
                        <Download size={12} />
                      </button>

                      {/* 4. Delete / Inactivate */}
                      <button
                        type="button"
                        className="action-btn action-btn-delete"
                        title={activeTab === 'Active' ? 'Move to Inactive' : 'Restore Receipt'}
                        onClick={() => handleToggleStatus(rec)}
                        aria-label={activeTab === 'Active' ? 'Move to Inactive' : 'Restore Receipt'}
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* 5. WhatsApp Button */}
                      <button
                        type="button"
                        className="action-btn action-btn-whatsapp"
                        title={rec.phone || rec.mobile ? `Share on WhatsApp with PDF (${rec.phone || rec.mobile})` : 'Share on WhatsApp with PDF'}
                        onClick={() => setShareModal({ isOpen: true, receipt: rec, mode: 'whatsapp' })}
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

                      {/* 6. Email Button */}
                      <button
                        type="button"
                        className="action-btn action-btn-email"
                        title={rec.email ? `Send Receipt by Email with PDF Attached (${rec.email})` : 'Send Receipt by Email with PDF Attached'}
                        onClick={() => setShareModal({ isOpen: true, receipt: rec, mode: 'email' })}
                        aria-label="Send Receipt by Email"
                      >
                        <Mail size={12} />
                      </button>
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
                  <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                    {loading ? 'Loading receipts...' : `No ${activeTab.toLowerCase()} receipts found`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
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

      {/* Share Receipt Modal (WhatsApp & Email with Attached PDF) */}
      <ShareReceiptModal
        isOpen={shareModal.isOpen}
        receipt={shareModal.receipt}
        initialMode={shareModal.mode}
        trustEmail={effectiveEmail}
        trustName={effectiveTrustName}
        onClose={() => setShareModal({ isOpen: false, receipt: null, mode: 'whatsapp' })}
      />

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
