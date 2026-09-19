import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Shield, Loader2, ArrowUpDown, Sparkles, List } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

export default function DownloadBulkReceiptsPage({ user }) {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const trustSession = getTrustSession();
  const activeUser = (!isSuperUser(user) && user) || trustSession?.user || {};
  const effectiveEmail = (activeUser?.email || '').trim();
  const effectiveTrustName = (
    (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') ||
    (activeUser?.name && !isSuperUser(activeUser) ? activeUser.name : '') ||
    ''
  ).trim();

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  });

  // Sorting state
  const [sortField, setSortField] = useState('receiptNo');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let url = '/api/receipts?status=Active&limit=500';
      if (effectiveEmail) {
        url += `&trustEmail=${encodeURIComponent(effectiveEmail)}`;
      }
      if (effectiveTrustName) {
        url += `&trustName=${encodeURIComponent(effectiveTrustName)}`;
      }

      const headers = {};
      if (trustSession?.token) {
        headers['Authorization'] = `Bearer ${trustSession.token}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let list = data.data;
        if (effectiveEmail || (effectiveTrustName && effectiveTrustName.toLowerCase() !== 'trust organization')) {
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
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [effectiveEmail, effectiveTrustName, user]);

  // Filter receipts by search term
  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) => {
        return (
          (r.receiptNo && r.receiptNo.toLowerCase().includes(term)) ||
          (r.donorName && r.donorName.toLowerCase().includes(term)) ||
          (r.name && r.name.toLowerCase().includes(term)) ||
          (r.phone && r.phone.toLowerCase().includes(term)) ||
          (r.amount && String(r.amount).toLowerCase().includes(term)) ||
          (r.receiptDate && r.receiptDate.toLowerCase().includes(term)) ||
          (r.dateCreated && r.dateCreated.toLowerCase().includes(term))
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [receipts, searchTerm, sortField, sortOrder]);

  // Paginated records
  const totalEntries = filteredReceipts.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredReceipts.slice(startIndex, startIndex + entriesPerPage);

  // Check if all items on current page are selected (up to 50)
  const isAllSelectedOnPage = useMemo(() => {
    if (currentEntries.length === 0) return false;
    const pageRecordsToSelect = currentEntries.slice(0, 50);
    return pageRecordsToSelect.every((r) => selectedIds.has(r._id));
  }, [currentEntries, selectedIds]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 50) {
          setPopup({
            isOpen: true,
            type: 'error',
            title: 'Selection Limit',
            message: 'You can select a maximum of 50 records at a time.'
          });
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelectedOnPage) {
      // Unselect only the items on the current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentEntries.forEach((r) => next.delete(r._id));
        return next;
      });
    } else {
      // Select up to 50 records from current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const toAdd = currentEntries.slice(0, 50);
        toAdd.forEach((r) => {
          if (next.size < 50) {
            next.add(r._id);
          }
        });
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Selection Required',
        message: "Please select maximum 50 records from the same page and click 'Download' button at the bottom."
      });
      return;
    }

    if (selectedIds.size > 50) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Maximum Limit Exceeded',
        message: 'Maximum 50 records can be downloaded in bulk at a time.'
      });
      return;
    }

    setIsDownloading(true);
    setStatusMessage(`Preparing zip download for ${selectedIds.size} receipt(s)...`);

    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch('/api/receipts/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(trustSession?.token ? { 'Authorization': `Bearer ${trustSession.token}` } : {})
        },
        body: JSON.stringify({
          ids: idsArray,
          trustEmail: effectiveEmail,
          trustName: effectiveTrustName
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate bulk receipts download: ${res.statusText}`);
      }

      // Extract filename from Content-Disposition header if available
      let filename = `receipt_downloads_${Math.floor(Date.now() / 1000)}.zip`;
      const disposition = res.headers.get('content-disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setStatusMessage(`Successfully downloaded ${selectedIds.size} receipt certificate(s)!`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Error during bulk download:', err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Download Error',
        message: `Error downloading bulk receipts: ${err.message}`
      });
      setStatusMessage(null);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatAmount = (amt) => {
    const num = Number(amt);
    if (isNaN(num)) return `₹ ${amt}`;
    return num % 1 === 0 ? `₹ ${num}` : `₹ ${num.toFixed(2)}`;
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>BULK PDF ARCHIVE</span>
          </div>
          <h1 className="mint-hero-title">Download Donation Receipts</h1>
          <p className="mint-hero-subtitle">
            Export up to 50 donation receipts at once into a zipped archive of compliant 80G PDFs.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/donation-receipt')}
            title="View All Receipts"
          >
            <List size={16} />
            <span>All Receipts</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container" style={{ paddingBottom: '90px' }}>
        {/* Process Guide Block */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '20px'
          }}
        >
          <p
            style={{
              color: '#065f46',
              fontSize: '13.5px',
              fontWeight: 700,
              margin: '0 0 6px 0'
            }}
          >
            Follow the below process to Download the receipts PDF in bulk:
          </p>
          <div style={{ color: '#1e293b', fontSize: '13px', lineHeight: '1.6' }}>
            <div>Step 1: Select maximum 50 records from the same page.</div>
            <div>Step 2: Click 'Download' button at the bottom.</div>
            <div>Step 3: Zip file will be generated and downloaded to your device.</div>
          </div>
        </div>

        {/* Selection Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 500,
              userSelect: 'none',
              color: '#222'
            }}
          >
            <input
              type="checkbox"
              checked={isAllSelectedOnPage}
              onChange={handleToggleSelectAll}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#2b5876'
              }}
            />
            <span>Select All (Maximum 50 records)</span>
          </label>

          <button
            type="button"
            onClick={handleDeselectAll}
            style={{
              backgroundColor: '#d9534f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Deselect All
          </button>

          {selectedIds.size > 0 && (
            <span style={{ fontSize: '13px', color: '#666', marginLeft: '6px' }}>
              ({selectedIds.size} selected)
            </span>
          )}
        </div>

        {/* Entries & Search Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13.5px',
              color: '#333'
            }}
          >
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13.5px',
              color: '#333'
            }}
          >
            <label htmlFor="bulk-search-input">Search:</label>
            <input
              id="bulk-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '13px',
                outline: 'none',
                width: '170px'
              }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div
          style={{
            overflowX: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            marginBottom: '16px'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#ffffff',
                  color: '#333'
                }}
              >
                <th
                  onClick={() => handleSort('receiptNo')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    width: '60px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Select
                    <span style={{ fontSize: '10px', color: '#555' }}>▲</span>
                  </span>
                </th>

                <th
                  onClick={() => handleSort('receiptNo')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Receipt No.
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('donorName')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Name
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('phone')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Phone
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('amount')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Amount
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('receiptDate')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Receipt Date
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('dateCreated')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Date Created
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>

                <th
                  onClick={() => handleSort('createdBy')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Created By
                    <ArrowUpDown size={12} color="#aaa" />
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    <Loader2 size={24} className="spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                    Loading donation receipts...
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    No receipts found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentEntries.map((receipt, index) => {
                  const isSelected = selectedIds.has(receipt._id);
                  return (
                    <tr
                      key={receipt._id || index}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: isSelected ? '#f5f9eb' : index % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(receipt._id)}
                          style={{
                            width: '15px',
                            height: '15px',
                            cursor: 'pointer',
                            accentColor: '#2b5876'
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px 12px', color: '#222' }}>
                        {receipt.receiptNo}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#222', fontWeight: 500 }}>
                        {receipt.donorName || receipt.name}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#555' }}>
                        {receipt.phone || ''}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#222' }}>
                        {formatAmount(receipt.amount)}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#555' }}>
                        {receipt.receiptDate}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#555' }}>
                        {receipt.dateCreated || receipt.receiptDate}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#333' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Shield size={13} fill="#444" color="#444" />
                          {receipt.createdBy || 'Admin'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Entries Info and Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#666'
          }}
        >
          <div>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries.toLocaleString('en-IN')} entries
          </div>

          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 10px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                color: currentPage === 1 ? '#aaa' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                fontSize: '12.5px'
              }}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid #ddd',
                    backgroundColor: isActive ? '#e9ecef' : '#ffffff',
                    color: isActive ? '#000' : '#333',
                    fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer',
                    borderRadius: '3px',
                    fontSize: '12.5px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span style={{ padding: '0 4px', color: '#888' }}>...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid #ddd',
                    backgroundColor: currentPage === totalPages ? '#e9ecef' : '#ffffff',
                    color: currentPage === totalPages ? '#000' : '#333',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    fontSize: '12.5px'
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: '4px 10px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === totalPages || totalPages === 0 ? '#f5f5f5' : '#ffffff',
                color: currentPage === totalPages || totalPages === 0 ? '#aaa' : '#333',
                cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                fontSize: '12.5px'
              }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Download Button (Matching Screenshot 2) */}
        <div>
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isDownloading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 32px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isDownloading ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
              }
            }}
            onMouseOut={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
              }
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Downloading...</span>
              </>
            ) : (
              <span>Download</span>
            )}
          </button>

          {statusMessage && (
            <span style={{ marginLeft: '14px', fontSize: '13px', color: '#28a745', fontWeight: 500 }}>
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText="OK"
        onConfirm={() => setPopup(p => ({ ...p, isOpen: false }))}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
