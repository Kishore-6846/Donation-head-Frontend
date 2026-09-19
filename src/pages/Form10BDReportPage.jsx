import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { Sparkles, FileText, Filter, FileSpreadsheet, RotateCcw } from 'lucide-react';

export default function Form10BDReportPage({ user: propUser }) {
  const location = useLocation();
  const localUser = (() => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; }
  })();
  const currentUser = propUser || localUser;
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin') || currentUser?.role?.toLowerCase() === 'superadmin';
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [reportType, setReportType] = useState('Full Report');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTrust, setSelectedTrust] = useState('');
  const [trustsList, setTrustsList] = useState([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          const names = list
            .map(u => u.trustName || u.name)
            .filter(Boolean);
          const unique = Array.from(new Set(['Arulmigu Sivan Trust', ...names]));
          setTrustsList(unique);
        })
        .catch(err => console.error('Error fetching trusts:', err));
    }
  }, [isSuperAdmin]);

  const [activeReportInfo, setActiveReportInfo] = useState({
    financialYear: '2026-2027',
    reportType: 'Full Report',
    fromDate: '',
    toDate: '',
    trust: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('srNo');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchReportData = async (fy, rt, fDate = fromDate, tDate = toDate, trust = selectedTrust) => {
    setLoading(true);
    try {
      let url = `/api/reports/10bd?financialYear=${encodeURIComponent(fy || financialYear)}&reportType=${encodeURIComponent(rt || reportType)}`;
      if (fDate) url += `&fromDate=${encodeURIComponent(fDate)}`;
      if (tDate) url += `&toDate=${encodeURIComponent(tDate)}`;
      if (trust) {
        url += `&trustName=${encodeURIComponent(trust)}`;
      } else if (!isSuperAdmin && (currentUser?.email || currentUser?.trustName)) {
        url += `&trustEmail=${encodeURIComponent(currentUser?.email || '')}&trustName=${encodeURIComponent(currentUser?.trustName || currentUser?.name || '')}&trustId=${encodeURIComponent(currentUser?._id || '')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllData(data.data);
      }
    } catch (err) {
      console.error('Error fetching 10BD report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFinancialYear('2026-2027');
    setReportType('Full Report');
    setFromDate('');
    setToDate('');
    setSelectedTrust('');
    setSearchTerm('');
    setCurrentPage(1);
    setIsSubmitted(false);
    setAllData([]);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);
    setActiveReportInfo({ financialYear, reportType, fromDate, toDate, trust: selectedTrust });
    setCurrentPage(1);
    fetchReportData(financialYear, reportType, fromDate, toDate, selectedTrust);
  };

  // Filter and Sort Data
  const filteredAndSortedData = useMemo(() => {
    if (!isSubmitted) return [];

    let filtered = allData;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allData.filter(item =>
        (item.trustName && item.trustName.toLowerCase().includes(term)) ||
        (item.donorName && item.donorName.toLowerCase().includes(term)) ||
        (item.address && item.address.toLowerCase().includes(term)) ||
        (item.amount && item.amount.toString().includes(term)) ||
        (item.urn && item.urn.toLowerCase().includes(term)) ||
        (item.sectionCode && item.sectionCode.toLowerCase().includes(term)) ||
        (item.modeOfReceipt && item.modeOfReceipt.toLowerCase().includes(term)) ||
        (item.donationType && item.donationType.toLowerCase().includes(term))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (sortField === 'srNo' || sortField === 'amount') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

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
    if (dataToExport.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = [
      'Sr. No.',
      'User / Trust',
      'Pre Acknowledgement Number',
      'ID Code',
      'Unique Identification Number',
      'Section Code',
      'Unique Registration Number (URN)',
      'Date of Issuance of Unique Registration Number',
      'Name of donor',
      'Address of donor',
      'Donation Type',
      'Mode of receipt',
      'Amount of donation(Indian rupees)'
    ];

    const rows = dataToExport.map((r, idx) => [
      r.srNo || idx + 1,
      `"${(r.trustName || 'Arulmigu Sivan Trust').replace(/"/g, '""')}"`,
      `"${r.preAckNo || ''}"`,
      `"${r.idCode || ''}"`,
      `"${r.uniqueIdNo || ''}"`,
      `"${r.sectionCode || 'Section 80G'}"`,
      `"${r.urn || 'AAVCA0216A25CH02'}"`,
      `"${r.issuanceDate || '23-Mar-2026'}"`,
      `"${r.donorName || ''}"`,
      `"${r.address || ''}"`,
      `"${r.donationType || 'Others'}"`,
      `"${r.modeOfReceipt || 'Electronic modes including account payee cheque/draft'}"`,
      r.amount
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Form_10BD_Report_${activeReportInfo.financialYear}.csv`);
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
    const maxButtons = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
    backgroundColor: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative'
  };

  const tdStyle = {
    padding: '12px 14px',
    borderRight: '1px solid #dee2e6',
    borderBottom: '1px solid #dee2e6',
    fontSize: '13.5px',
    color: '#212529',
    backgroundColor: '#ffffff'
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
            <span>IT COMPLIANCE STATEMENT</span>
          </div>
          <h1 className="mint-hero-title">Form No. 10BD Report</h1>
          <p className="mint-hero-subtitle">
            Generate and export official Form 10BD statements for filing with the Income Tax Department.
          </p>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="mint-table-card-container">
        {/* Modern Filter Panel with Even Alignments and Styled Theme Buttons */}
        <div className="report-filter-panel">
          <div className="report-filter-header">
            <div className="report-filter-title">
              <Filter size={16} color="#059669" />
              <span>Form 10BD Statement Filter</span>
            </div>
            {isSubmitted && (
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Showing <strong>{activeReportInfo.reportType}</strong> for FY <strong>{activeReportInfo.financialYear}</strong>
                {activeReportInfo.trust ? ` | Trust: ${activeReportInfo.trust}` : ' | All Trusts'}
                {activeReportInfo.fromDate || activeReportInfo.toDate
                  ? ` | Period: ${activeReportInfo.fromDate || 'Start'} to ${activeReportInfo.toDate || 'End'}`
                  : ' | Period: All Dates'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="report-filter-grid">
            {isSuperAdmin && (
              <div className="report-field-group">
                <label htmlFor="trustSelect" className="report-field-label">
                  User / Trust
                </label>
                <select
                  id="trustSelect"
                  value={selectedTrust}
                  onChange={(e) => setSelectedTrust(e.target.value)}
                  className="report-field-select"
                >
                  <option value="">All Trusts / Users</option>
                  {trustsList.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="report-field-group">
              <label htmlFor="fySelect" className="report-field-label">
                Financial Year
              </label>
              <select
                id="fySelect"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="report-field-select"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
                <option value="2021-2022">2021-2022</option>
              </select>
            </div>

            <div className="report-field-group">
              <label htmlFor="rtSelect" className="report-field-label">
                Report Type
              </label>
              <select
                id="rtSelect"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="report-field-select"
              >
                <option value="Full Report">Full Report</option>
                <option value="Consolidated">Consolidated</option>
              </select>
            </div>

            <div className="report-field-group">
              <label htmlFor="10bdFromDate" className="report-field-label">
                From Date (Optional)
              </label>
              <input
                id="10bdFromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="report-field-input"
              />
            </div>

            <div className="report-field-group">
              <label htmlFor="10bdToDate" className="report-field-label">
                To Date (Optional)
              </label>
              <input
                id="10bdToDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="report-field-input"
              />
            </div>

            <div className="report-filter-actions">
              <button type="submit" className="report-btn-submit" title="Generate Form 10BD statement">
                <Filter size={15} />
                <span>Generate Statement</span>
              </button>

              <button
                type="button"
                className="report-btn-secondary"
                onClick={handleReset}
                title="Reset filters"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="report-btn-export"
                onClick={handleExportExcel}
                title="Export Form 10BD to Excel CSV format"
              >
                <FileSpreadsheet size={15} />
                <span>Export to Excel</span>
              </button>
            </div>
          </form>
        </div>

        {/* Note / Subheading (Shown after clicking Submit) */}
        {isSubmitted && (
          <div style={{ marginBottom: '18px' }}>
            <h2
              style={{
                fontSize: '14.5px',
                fontWeight: '700',
                color: '#212529',
                margin: '0 0 6px 0'
              }}
            >
              Report for F.Y- {activeReportInfo.financialYear.replace('-', ' - ')}
              {activeReportInfo.trust ? ` (${activeReportInfo.trust})` : ''}
              {activeReportInfo.fromDate || activeReportInfo.toDate
                ? ` [${activeReportInfo.fromDate || 'Start'} to ${activeReportInfo.toDate || 'End'}]`
                : ''}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#555555',
                margin: 0,
                lineHeight: '1.5'
              }}
            >
              {activeReportInfo.reportType === 'Full Report'
                ? 'Note: You have selected the "Full" report type. This report will display each receipt entry individually, without grouping, showing complete details of every donation made during the selected period.'
                : 'Note: You have selected the "Consolidated" report type. This report will display donations aggregated by donor, showing complete details of every donation made during the selected period.'}
            </p>
          </div>
        )}

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
            <label htmlFor="reportSearchInput">Search:</label>
            <input
              id="reportSearchInput"
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
          <table style={{ width: '100%', minWidth: '1780px', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '60px' }} onClick={() => handleSort('srNo')}>
                  Sr. No. {renderSortIndicator('srNo')}
                </th>
                <th style={{ ...thStyle, width: '180px' }} onClick={() => handleSort('trustName')}>
                  User / Trust {renderSortIndicator('trustName')}
                </th>
                <th style={{ ...thStyle, width: '180px' }} onClick={() => handleSort('preAckNo')}>
                  Pre Acknowledgement Number {renderSortIndicator('preAckNo')}
                </th>
                <th style={{ ...thStyle, width: '80px' }} onClick={() => handleSort('idCode')}>
                  ID Code {renderSortIndicator('idCode')}
                </th>
                <th style={{ ...thStyle, width: '170px' }} onClick={() => handleSort('uniqueIdNo')}>
                  Unique Identification Number {renderSortIndicator('uniqueIdNo')}
                </th>
                <th style={{ ...thStyle, width: '120px' }} onClick={() => handleSort('sectionCode')}>
                  Section Code {renderSortIndicator('sectionCode')}
                </th>
                <th style={{ ...thStyle, width: '190px' }} onClick={() => handleSort('urn')}>
                  Unique Registration Number (URN) {renderSortIndicator('urn')}
                </th>
                <th style={{ ...thStyle, width: '170px' }} onClick={() => handleSort('issuanceDate')}>
                  Date of Issuance of Unique Registration Number {renderSortIndicator('issuanceDate')}
                </th>
                <th style={{ ...thStyle, width: '180px' }} onClick={() => handleSort('donorName')}>
                  Name of donor {renderSortIndicator('donorName')}
                </th>
                <th style={{ ...thStyle, width: '160px' }} onClick={() => handleSort('address')}>
                  Address of donor {renderSortIndicator('address')}
                </th>
                <th style={{ ...thStyle, width: '120px' }} onClick={() => handleSort('donationType')}>
                  Donation Type {renderSortIndicator('donationType')}
                </th>
                <th style={{ ...thStyle, width: '240px' }} onClick={() => handleSort('modeOfReceipt')}>
                  Mode of receipt {renderSortIndicator('modeOfReceipt')}
                </th>
                <th style={{ ...thStyle, width: '180px' }} onClick={() => handleSort('amount')}>
                  Amount of donation(Indian rupees) {renderSortIndicator('amount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {!isSubmitted ? (
                <tr>
                  <td
                    colSpan={13}
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
                    colSpan={13}
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
                    colSpan={13}
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
                paginatedData.map((row) => (
                  <tr key={row.srNo}>
                    <td style={tdStyle}>{row.srNo}</td>
                    <td style={{ ...tdStyle, color: '#047857', fontWeight: 600 }}>{row.trustName || 'Arulmigu Sivan Trust'}</td>
                    <td style={tdStyle}>{row.preAckNo || ''}</td>
                    <td style={tdStyle}>{row.idCode || ''}</td>
                    <td style={tdStyle}>{row.uniqueIdNo || ''}</td>
                    <td style={tdStyle}>{row.sectionCode}</td>
                    <td style={tdStyle}>{row.urn}</td>
                    <td style={tdStyle}>{row.issuanceDate}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.donorName}</td>
                    <td style={tdStyle}>{row.address || ''}</td>
                    <td style={tdStyle}>{row.donationType}</td>
                    <td style={tdStyle}>{row.modeOfReceipt}</td>
                    <td style={tdStyle}>{row.amount}</td>
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
            {!isSubmitted
              ? 'Showing 0 to 0 of 0 entries'
              : totalEntries === 0
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
