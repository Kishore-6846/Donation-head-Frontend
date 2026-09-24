import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  ArrowLeft,
  Calendar,
  Building,
  DollarSign,
  Layers,
  Sparkles,
  Trash2,
  Edit2,
  Filter,
  RotateCcw,
  Tag
} from 'lucide-react';

export default function DynamicReportViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter and Submission State
  const [hasFiltered, setHasFiltered] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [filterValues, setFilterValues] = useState({
    fromDate: '',
    toDate: '',
    donationHead: 'All Heads',
    donationType: 'All Types',
    paymentMode: 'All Modes'
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null
  });

  const handleDeleteReport = () => {
    if (!report) return;
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Delete Report',
      message: `Are you sure you want to delete "${report.title || 'this report'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dynamic-reports/${report._id || id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Report Deleted',
              message: 'The report has been permanently deleted.',
              showCancel: false,
              onConfirm: () => {
                setPopup(p => ({ ...p, isOpen: false }));
                navigate(isSuperAdmin ? '/superadmin/reports-receipts' : '/trust/reports');
              }
            });
          } else {
            setPopup({
              isOpen: true,
              type: 'error',
              title: 'Delete Failed',
              message: data.message || 'Could not delete report.',
              showCancel: false,
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (err) {
          setPopup({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to connect to backend server: ' + err.message,
            showCancel: false,
            onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
          });
        }
      }
    });
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/dynamic-reports/${id}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setReport(d.data);
            if (d.data.columns && d.data.columns.length > 0) {
              setSortField(d.data.columns[0].key);
            }
            if (d.data.filters) {
              setFilterValues(prev => ({
                ...prev,
                fromDate: d.data.fromDate || '',
                toDate: d.data.toDate || '',
                donationHead: d.data.filters.donationHead || 'All Heads',
                donationType: d.data.filters.donationType || 'All Types',
                paymentMode: d.data.filters.paymentMode || 'All Modes'
              }));
            }
          }
        })
        .catch(err => console.error('Error fetching report:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const enabledFilters = useMemo(() => {
    return report?.enabledFilters || {
      dateRange: true,
      donationHead: true,
      donationType: true,
      paymentMode: true,
      search: true
    };
  }, [report]);

  const uniqueHeads = useMemo(() => {
    if (!report?.dataRows) return [];
    const set = new Set(report.dataRows.map(r => r.donationHead || r.head).filter(Boolean));
    return Array.from(set);
  }, [report]);

  const uniqueTypes = useMemo(() => {
    if (!report?.dataRows) return [];
    const set = new Set(report.dataRows.map(r => r.donationType || r.type).filter(Boolean));
    return Array.from(set);
  }, [report]);

  const uniqueModes = useMemo(() => {
    if (!report?.dataRows) return [];
    const set = new Set(report.dataRows.map(r => r.paymentMode).filter(Boolean));
    return Array.from(set);
  }, [report]);

  const handleFilterChange = (field, val) => {
    setFilterValues(prev => ({ ...prev, [field]: val }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterValues });
    setHasFiltered(true);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValues({
      fromDate: '',
      toDate: '',
      donationHead: 'All Heads',
      donationType: 'All Types',
      paymentMode: 'All Modes'
    });
    setSearchTerm('');
    setAppliedFilters(null);
    setHasFiltered(false);
    setCurrentPage(1);
  };

  const handlePrint = () => {
    if (!hasFiltered) {
      setPopup({
        isOpen: true,
        type: 'info',
        title: 'Filter Report First',
        message: 'Please click the "Filter Report" button to display and generate report records before printing.',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    if (!hasFiltered) {
      setPopup({
        isOpen: true,
        type: 'info',
        title: 'Filter Report First',
        message: 'Please click the "Filter Report" button to display and generate report records before exporting.',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }
    const cols = report.columns || [];
    const rows = filteredAndSortedRows;

    const headers = ['"S.No"', ...cols.map(c => `"${c.label}"`)];
    const csvLines = [headers.join(',')];

    rows.forEach((r, idx) => {
      const line = [
        idx + 1,
        ...cols.map(c => {
          const val = r[c.key] !== undefined ? r[c.key] : '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
      ];
      csvLines.push(line.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvLines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(report.title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort rows based on active enabled filters and submission
  const filteredAndSortedRows = useMemo(() => {
    if (!hasFiltered || !report || !Array.isArray(report.dataRows)) return [];

    let filtered = report.dataRows;
    const activeFilters = appliedFilters || filterValues;

    // Search filter
    if (enabledFilters.search !== false && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        return (report.columns || []).some(col => {
          const val = row[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      });
    }

    // Date Range Filter
    if (enabledFilters.dateRange) {
      if (activeFilters.fromDate) {
        filtered = filtered.filter(r => {
          const d = r.receiptDate || r.date;
          return d && d >= activeFilters.fromDate;
        });
      }
      if (activeFilters.toDate) {
        filtered = filtered.filter(r => {
          const d = r.receiptDate || r.date;
          return d && d <= activeFilters.toDate;
        });
      }
    }

    // Donation Head Filter
    if (enabledFilters.donationHead && activeFilters.donationHead && activeFilters.donationHead !== 'All Heads') {
      filtered = filtered.filter(r => (r.donationHead || r.head) === activeFilters.donationHead);
    }

    // Donation Type Filter
    if (enabledFilters.donationType && activeFilters.donationType && activeFilters.donationType !== 'All Types') {
      filtered = filtered.filter(r => (r.donationType || r.type) === activeFilters.donationType);
    }

    // Payment Mode Filter
    if (enabledFilters.paymentMode && activeFilters.paymentMode && activeFilters.paymentMode !== 'All Modes') {
      filtered = filtered.filter(r => r.paymentMode === activeFilters.paymentMode);
    }

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let valA = a[sortField] ?? '';
        let valB = b[sortField] ?? '';

        const isNum = !isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '';
        if (isNum) {
          return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }

        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [hasFiltered, report, appliedFilters, filterValues, searchTerm, sortField, sortDirection, enabledFilters]);

  // Pagination calculations
  const totalEntries = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredAndSortedRows.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalVolume = useMemo(() => {
    if (!hasFiltered) return 0;
    return filteredAndSortedRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [hasFiltered, filteredAndSortedRows]);

  const totalRecordsAudited = hasFiltered ? filteredAndSortedRows.length : 0;
  const avgContribution = totalRecordsAudited > 0 ? (totalVolume / totalRecordsAudited) : 0;

  if (loading) {
    return (
      <div className="dashboard-container-modern">
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="dashboard-container-modern">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <h3>Report not found</h3>
          <p>The requested report may have been deleted or does not exist.</p>
          <button type="button" className="btn-trust-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-modern">
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        showCancel={popup.showCancel}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />

      <Breadcrumb
        items={[
          { label: 'Reports', link: isSuperAdmin ? '/superadmin/reports-receipts' : '/trust/reports' },
          { label: report.title }
        ]}
      />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <div className="mint-hero-badge">
              <Sparkles size={13} />
              <span>{report.category || 'OFFICIAL AUDIT REPORT'}</span>
            </div>
            {report.reportBaseLabel && (
              <div className="mint-hero-badge" style={{ backgroundColor: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)' }}>
                <span>Base: {report.reportBaseLabel}</span>
              </div>
            )}
            <div className="mint-hero-badge" style={{ backgroundColor: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <span>Target: {report.targetTrust || 'All Trusts'}</span>
            </div>
          </div>
          <h1 className="mint-hero-title">{report.title}</h1>
          <p className="mint-hero-subtitle">
            {report.description || `Official audit report for ${report.targetTrust || 'all registered trust accounts'} - Financial Year ${report.financialYear}.`}
          </p>
        </div>

        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-trust-secondary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button
            type="button"
            className="btn-trust-primary"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                type="button"
                className="btn-trust-secondary"
                onClick={() => navigate(`/superadmin/new-report?id=${report._id || id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
                title="Edit Report Template & Data"
              >
                <Edit2 size={15} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteReport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                title="Delete Report Permanently"
              >
                <Trash2 size={16} />
                <span>Delete Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3 Top Stat Cards */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><DollarSign size={22} /></div>
            <span className="stat-modern-val">₹{totalVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Inflow Volume</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Layers size={22} /></div>
            <span className="stat-modern-val">{totalRecordsAudited}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Records Audited</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Calendar size={22} /></div>
            <span className="stat-modern-val">₹{Math.round(avgContribution).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Average Contribution</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="mint-table-card-container">
        {/* Dynamic Filters Bar */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px 18px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
              <Filter size={16} color="#059669" />
              <span>Report Filter Controls</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#059669',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              title="Reset all filters to default"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            {/* Date Range: From Date */}
            {enabledFilters.dateRange && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  From Date
                </label>
                <input
                  type="date"
                  className="trust-form-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  value={filterValues.fromDate}
                  onChange={e => handleFilterChange('fromDate', e.target.value)}
                />
              </div>
            )}

            {/* Date Range: To Date */}
            {enabledFilters.dateRange && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  To Date
                </label>
                <input
                  type="date"
                  className="trust-form-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  value={filterValues.toDate}
                  onChange={e => handleFilterChange('toDate', e.target.value)}
                />
              </div>
            )}

            {/* Donation Head */}
            {enabledFilters.donationHead && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Donation Head / Seva
                </label>
                <select
                  className="trust-form-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  value={filterValues.donationHead}
                  onChange={e => handleFilterChange('donationHead', e.target.value)}
                >
                  <option value="All Heads">All Heads</option>
                  {uniqueHeads.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                  {!uniqueHeads.includes('General Donation') && <option value="General Donation">General Donation</option>}
                  {!uniqueHeads.includes('Annadhanam Scheme') && <option value="Annadhanam Scheme">Annadhanam Scheme</option>}
                  {!uniqueHeads.includes('Temple Renovation / Corpus') && <option value="Temple Renovation / Corpus">Temple Renovation / Corpus</option>}
                  {!uniqueHeads.includes('Special Archana & Puja') && <option value="Special Archana & Puja">Special Archana &amp; Puja</option>}
                </select>
              </div>
            )}

            {/* Donation Type */}
            {enabledFilters.donationType && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Donation Type
                </label>
                <select
                  className="trust-form-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  value={filterValues.donationType}
                  onChange={e => handleFilterChange('donationType', e.target.value)}
                >
                  <option value="All Types">All Types</option>
                  {uniqueTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  {!uniqueTypes.includes('Voluntary Donation') && <option value="Voluntary Donation">Voluntary Donation</option>}
                  {!uniqueTypes.includes('Corpus Fund') && <option value="Corpus Fund">Corpus Fund</option>}
                  {!uniqueTypes.includes('Earmarked Fund') && <option value="Earmarked Fund">Earmarked Fund</option>}
                </select>
              </div>
            )}

            {/* Payment Mode */}
            {enabledFilters.paymentMode && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Payment Mode
                </label>
                <select
                  className="trust-form-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  value={filterValues.paymentMode}
                  onChange={e => handleFilterChange('paymentMode', e.target.value)}
                >
                  <option value="All Modes">All Modes</option>
                  {uniqueModes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {!uniqueModes.includes('Wallet/UPI') && <option value="Wallet/UPI">Wallet / UPI</option>}
                  {!uniqueModes.includes('Cash') && <option value="Cash">Cash</option>}
                  {!uniqueModes.includes('Cheque/Draft') && <option value="Cheque/Draft">Cheque / Demand Draft</option>}
                  {!uniqueModes.includes('Electronic/Bank Transfer') && <option value="Electronic/Bank Transfer">Electronic / Bank Transfer</option>}
                </select>
              </div>
            )}
          </div>

          {/* Action Row with Filter Report Submit Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="btn-trust-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 22px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Filter size={15} />
              <span>Filter Report</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px'
              }}
              title="Reset all filters to default"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table Top Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          {enabledFilters.search !== false ? (
            <div className="trust-search-wrapper" style={{ minWidth: '280px', flex: '1 1 320px' }}>
              <Search className="trust-search-icon" size={17} />
              <input
                type="text"
                className="trust-form-input trust-search-input"
                placeholder={report?.name ? `Search within ${report.name} records...` : "Search across report records..."}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Show:</span>
            <select
              className="trust-form-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10 entries</option>
              <option value="25">25 entries</option>
              <option value="50">50 entries</option>
              <option value="100">100 entries</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="trust-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="trust-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>S.No</th>
                {(report.columns || []).map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.label}</span>
                      {sortField === col.key && (
                        <span style={{ fontSize: '11px', color: '#059669' }}>
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!hasFiltered ? (
                <tr>
                  <td colSpan={(report.columns?.length || 0) + 1} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <Filter size={38} color="#059669" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      Click "Filter Report" to View Data
                    </h3>
                    <p style={{ fontSize: '13.5px', maxWidth: '460px', margin: '0 auto 16px', color: '#64748b' }}>
                      Select your desired filter options above and click the <strong>Filter Report</strong> button to display the records.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="btn-trust-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 22px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        backgroundColor: '#059669',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Filter size={15} />
                      <span>Filter Report</span>
                    </button>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={(report.columns?.length || 0) + 1} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <FileSpreadsheet size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                      No matching records found
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Try adjusting your date range or filter criteria and click "Filter Report" again.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => (
                  <tr key={row.rowId || rIdx}>
                    <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>
                      {startIndex + rIdx + 1}
                    </td>
                    {(report.columns || []).map(col => (
                      <td
                        key={col.key}
                        style={{
                          fontWeight: col.key === 'amount' ? 600 : 400,
                          color: col.key === 'amount' ? '#047857' : '#0f172a',
                          textAlign: col.type === 'number' ? 'right' : 'left'
                        }}
                      >
                        {col.key === 'amount'
                          ? `₹${Number(row[col.key] || 0).toLocaleString('en-IN')}`
                          : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#64748b' }}>
          <div>
            Showing <strong>{totalEntries === 0 ? 0 : startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, totalEntries)}</strong> of <strong>{totalEntries}</strong> entries
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn-trust-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'btn-trust-primary' : 'btn-trust-secondary'}
                onClick={() => setCurrentPage(page)}
                style={{ padding: '6px 12px', fontSize: '12.5px', minWidth: '34px' }}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="btn-trust-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
