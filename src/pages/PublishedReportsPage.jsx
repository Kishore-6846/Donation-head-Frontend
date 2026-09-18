import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Filter,
  Calendar,
  Building,
  CheckCircle2,
  Table,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

// Built-in Standard Platform Reports Master List
const STANDARD_PLATFORM_REPORTS = [
  {
    _id: 'std_receipts_master',
    isStandard: true,
    title: 'Donation Receipts Master Report',
    code: 'REP-RCPT-MASTER',
    category: 'Financial Audit',
    reportBase: 'receipts',
    reportBaseLabel: 'Donation Receipts Register',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: 'Live DB',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/reports-receipts',
    trustViewLink: '/trust/reports/receipts',
    description: 'Master audit register of all individual donation receipts with serial nos, PAN, payment mode and 80G tax status.',
    columns: [
      { key: 'receiptNo', label: 'Receipt No.' },
      { key: 'receiptDate', label: 'Receipt Date' },
      { key: 'donorName', label: 'Donor / Devotee Name' },
      { key: 'panNumber', label: 'PAN Card Number' },
      { key: 'donationHead', label: 'Donation Head / Seva' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'paymentMode', label: 'Payment Mode' },
      { key: 'section80G', label: '80G Tax Exemption Status' }
    ]
  },
  {
    _id: 'std_10bd_statutory',
    isStandard: true,
    title: 'Form 10BD Statutory Tax Report',
    code: 'REP-10BD-STATUTORY',
    category: 'Statutory Compliance',
    reportBase: '10bd',
    reportBaseLabel: 'Form 10BD Statutory Tax',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: 'Audit Ready',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/reports-it',
    trustViewLink: '/trust/reports-it',
    description: 'Official Income Tax Form 10BD statement for aggregate donor filings under Section 80G(5)(vi).',
    columns: [
      { key: 'receiptNo', label: 'Pre-Ack / Receipt No.' },
      { key: 'receiptDate', label: 'Issuance Date' },
      { key: 'donorName', label: 'Donor / Devotee Name' },
      { key: 'panNumber', label: 'Unique ID (PAN/Aadhaar)' },
      { key: 'address', label: 'Donor Address' },
      { key: 'donationType', label: 'Donation Type' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'paymentMode', label: 'Mode of Receipt' }
    ]
  },
  {
    _id: 'std_head_collection',
    isStandard: true,
    title: 'Donation Head Wise Collection Report',
    code: 'REP-HEAD-COLLECTION',
    category: 'Temple Endowment',
    reportBase: 'donation-head',
    reportBaseLabel: 'Donation Head Wise',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: '5 Heads',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/donation-head-report',
    trustViewLink: '/trust/donation-head-report',
    description: 'Head-wise allocation breakdown across Annadanam, General Corpus, Pooja Services, and Temple Renovations.',
    columns: [
      { key: 'receiptNo', label: 'Receipt No.' },
      { key: 'receiptDate', label: 'Receipt Date' },
      { key: 'donorName', label: 'Donor Name' },
      { key: 'donationHead', label: 'Donation Head / Seva' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'paymentMode', label: 'Payment Mode' }
    ]
  },
  {
    _id: 'std_donor_directory',
    isStandard: true,
    title: 'Donor Directory & Stewardship Report',
    code: 'REP-DONOR-DIRECTORY',
    category: 'Donor Analytics',
    reportBase: 'donor',
    reportBaseLabel: 'Donor Directory',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: 'All Donors',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/donor-reports',
    trustViewLink: '/trust/donor-reports',
    description: 'Comprehensive donor database with lifetime donation totals, recurrence metrics, and contact registries.',
    columns: [
      { key: 'donorName', label: 'Donor / Devotee Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'email', label: 'Email Address' },
      { key: 'panNumber', label: 'PAN Card Number' },
      { key: 'address', label: 'Donor Address' },
      { key: 'amount', label: 'Total Contribution (₹)' }
    ]
  },
  {
    _id: 'std_donation_type',
    isStandard: true,
    title: 'Donation Type Classification Matrix',
    code: 'REP-TYPE-MATRIX',
    category: 'Financial Audit',
    reportBase: 'donation-type',
    reportBaseLabel: 'Donation Type Matrix',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: 'Classification',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/donation-type-report',
    trustViewLink: '/trust/donation-type-report',
    description: 'Cross-tabulated breakdown between Corpus Fund, General Donations, and Specified Purpose contributions.',
    columns: [
      { key: 'receiptNo', label: 'Receipt No.' },
      { key: 'receiptDate', label: 'Receipt Date' },
      { key: 'donorName', label: 'Donor / Devotee Name' },
      { key: 'donationType', label: 'Donation Type' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'paymentMode', label: 'Payment Mode' }
    ]
  },
  {
    _id: 'std_payment_mode',
    isStandard: true,
    title: 'Payment Mode Reconciliation Report',
    code: 'REP-PAYMENT-RECON',
    category: 'Financial Audit',
    reportBase: 'payment-mode',
    reportBaseLabel: 'Payment Mode Summary',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'All Trusts',
    financialYear: 'FY 2026-27',
    totalRecords: '4 Channels',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/payment-mode-report',
    trustViewLink: '/trust/payment-mode-report',
    description: 'Bank settlement and channel audit for UPI, NEFT/RTGS, Net Banking, Cheque, and Cash collections.',
    columns: [
      { key: 'receiptNo', label: 'Receipt No.' },
      { key: 'receiptDate', label: 'Receipt Date' },
      { key: 'donorName', label: 'Donor / Devotee Name' },
      { key: 'paymentMode', label: 'Payment Mode' },
      { key: 'paymentDetails', label: 'Payment Details / Ref' },
      { key: 'amount', label: 'Amount (₹)' }
    ]
  },
  {
    _id: 'std_exec_intelligence',
    isStandard: true,
    title: 'Platform Reports & Executive Intelligence',
    code: 'REP-EXEC-INTELLIGENCE',
    category: 'Executive Intelligence',
    reportBase: 'custom',
    reportBaseLabel: 'Platform Executive Intelligence',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    targetTrust: 'Platform Wide',
    financialYear: 'FY 2026-27',
    totalRecords: 'Consolidated',
    totalVolume: 8450000,
    status: 'Published',
    typeBadge: 'System Standard',
    viewLink: '/superadmin/reports',
    trustViewLink: '/trust/custom-reports',
    description: 'Consolidated platform-wide intelligence on trust subscription revenues, overall receipts issued, and growth trends.',
    columns: [
      { key: 'receiptNo', label: 'Metric / Identifier' },
      { key: 'receiptDate', label: 'Period / Date' },
      { key: 'donorName', label: 'Scope / Category' },
      { key: 'amount', label: 'Volume / Value (₹)' }
    ]
  }
];

// Helper functions for Report Model and Configured Columns metadata
const getReportModel = (item) => {
  if (item.reportBaseLabel) return item.reportBaseLabel;
  if (item.reportBase === 'receipts') return 'Donation Receipts Register';
  if (item.reportBase === '10bd') return 'Form 10BD Statutory Tax';
  if (item.reportBase === 'donation-head') return 'Donation Head Wise';
  if (item.reportBase === 'donor') return 'Donor Directory';
  if (item.reportBase === 'donation-type') return 'Donation Type Matrix';
  if (item.reportBase === 'payment-mode') return 'Payment Mode Summary';
  if (item.reportBase === 'custom') return 'Platform Executive Intelligence';
  return item.category || 'Standard Ledger';
};

const getDateRangeText = (item) => {
  if (item.fromDate && item.toDate) {
    return `${item.fromDate} → ${item.toDate}`;
  }
  return item.financialYear || 'Full Fiscal Year';
};

const getColumnsInfo = (item) => {
  const cols = Array.isArray(item.columns) && item.columns.length > 0
    ? item.columns
    : (Array.isArray(item.selectedFieldKeys) && item.selectedFieldKeys.length > 0
        ? item.selectedFieldKeys.map(k => ({ label: k }))
        : []);
  const count = cols.length;
  const labels = cols.map(c => typeof c === 'string' ? c : (c.label || c.key || ''));
  const preview = labels.slice(0, 3).join(', ') + (labels.length > 3 ? '...' : '');
  const fullList = labels.join(', ');
  return { count, preview, fullList };
};

export default function PublishedReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      let dynamicList = [];
      let superData = null;

      try {
        const [dynRes, supRes] = await Promise.all([
          fetch('/api/dynamic-reports'),
          fetch('/api/reports/superadmin')
        ]);
        const dynJson = await dynRes.json();
        if (dynJson.success && Array.isArray(dynJson.data)) {
          dynamicList = dynJson.data;
        }
        const supJson = await supRes.json();
        if (supJson.success && supJson.data) {
          superData = supJson.data;
        }
      } catch (err) {
        console.error('Error fetching dynamic reports / superadmin data:', err);
      }

      const totalVol = superData?.receiptsAnalytics?.totalDonationVolume || 8450000;
      const totalRcpts = superData?.receiptsAnalytics?.totalReceiptsIssued || 2145;

      const populatedStandardReports = STANDARD_PLATFORM_REPORTS.map(std => {
        if (std.code === 'REP-RCPT-MASTER' || std.code === 'REP-10BD-STATUTORY') {
          return {
            ...std,
            totalRecords: `${Number(totalRcpts).toLocaleString('en-IN')} Records`,
            totalVolume: totalVol
          };
        }
        return {
          ...std,
          totalVolume: std.totalVolume || totalVol
        };
      });

      // In Super Admin, include all standard reports; in Trust Admin, exclude standard platform reports
      const map = new Map();
      if (isSuperAdmin) {
        populatedStandardReports.forEach(std => map.set(std._id, std));
      }
      dynamicList.forEach(dyn => {
        if (!isSuperAdmin && (dyn.isStandard || dyn._id?.startsWith('std_'))) {
          return; // Exclude standard platform reports in Trust Admin panel
        }
        const existing = map.get(dyn._id) || {};
        map.set(dyn._id, { ...existing, ...dyn });
      });
      setReports(Array.from(map.values()));
    } catch (err) {
      console.error('Error in fetchReports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleViewReport = (item) => {
    if (item.isStandard) {
      navigate(isSuperAdmin ? item.viewLink : (item.trustViewLink || item.viewLink));
    } else {
      navigate(isSuperAdmin ? `/superadmin/report/${item._id}` : `/trust/report/${item._id}`);
    }
  };

  const handleDelete = (id, title) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Delete Report',
      message: `Are you sure you want to delete "${title}"? This will remove the report template and its data rows from all portals.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/dynamic-reports/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setReports(prev => prev.filter(r => r._id !== id));
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Deleted',
              message: 'Report deleted successfully.',
              showCancel: false,
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
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
          console.error('Error deleting report:', err);
        }
      }
    });
  };

  const handleExportCSV = (report) => {
    if (report.isStandard) {
      handleViewReport(report);
      return;
    }

    const cols = report.columns || [];
    const rows = report.dataRows || [];

    const headers = cols.map(c => `"${c.label}"`);
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = cols.map(c => {
        const val = r[c.key] !== undefined ? r[c.key] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
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

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.reportBaseLabel && r.reportBaseLabel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.targetTrust && r.targetTrust.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || (r.category && r.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(reports.map(r => r.category).filter(Boolean))];

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

      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Platform Reports Directory' }]} />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <FileSpreadsheet size={13} />
            <span>REPORT TEMPLATES &amp; AUDIT DIRECTORY</span>
          </div>
          <h1 className="mint-hero-title">Platform Reports Directory</h1>
          <p className="mint-hero-subtitle">
            Complete platform directory of statutory filings, financial audits, donor registers, and custom published report templates.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-hero-btn-action"
            onClick={() => navigate('/superadmin/new-report')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Create New Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="mint-table-card-container"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div className="trust-search-wrapper" style={{ minWidth: '280px', flex: '1 1 300px' }}>
            <Search className="trust-search-icon" size={17} />
            <input
              type="text"
              className="trust-form-input trust-search-input"
              placeholder="Search reports by title, code, trust, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#64748b" />
            <select
              className="trust-form-input"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
          Showing <strong>{filteredReports.length}</strong> reports
        </div>
      </div>

      {/* Main Table */}
      <div className="mint-table-card-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <FileSpreadsheet size={42} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              No reports found
            </h3>
            <p style={{ fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 16px', color: '#64748b' }}>
              No reports matched your search criteria. Create a new custom report or clear your search filters.
            </p>
            <button
              type="button"
              className="btn-trust-primary"
              onClick={() => navigate('/superadmin/new-report')}
            >
              Create New Report
            </button>
          </div>
        ) : (
          <div className="trust-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="trust-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Report Title &amp; Code</th>
                  <th>Category</th>
                  <th>Target Trust</th>
                  <th>Financial Year</th>
                  <th>Report Model</th>
                  <th>Configured Columns</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</span>
                        {item.isStandard ? (
                          <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                            Standard
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857' }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                        {item.code}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor:
                            item.category === 'Temple Endowment'
                              ? '#fef3c7'
                              : item.category === 'Statutory Compliance'
                              ? '#eff6ff'
                              : item.category === 'Donor Analytics'
                              ? '#f5f3ff'
                              : item.category === 'Executive Intelligence'
                              ? '#e0f2fe'
                              : '#ecfdf5',
                          color:
                            item.category === 'Temple Endowment'
                              ? '#b45309'
                              : item.category === 'Statutory Compliance'
                              ? '#1d4ed8'
                              : item.category === 'Donor Analytics'
                              ? '#7c3aed'
                              : item.category === 'Executive Intelligence'
                              ? '#0369a1'
                              : '#047857'
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                        {item.targetTrust || 'All Trusts'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        {item.financialYear}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                        {getReportModel(item)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        {getDateRangeText(item)}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const { count, preview, fullList } = getColumnsInfo(item);
                        return (
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                fontWeight: 600,
                                color: '#047857',
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11.5px'
                              }}
                            >
                              {count > 0 ? `${count} Columns` : 'Standard'}
                            </span>
                            {preview && (
                              <div
                                style={{
                                  fontSize: '11.5px',
                                  color: '#64748b',
                                  marginTop: '3px',
                                  maxWidth: '190px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={fullList}
                              >
                                {preview}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: item.status === 'Published' ? '#ecfdf5' : '#f1f5f9',
                          color: item.status === 'Published' ? '#047857' : '#64748b'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>{item.status || 'Published'}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {/* View Data Table Button: Navigates directly to full report view without opening popup */}
                        <button
                          type="button"
                          className="btn-trust-table-action"
                          onClick={() => handleViewReport(item)}
                          title="View Data Table"
                          style={{
                            padding: '6px 9px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            cursor: 'pointer',
                            color: '#0f766e'
                          }}
                        >
                          <Table size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-trust-table-action"
                          onClick={() => handleExportCSV(item)}
                          title="Download CSV"
                          style={{
                            padding: '6px 9px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            cursor: 'pointer',
                            color: '#2563eb'
                          }}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-trust-table-action"
                          onClick={() => navigate(`/superadmin/new-report?id=${item._id}`)}
                          title="Edit Report Template & Fields"
                          style={{
                            padding: '6px 9px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {item.isStandard ? (
                          <span
                            title="Built-in System Report"
                            style={{
                              padding: '6px 9px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              background: '#f8fafc',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8'
                            }}
                          >
                            <Lock size={14} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-trust-table-action btn-action-delete"
                            onClick={() => handleDelete(item._id, item.title)}
                            title="Delete Report"
                            style={{
                              padding: '6px 9px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: '#fff',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

