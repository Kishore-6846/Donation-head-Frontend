import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { Sparkles, Users, Filter, RotateCcw, FileSpreadsheet, PlusCircle, Plus } from 'lucide-react';

export default function DonorReportPage({ user: propUser }) {
  const location = useLocation();
  const localUser = (() => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; }
  })();
  const currentUser = propUser || localUser;
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin') || currentUser?.role?.toLowerCase() === 'superadmin';
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [activeDateRange, setActiveDateRange] = useState({
    from: '',
    to: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Direct Entry State for adding donor records directly
  const [showAddDirect, setShowAddDirect] = useState(false);
  const [directForm, setDirectForm] = useState({
    name: '',
    phone: '',
    panNumber: '',
    aadhaarNumber: '',
    address: '',
    donationHead: 'General Donation',
    amount: '',
    paymentMode: 'Wallet/UPI'
  });
  const [addMessage, setAddMessage] = useState('');

  const fetchDonorReport = async (fromD, toD) => {
    setLoading(true);
    try {
      let url = `/api/reports/donor-report?`;
      if (fromD) url += `fromDate=${encodeURIComponent(fromD)}&`;
      if (toD) url += `toDate=${encodeURIComponent(toD)}&`;
      if (!isSuperAdmin && (currentUser?.email || currentUser?.trustName)) {
        url += `trustEmail=${encodeURIComponent(currentUser?.email || '')}&trustName=${encodeURIComponent(currentUser?.trustName || currentUser?.name || '')}&trustId=${encodeURIComponent(currentUser?._id || '')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllData(data.data);
      }
    } catch (err) {
      console.error('Error fetching donor report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setCurrentPage(1);
    setIsSubmitted(false);
    setAllData([]);
  };

  const handleAddDirect = async (e) => {
    e.preventDefault();
    if (!directForm.name || !directForm.amount) {
      alert('Donor Name and Contribution Amount are required.');
      return;
    }

    try {
      const payload = {
        donorName: directForm.name.trim(),
        phone: directForm.phone.trim(),
        panNo: directForm.panNumber.trim().toUpperCase(),
        aadhaarNo: directForm.aadhaarNumber.trim(),
        address: directForm.address.trim(),
        donationHead: directForm.donationHead || 'General',
        donationType: 'Voluntary Donation',
        paymentMode: directForm.paymentMode || 'Online / UPI',
        amount: parseFloat(directForm.amount) || 0,
        receiptDate: new Date().toISOString().split('T')[0],
        notes: 'Donor record added directly to Directory',
        createdBy: currentUser?.name || (isSuperAdmin ? 'Super Admin' : 'Admin'),
        trustEmail: currentUser?.email || '',
        trustName: currentUser?.trustName || currentUser?.name || '',
        trustId: currentUser?._id || ''
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      const saved = json.success ? json.data : null;

      const newEntry = {
        _id: saved?._id || ('dnr_' + Date.now()),
        name: directForm.name,
        phone: directForm.phone,
        panNumber: directForm.panNumber,
        aadhaarNumber: directForm.aadhaarNumber,
        address: directForm.address,
        donationHead: directForm.donationHead,
        donationType: 'Voluntary Donation',
        paymentMode: directForm.paymentMode,
        totalAmount: parseFloat(directForm.amount) || 0,
        receiptCount: 1,
        lastDonationDate: new Date().toLocaleDateString('en-GB'),
        createdBy: currentUser?.name || (isSuperAdmin ? 'Super Admin' : 'Admin'),
        trustEmail: currentUser?.email || '',
        trustName: currentUser?.trustName || currentUser?.name || '',
        trustId: currentUser?._id || ''
      };

      setAllData(prev => [newEntry, ...prev]);
      setIsSubmitted(true);
      setAddMessage(`Successfully added ${directForm.name} (Total ₹${directForm.amount}) to Donor Directory! Auto-synced to Admin Panel.`);
      setTimeout(() => setAddMessage(''), 6000);
      setDirectForm({
        name: '',
        phone: '',
        panNumber: '',
        aadhaarNumber: '',
        address: '',
        donationHead: 'General Donation',
        amount: '',
        paymentMode: 'Wallet/UPI'
      });

      // Refetch live report from backend
      fetchDonorReport(fromDate, toDate);
    } catch (err) {
      console.error('Error saving directly to receipts API:', err);
      alert('Failed to save to server: ' + err.message);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);
    setActiveDateRange({ from: fromDate, to: toDate });
    setCurrentPage(1);
    fetchDonorReport(fromDate, toDate);
  };

  // Filter and Sort
  const filteredAndSortedData = useMemo(() => {
    if (!isSubmitted) return [];

    let filtered = allData;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allData.filter(item =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.phone && item.phone.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.address && item.address.toLowerCase().includes(term)) ||
        (item.panNumber && item.panNumber.toLowerCase().includes(term)) ||
        (item.aadhaarNumber && item.aadhaarNumber.toLowerCase().includes(term))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allData, isSubmitted, searchTerm, sortField, sortDirection]);

  // Pagination calculation
  const totalEntries = isSubmitted ? filteredAndSortedData.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(() => {
    if (!isSubmitted) return [];
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, isSubmitted, startIndex, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredAndSortedData.length > 0 ? filteredAndSortedData : allData;
    if (!isSubmitted || dataToExport.length === 0) {
      alert('No data available in table to export.');
      return;
    }

    const headers = [
      'Name',
      'Phone',
      'Email',
      'Address',
      'PAN Number',
      'Aadhaar Number'
    ];

    const rows = dataToExport.map((r) => [
      `"${r.name || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.email || ''}"`,
      `"${r.address || ''}"`,
      `"${r.panNumber || ''}"`,
      `"${r.aadhaarNumber || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Donor_Report_${activeDateRange.from || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate page numbers with ellipsis
  const renderPaginationButtons = () => {
    if (!isSubmitted || totalEntries === 0) {
      return null;
    }
    if (totalPages <= 1) {
      return (
        <span
          style={{
            border: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            color: '#333333',
            padding: '4px 10px',
            borderRadius: '2px',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          1
        </span>
      );
    }

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`ellipsis-${idx}`} style={{ padding: '4px 6px', color: '#6c757d', fontSize: '13px' }}>
            ...
          </span>
        );
      }
      const isActive = p === currentPage;
      return (
        <button
          key={p}
          type="button"
          onClick={() => setCurrentPage(p)}
          style={{
            border: isActive ? '1px solid #dee2e6' : 'none',
            backgroundColor: isActive ? '#f8f9fa' : 'transparent',
            color: isActive ? '#333333' : '#007bff',
            padding: '4px 10px',
            borderRadius: '2px',
            fontWeight: isActive ? '700' : '500',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {p}
        </button>
      );
    });
  };

  const thStyle = {
    padding: '10px 14px',
    fontWeight: '700',
    color: '#212529',
    fontSize: '13px',
    borderRight: '1px solid #dee2e6',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#eafaf1',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '12px 14px',
    borderRight: '1px solid #dee2e6',
    borderBottom: '1px solid #dee2e6',
    fontSize: '13.5px',
    color: '#212529',
    backgroundColor: '#ffffff',
    whiteSpace: 'nowrap'
  };

  const renderSortIndicator = (field) => {
    return (
      <span style={{ color: '#aaa', marginLeft: '6px', fontSize: '11px', display: 'inline-block' }}>
        {sortField === field ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>DONOR ANALYTICS</span>
          </div>
          <h1 className="mint-hero-title">Donor Report</h1>
          <p className="mint-hero-subtitle">
            Generate comprehensive donor contribution records and track lifetime donation statistics.
          </p>
        </div>
        {isSuperAdmin && (
          <div className="mint-hero-right">
            <button
              type="button"
              className="btn-trust-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
              onClick={() => setShowAddDirect(!showAddDirect)}
              title="Add new donor profile directly to this directory"
            >
              <PlusCircle size={18} strokeWidth={2.5} />
              <span>{showAddDirect ? 'Close Direct Form' : '+ Add Donor Directly'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mint-table-card-container">
        {/* Modern Filter Panel with Even Alignments and Styled Theme Buttons */}
        <div className="report-filter-panel">
          <div className="report-filter-header">
            <div className="report-filter-title">
              <Filter size={16} color="#059669" />
              <span>Filter Donor Report</span>
            </div>
            {isSubmitted && (
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Period: <strong>{activeDateRange.from}</strong> to <strong>{activeDateRange.to}</strong>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="report-filter-grid">
            <div className="report-field-group">
              <label htmlFor="donorFromDate" className="report-field-label">
                From Date
              </label>
              <input
                id="donorFromDate"
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="report-field-input"
              />
            </div>

            <div className="report-field-group">
              <label htmlFor="donorToDate" className="report-field-label">
                To Date
              </label>
              <input
                id="donorToDate"
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="report-field-input"
              />
            </div>

            <div className="report-filter-actions">
              <button type="submit" className="report-btn-submit" title="Generate donor directory report">
                <Filter size={15} />
                <span>Filter Report</span>
              </button>

              <button
                type="button"
                className="report-btn-secondary"
                onClick={handleReset}
                title="Reset date filters"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="report-btn-export"
                onClick={handleExportExcel}
                title="Export records to Excel CSV format"
              >
                <FileSpreadsheet size={15} />
                <span>Export to Excel</span>
              </button>
            </div>
          </form>
        </div>

        {/* Inline Direct Entry Panel */}
        {isSuperAdmin && showAddDirect && (
          <div className="report-direct-add-panel">
            <div className="report-direct-add-header">
              <div className="report-direct-add-title">
                <PlusCircle size={18} />
                <span>Add Donor Profile Directly to Directory</span>
              </div>
              <span style={{ fontSize: '12.5px', color: '#047857', fontWeight: 500 }}>
                Directly registers a donor contribution profile into this report
              </span>
            </div>

            <form onSubmit={handleAddDirect}>
              <div className="report-direct-add-grid">
                <div className="report-field-group">
                  <label className="report-field-label">Donor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muruganathan P"
                    className="report-field-input"
                    value={directForm.name}
                    onChange={e => setDirectForm({ ...directForm, name: e.target.value })}
                  />
                </div>

                <div className="report-field-group">
                  <label className="report-field-label">Contribution Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10000"
                    className="report-field-input"
                    value={directForm.amount}
                    onChange={e => setDirectForm({ ...directForm, amount: e.target.value })}
                  />
                </div>

                <div className="report-field-group">
                  <label className="report-field-label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9840123456"
                    className="report-field-input"
                    value={directForm.phone}
                    onChange={e => setDirectForm({ ...directForm, phone: e.target.value })}
                  />
                </div>

                <div className="report-field-group">
                  <label className="report-field-label">Donation Head</label>
                  <select
                    className="report-field-select"
                    value={directForm.donationHead}
                    onChange={e => setDirectForm({ ...directForm, donationHead: e.target.value })}
                  >
                    <option value="General Donation">General Donation</option>
                    <option value="Annadhanam Scheme">Annadhanam Scheme</option>
                    <option value="Food Drive">Food Drive</option>
                    <option value="365 Drive">365 Drive</option>
                    <option value="Temple Corpus">Temple Corpus</option>
                  </select>
                </div>

                <div className="report-field-group">
                  <label className="report-field-label">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    className="report-field-input"
                    style={{ textTransform: 'uppercase' }}
                    value={directForm.panNumber}
                    onChange={e => setDirectForm({ ...directForm, panNumber: e.target.value })}
                  />
                </div>

                <div className="report-field-group">
                  <label className="report-field-label">Aadhaar Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    className="report-field-input"
                    value={directForm.aadhaarNumber}
                    onChange={e => setDirectForm({ ...directForm, aadhaarNumber: e.target.value })}
                  />
                </div>

                <div className="report-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="report-field-label">Donor Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 21, North Car Street, Chidambaram, Tamil Nadu"
                    className="report-field-input"
                    value={directForm.address}
                    onChange={e => setDirectForm({ ...directForm, address: e.target.value })}
                  />
                </div>

                <div className="report-filter-actions" style={{ marginTop: '6px' }}>
                  <button type="submit" className="report-btn-submit">
                    <Plus size={15} />
                    <span>Save to Donor Directory</span>
                  </button>
                  <button
                    type="button"
                    className="report-btn-secondary"
                    onClick={() => setShowAddDirect(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {addMessage && (
          <div style={{ padding: '12px 18px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '16px', fontSize: '13.5px', fontWeight: 600 }}>
            ✓ {addMessage}
          </div>
        )}

        {/* Dynamic Report Subtitle matching Screenshot 4 & 5 */}
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#212529', marginBottom: '14px' }}>
          {!isSubmitted
            ? 'Reports: -'
            : `Reports:${activeDateRange.from} - ${activeDateRange.to}`}
        </div>

        {/* DataTables Controls: Show entries & Search */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#212529' }}>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#212529' }}>
            <label htmlFor="donorSearchInput">Search:</label>
            <input
              id="donorSearchInput"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>
        </div>

        {/* Main Table with Horizontal Scroll */}
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            border: '1px solid #dee2e6',
            borderRight: 'none',
            borderBottom: 'none',
            backgroundColor: '#ffffff',
            marginBottom: '16px'
          }}
        >
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '220px' }} onClick={() => handleSort('name')}>
                  Name {renderSortIndicator('name')}
                </th>
                <th style={{ ...thStyle, width: '140px' }} onClick={() => handleSort('phone')}>
                  Phone {renderSortIndicator('phone')}
                </th>
                <th style={{ ...thStyle, width: '180px' }} onClick={() => handleSort('email')}>
                  Email {renderSortIndicator('email')}
                </th>
                <th style={{ ...thStyle, width: '200px' }} onClick={() => handleSort('address')}>
                  Address {renderSortIndicator('address')}
                </th>
                <th style={{ ...thStyle, width: '140px' }} onClick={() => handleSort('panNumber')}>
                  PAN Number {renderSortIndicator('panNumber')}
                </th>
                <th style={{ ...thStyle, width: '150px' }} onClick={() => handleSort('aadhaarNumber')}>
                  Aadhaar Number {renderSortIndicator('aadhaarNumber')}
                </th>
              </tr>
            </thead>
            <tbody>
              {!isSubmitted ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      color: '#555555',
                      fontSize: '13.5px',
                      borderBottom: '1px solid #dee2e6',
                      borderRight: '1px solid #dee2e6'
                    }}
                  >
                    No data available in table
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#666666',
                      fontSize: '13.5px',
                      borderBottom: '1px solid #dee2e6',
                      borderRight: '1px solid #dee2e6'
                    }}
                  >
                    Loading report entries...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      color: '#555555',
                      fontSize: '13.5px',
                      borderBottom: '1px solid #dee2e6',
                      borderRight: '1px solid #dee2e6'
                    }}
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.name}</td>
                    <td style={tdStyle}>{row.phone || ''}</td>
                    <td style={tdStyle}>{row.email || ''}</td>
                    <td style={tdStyle}>{row.address || ''}</td>
                    <td style={tdStyle}>{row.panNumber || ''}</td>
                    <td style={tdStyle}>{row.aadhaarNumber || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination & Counter Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '18px'
          }}
        >
          <div style={{ fontSize: '13.5px', color: '#212529' }}>
            {!isSubmitted || totalEntries === 0
              ? 'Showing 0 to 0 of 0 entries'
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + pageSize, totalEntries)} of ${totalEntries} entries`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={!isSubmitted || currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: !isSubmitted || currentPage <= 1 ? '#6c757d' : '#007bff',
                cursor: !isSubmitted || currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                padding: '4px 8px',
                fontWeight: 500
              }}
            >
              Previous
            </button>

            {renderPaginationButtons()}

            <button
              type="button"
              disabled={!isSubmitted || currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: !isSubmitted || currentPage >= totalPages ? '#6c757d' : '#007bff',
                cursor: !isSubmitted || currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                padding: '4px 8px',
                fontWeight: 500
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
