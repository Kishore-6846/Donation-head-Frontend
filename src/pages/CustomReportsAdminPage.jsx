import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  X,
  Printer
} from 'lucide-react';

export default function CustomReportsAdminPage({ user: propUser }) {
  const localUser = (() => { try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; } })();
  const currentUser = propUser || localUser;
  const isSuperAdmin = currentUser?.role?.toLowerCase()?.includes('super');
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'schemas'
  const [reports, setReports] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailModalItem, setDetailModalItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    const trustParam = isSuperAdmin ? 'all' : (currentUser?.trustName || currentUser?.name || currentUser?.email || 'all');
    Promise.all([
      fetch(`/api/reports/records?trust=${encodeURIComponent(trustParam)}`).then(r => r.json()),
      fetch('/api/report-types?status=Active').then(r => r.json())
    ])
      .then(([repData, schemaData]) => {
        if (repData.success) {
          setReports(repData.data || []);
        }
        if (schemaData.success) {
          setSchemas(schemaData.data || []);
        }
      })
      .catch(err => console.error('Error fetching admin reports:', err))
      .finally(() => setLoading(false));
  }, [currentUser?.email, isSuperAdmin]);

  const handleExportCSV = (report) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report Title,"${report.title}"\n`;
    csvContent += `Report Type,"${report.reportTypeName}"\n`;
    csvContent += `Financial Year,"${report.financialYear}"\n`;
    csvContent += `Period,"${report.fromDate} to ${report.toDate}"\n`;
    csvContent += `Total Volume (INR),${report.totalVolume}\n`;
    csvContent += `Total Records,${report.totalRecords}\n\n`;
    csvContent += `Executive Summary,"${(report.executiveSummary || '').replace(/"/g, '""')}"\n\n`;

    csvContent += 'Key Findings\n';
    if (Array.isArray(report.keyFindings)) {
      report.keyFindings.forEach((kf, idx) => {
        csvContent += `${idx + 1},"${kf.replace(/"/g, '""')}"\n`;
      });
    }

    if (report.remarks) {
      csvContent += `\nStatutory Remarks,"${report.remarks.replace(/"/g, '""')}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(r =>
    (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.reportTypeName && r.reportTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.executiveSummary && r.executiveSummary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSchemas = schemas.filter(s =>
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Trust Admin', link: '/trust' }, { label: 'Platform & Super Admin Reports' }]} />

      {/* Details Modal */}
      {detailModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setDetailModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '28px',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModalItem(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#047857', marginBottom: '8px' }}>
              {detailModalItem.reportTypeName}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {detailModalItem.title}
            </h2>

            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span><strong>Scope:</strong> {detailModalItem.targetTrust}</span>
              <span><strong>FY:</strong> {detailModalItem.financialYear}</span>
              <span><strong>Period:</strong> {detailModalItem.fromDate} &rarr; {detailModalItem.toDate}</span>
            </div>

            {/* Metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total Volume Audited</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  ₹{Number(detailModalItem.totalVolume || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total Records Audited</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {detailModalItem.totalRecords}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            {detailModalItem.executiveSummary && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Executive Summary
                </h4>
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, margin: 0, backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px' }}>
                  {detailModalItem.executiveSummary}
                </p>
              </div>
            )}

            {/* Key Findings */}
            {Array.isArray(detailModalItem.keyFindings) && detailModalItem.keyFindings.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Key Audit Findings &amp; Highlights
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>
                  {detailModalItem.keyFindings.map((kf, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{kf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Remarks */}
            {detailModalItem.remarks && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Trustee Remarks &amp; Compliance Notes
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', margin: 0 }}>
                  "{detailModalItem.remarks}"
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn-trust-secondary"
                onClick={() => handleExportCSV(detailModalItem)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                className="btn-trust-primary"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={13} />
            <span>SUPER ADMIN AUDIT &amp; PLATFORM INTELLIGENCE</span>
          </div>
          <h1 className="mint-hero-title">Platform &amp; Custom Audit Reports</h1>
          <p className="mint-hero-subtitle">
            Access statutory compliance audits, 80G reconciliations, and custom reporting schemas published by the platform Super Administrator.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          className={activeTab === 'published' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '9px 18px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('published')}
        >
          <FileText size={16} />
          <span>Published Audit Reports ({reports.length})</span>
        </button>

        <button
          type="button"
          className={activeTab === 'schemas' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '9px 18px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('schemas')}
        >
          <FileSpreadsheet size={16} />
          <span>Report Types &amp; Schemas ({schemas.length})</span>
        </button>
      </div>

      {/* Tab 1: Published Reports */}
      {activeTab === 'published' && (
        <div className="mint-table-card-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <p>Loading published reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FileText size={42} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                No published reports from Super Admin
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>
                Reports published by Super Admin will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="trust-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="trust-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Report Title</th>
                    <th>Report Schema</th>
                    <th>Financial Year</th>
                    <th>Period</th>
                    <th>Total Volume</th>
                    <th>Records</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td style={{ color: '#94a3b8', fontWeight: 500 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Target: {item.targetTrust || 'All Trusts'}
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
                            backgroundColor: '#ecfdf5',
                            color: '#047857'
                          }}
                        >
                          {item.reportTypeName}
                        </span>
                      </td>
                      <td>{item.financialYear}</td>
                      <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                        {item.fromDate} &rarr; {item.toDate}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        ₹{Number(item.totalVolume || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 500, color: '#334155' }}>{item.totalRecords || 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-trust-table-action"
                            onClick={() => setDetailModalItem(item)}
                            title="View Full Findings"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              cursor: 'pointer',
                              color: '#0f766e'
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-trust-table-action"
                            onClick={() => handleExportCSV(item)}
                            title="Download CSV"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              cursor: 'pointer',
                              color: '#2563eb'
                            }}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Report Schemas */}
      {activeTab === 'schemas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {schemas.map(s => (
            <div
              key={s._id}
              className="mint-table-card-container"
              style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8'
                    }}
                  >
                    {s.category}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
                    {s.code}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {s.name}
                </h3>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                  {s.description || 'Statutory report schema defined by Super Admin.'}
                </p>

                {s.sectionClause && (
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, marginBottom: '12px' }}>
                    📜 {s.sectionClause}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  <strong>Frequency:</strong> {s.frequency} | <strong>Scope:</strong> {s.scope}
                </div>

                {Array.isArray(s.columns) && s.columns.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                    {s.columns.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '6px',
                          color: '#475569'
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  ✓ Official Platform Schema
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
