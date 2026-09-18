import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { Download, Printer, BarChart3, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function ReportsPage({ user: propUser }) {
  const localUser = (() => { try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; } })();
  const user = propUser || localUser;
  const { type = '10bd' } = useParams();
  const [activeTab, setActiveTab] = useState(type);
  const [reportData, setReportData] = useState(null);
  const [headWiseData, setHeadWiseData] = useState([]);
  const [paymentModeData, setPaymentModeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  useEffect(() => {
    setLoading(true);
    const trustParams = (user?.email && !user?.role?.toLowerCase()?.includes('super'))
      ? `?trustEmail=${encodeURIComponent(user.email)}&trustName=${encodeURIComponent(user.trustName || user.name || '')}&trustId=${encodeURIComponent(user._id || user.id || '')}`
      : '';
    if (activeTab === '10bd' || activeTab === 'receipts' || activeTab === 'donors') {
      fetch(`/api/reports/10bd${trustParams}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setReportData(d);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'head-wise') {
      fetch(`/api/reports/head-wise${trustParams}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setHeadWiseData(d.data || []);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'payment-mode' || activeTab === 'type') {
      fetch(`/api/reports/payment-mode${trustParams}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setPaymentModeData(d.data || []);
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab, user?.email]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.data) return;
    const headers = ['Sl No', 'ID Type', 'ID Number', 'Donor Name', 'Address', 'Donation Type', 'Mode', 'Amount', 'Receipt No', 'Date'];
    const rows = reportData.data.map(r => [
      r.slNo,
      r.idType,
      r.idNumber,
      `"${r.donorName}"`,
      `"${r.address || ''}"`,
      `"${r.donationType}"`,
      `"${r.paymentMode}"`,
      r.amount,
      `"${r.receiptNo}"`,
      `"${r.receiptDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Form_10BD_Report_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>REPORT GENERATION & EXPORT</span>
          </div>
          <h1 className="mint-hero-title">Trust Financial Reports</h1>
          <p className="mint-hero-subtitle">
            Consolidated statutory reports, donation type analyses, and donation receipts audit logs.
          </p>
        </div>
      </div>

      <div className="mint-table-card-container">
        <div className="page-title-row">
          <div>
            <h1 className="page-heading">
              {activeTab === '10bd' && 'Statutory Compliance: Form No. 10BD'}
              {activeTab === 'head-wise' && 'Head-Wise Donation Report'}
              {activeTab === 'payment-mode' && 'Payment Mode Summary Report'}
              {activeTab === 'receipts' && 'Complete Receipts Audit Report'}
              {activeTab === 'donors' && 'Donor Contribution Directory'}
              {activeTab === 'type' && 'Donation Type Analysis Report'}
            </h1>
            <p style={{ fontSize: '13.5px', color: '#666', margin: '4px 0 0 0' }}>
              Financial Year 2026-27 | {user?.trustName || 'Trust Organization'}
            </p>
          </div>

          <div className="header-action-buttons">
            <button className="btn-primary-green" onClick={handleExportCSV}>
              <Download size={16} /> Export Form 10BD (CSV)
            </button>
            <button className="btn-secondary-green" onClick={() => window.print()}>
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs for Reports */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { id: '10bd', label: 'Form No. 10BD' },
            { id: 'receipts', label: 'Receipt Reports' },
            { id: 'head-wise', label: 'Head-Wise Reports' },
            { id: 'donors', label: 'Donor Reports' },
            { id: 'type', label: 'Donation Type' },
            { id: 'payment-mode', label: 'Payment Mode' }
          ].map(tab => (
            <Link
              key={tab.id}
              to={
                tab.id === '10bd' ? '/trust/reports-it' :
                tab.id === 'receipts' ? '/trust/reports' :
                tab.id === 'head-wise' ? '/trust/donation-head-report' :
                tab.id === 'donors' ? '/trust/donor-reports' :
                tab.id === 'type' ? '/trust/donation-type-report' :
                tab.id === 'payment-mode' ? '/trust/payment-mode-report' :
                `/trust/reports/${tab.id}`
              }
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: '600',
                textDecoration: 'none',
                backgroundColor: activeTab === tab.id ? '#059669' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#334155',
                border: activeTab === tab.id ? '1px solid #059669' : '1px solid #cbd5e1',
                boxShadow: activeTab === tab.id ? '0 2px 6px rgba(5, 150, 105, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* 10BD / Receipt / Donor Table */}
        {(activeTab === '10bd' || activeTab === 'receipts' || activeTab === 'donors') && (
          <div className="table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #eee', marginBottom: '16px' }}>
              <div>
                <strong>Total Donors Recorded:</strong> {reportData?.totalDonors || 6}
              </div>
              <div>
                <strong>Total Collection:</strong>{' '}
                <span style={{ color: '#2e7d32', fontWeight: '700', fontSize: '16px' }}>
                  ₹ {reportData?.totalAmount ? Number(reportData.totalAmount).toLocaleString('en-IN') : '18,500.00'}
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Sl. No.</th>
                    <th>ID Type</th>
                    <th>ID Number (PAN)</th>
                    <th>Donor Name</th>
                    <th>Address</th>
                    <th>Donation Type</th>
                    <th>Mode</th>
                    <th>Amount (₹)</th>
                    <th>Receipt No</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.data?.map(item => (
                    <tr key={item.slNo}>
                      <td>{item.slNo}</td>
                      <td>{item.idType}</td>
                      <td style={{ fontWeight: '600', letterSpacing: '0.5px' }}>{item.idNumber}</td>
                      <td style={{ fontWeight: '600' }}>{item.donorName}</td>
                      <td style={{ fontSize: '12px', maxWidth: '180px' }}>{item.address}</td>
                      <td>{item.donationType}</td>
                      <td>{item.paymentMode}</td>
                      <td style={{ fontWeight: '700', color: '#2e7d32' }}>
                        ₹ {Number(item.amount).toFixed(2)}
                      </td>
                      <td>{item.receiptNo}</td>
                      <td>{item.receiptDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Head-Wise Report */}
        {activeTab === 'head-wise' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Donation Head Name</th>
                    <th>Total Receipts Count</th>
                    <th>Total Amount Received (₹)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {headWiseData.map((h, i) => (
                    <tr key={h.headName}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: '600' }}>{h.headName}</td>
                      <td>{h.count} Receipts</td>
                      <td style={{ fontWeight: '700', color: '#2e7d32' }}>
                        ₹ {Number(h.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Mode Report */}
        {(activeTab === 'payment-mode' || activeTab === 'type') && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Payment Channel</th>
                    <th>Transactions Count</th>
                    <th>Total Received (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentModeData.map((m, i) => (
                    <tr key={m.mode}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: '600' }}>{m.mode}</td>
                      <td>{m.count}</td>
                      <td style={{ fontWeight: '700', color: '#2e7d32' }}>
                        ₹ {Number(m.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
