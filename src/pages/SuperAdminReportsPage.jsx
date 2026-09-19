import React, { useState, useEffect, useMemo } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import {
  BarChart2,
  TrendingUp,
  CreditCard,
  FileText,
  Users,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Zap,
  ExternalLink
} from 'lucide-react';

export default function SuperAdminReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'receipts' | 'growth'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filters for Admin Subscriptions List
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [dateFilter, setDateFilter] = useState({
    fromDate: '2025-10-01',
    toDate: '2026-09-30'
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/superadmin?fromDate=${dateFilter.fromDate}&toDate=${dateFilter.toDate}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const rev = reportData?.subscriptionRevenue;
  const rcpt = reportData?.receiptsAnalytics;
  const growth = reportData?.usersGrowth;

  // Filtered Admin Revenue List
  const filteredAdmins = useMemo(() => {
    if (!rev?.adminRevenueList) return [];
    return rev.adminRevenueList.filter(admin => {
      const matchesSearch =
        !searchQuery ||
        (admin.trustName && admin.trustName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (admin.contactPerson && admin.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (admin.email && admin.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (admin.mobile && admin.mobile.includes(searchQuery));

      const matchesPlan =
        planFilter === 'All' ||
        (admin.plan && admin.plan.toLowerCase() === planFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ||
        (admin.status && admin.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [rev?.adminRevenueList, searchQuery, planFilter, statusFilter]);

  // Totals for filtered list
  const filteredTotals = useMemo(() => {
    return filteredAdmins.reduce(
      (acc, a) => {
        acc.basePlanSum += Number(a.planPrice) || 0;
        acc.addonSum += Number(a.extraStaffRevenue) || 0;
        acc.grandTotalSum += Number(a.totalRevenue) || 0;
        return acc;
      },
      { basePlanSum: 0, addonSum: 0, grandTotalSum: 0 }
    );
  }, [filteredAdmins]);

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === 'revenue') {
      csvContent += "=== ADMIN SUBSCRIPTIONS & REVENUE DIRECTORY ===\n";
      csvContent += "S.No,Trust / Admin Name,Contact Person,Email,Mobile,Plan,Base Fee (INR),Staff Count,Included Staff,Extra Staff,Add-on Revenue (INR),Total Revenue (INR),Payment Gateway,Payment ID,Status,Joined Date,Valid Till\n";
      
      const listToExport = rev?.adminRevenueList || [];
      listToExport.forEach((a, idx) => {
        const row = [
          idx + 1,
          `"${(a.trustName || '').replace(/"/g, '""')}"`,
          `"${(a.contactPerson || '').replace(/"/g, '""')}"`,
          `"${(a.email || '').replace(/"/g, '""')}"`,
          `"${(a.mobile || '').replace(/"/g, '""')}"`,
          `"${(a.plan || '').replace(/"/g, '""')}"`,
          a.planPrice || 0,
          a.staffCount || 0,
          `"${a.includedStaff || 0}"`,
          a.extraStaff || 0,
          a.extraStaffRevenue || 0,
          a.totalRevenue || 0,
          `"${(a.paymentGateway || 'Razorpay').replace(/"/g, '""')}"`,
          `"${(a.paymentId || '').replace(/"/g, '""')}"`,
          `"${(a.status || 'Active').replace(/"/g, '""')}"`,
          `"${(a.joinedDate || '').replace(/"/g, '""')}"`,
          `"${(a.validTill || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });

      csvContent += `\nTotal Admins,${listToExport.length}\n`;
      csvContent += `Total Subscription Revenue (INR),${rev?.totalRevenue || 0}\n`;
    } else if (activeTab === 'receipts') {
      csvContent += "Category,Metric,Value\n";
      csvContent += `Total Receipts Issued,Count,${reportData.receiptsAnalytics.totalReceiptsIssued}\n`;
      csvContent += `Total Donation Volume,INR,${reportData.receiptsAnalytics.totalDonationVolume}\n\n`;
      csvContent += "Donation Head,Receipt Count,Total Amount (INR)\n";
      reportData.receiptsAnalytics.headBreakdown.forEach(h => {
        csvContent += `"${h.head}",${h.count},${h.amount}\n`;
      });
      csvContent += "\nPayment Mode,Receipt Count,Total Amount (INR),Share (%)\n";
      reportData.receiptsAnalytics.paymentModeBreakdown.forEach(pm => {
        csvContent += `"${pm.mode}",${pm.count},${pm.amount},${pm.percentage}%\n`;
      });
    } else {
      csvContent += "Month,Trust Registrations\n";
      reportData.usersGrowth.monthlyRegistrations.forEach(r => {
        csvContent += `${r.month},${r.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `superadmin_subscription_revenue_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPlanBadgeStyle = (planName) => {
    const p = (planName || '').toLowerCase();
    if (p.includes('enterprise')) {
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (p.includes('advanced')) {
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    }
    if (p.includes('starter')) {
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    }
    return { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' }; // Standard
  };

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Subscription Revenue' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <CreditCard size={14} />
            <span>ADMIN SUBSCRIPTION REVENUE &amp; INTELLIGENCE</span>
          </div>
          <h1 className="mint-hero-title">Subscription Revenue Directory</h1>
          <p className="mint-hero-subtitle">
            Consolidated breakdown of subscription revenues collected from each trust admin. View plan tiers, staff user add-on revenue, Razorpay gateway transactions, and renewal schedules.
          </p>
        </div>
        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            onClick={fetchReports}
            title="Refresh Revenue Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            onClick={handleExportCSV}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          className={activeTab === 'revenue' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('revenue')}
        >
          <CreditCard size={16} />
          <span>Subscription Revenue of Each Admin</span>
        </button>
        <button
          type="button"
          className={activeTab === 'receipts' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('receipts')}
        >
          <FileText size={16} />
          <span>Donation Receipts Aggregate</span>
        </button>
        <button
          type="button"
          className={activeTab === 'growth' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('growth')}
        >
          <TrendingUp size={16} />
          <span>Trusts Growth Analytics</span>
        </button>
      </div>

      {/* Tab 1: Subscription Revenue of Each Admin */}
      {activeTab === 'revenue' && (
        <div>
          {/* Top Metric Cards */}
          <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="stat-modern-card card-green">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CreditCard size={22} /></div>
                <span className="stat-modern-val">
                  ₹{(rev?.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Subscription Revenue</span>
              </div>
            </div>

            <div className="stat-modern-card card-blue">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><Users size={22} /></div>
                <span className="stat-modern-val">{rev?.totalAdmins || (rev?.adminRevenueList?.length || 0)}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Subscribed Admins</span>
              </div>
            </div>

            <div className="stat-modern-card card-amber">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
                <span className="stat-modern-val">{rev?.activeSubscriptions || 0}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Active Subscriptions</span>
              </div>
            </div>

            <div className="stat-modern-card card-purple">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><TrendingUp size={22} /></div>
                <span className="stat-modern-val">₹{(rev?.averageRevenuePerTrust || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Average Revenue / Trust</span>
              </div>
            </div>
          </div>

          {/* Core Table Card: All Admins Subscription Revenue */}
          <div className="trust-card" style={{ padding: '24px', marginBottom: '24px' }}>
            {/* Header & Filter Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} style={{ color: '#10b981' }} />
                  <span>Admin Subscriptions &amp; Revenue Breakdown</span>
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Showing {filteredAdmins.length} organizations with plan fees, add-on staff revenue, and Razorpay payment records
                </p>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search trust, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '32px', fontSize: '13px', height: '36px', borderRadius: '6px' }}
                  />
                </div>

                {/* Plan Filter */}
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '13px', height: '36px', borderRadius: '6px', width: '130px' }}
                >
                  <option value="All">All Plans</option>
                  <option value="Standard">Standard</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Starter">Starter</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '13px', height: '36px', borderRadius: '6px', width: '120px' }}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>
            </div>

            {/* The Revenue List Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="trust-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Trust / Admin Organization</th>
                    <th>Contact Person</th>
                    <th>Subscribed Plan</th>
                    <th style={{ textAlign: 'right' }}>Base Plan Fee</th>
                    <th style={{ textAlign: 'center' }}>Staff Licenses</th>
                    <th style={{ textAlign: 'right' }}>Add-on Staff Revenue</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue (₹)</th>
                    <th>Payment Gateway</th>
                    <th>Valid Till</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No admin subscription records match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin, idx) => {
                      const badgeStyle = getPlanBadgeStyle(admin.plan);
                      return (
                        <tr key={admin._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                              {admin.trustName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Mail size={11} />
                              <span>{admin.email}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#334155', fontSize: '13px' }}>
                              {admin.contactPerson}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={11} />
                              <span>{admin.mobile}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                backgroundColor: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: `1px solid ${badgeStyle.border}`
                              }}
                            >
                              {admin.plan} Plan
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                            ₹{Number(admin.planPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '12.5px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{admin.staffCount}</span>
                            <span style={{ color: '#64748b', fontSize: '11.5px' }}> / {admin.includedStaff}</span>
                            {admin.extraStaff > 0 && (
                              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                                +{admin.extraStaff} extra
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '13px', color: admin.extraStaffRevenue > 0 ? '#0284c7' : '#94a3b8' }}>
                            {admin.extraStaffRevenue > 0
                              ? `+₹${Number(admin.extraStaffRevenue).toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '14px' }}>
                            ₹{Number(admin.totalRevenue || 0).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  backgroundColor: '#dcfce7',
                                  color: '#15803d',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                {admin.paymentGateway || 'Razorpay'}
                              </span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                              {admin.paymentId}
                            </div>
                          </td>
                          <td style={{ fontSize: '12px', color: '#475569' }}>
                            {admin.validTill}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: admin.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fffbeb',
                                color: admin.status?.toLowerCase() === 'active' ? '#047857' : '#b45309',
                                border: admin.status?.toLowerCase() === 'active' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                              }}
                            >
                              {admin.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Table Summary Footer */}
                {filteredAdmins.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: '12px 16px', fontSize: '13.5px', color: '#0f172a' }}>
                        Total Summary ({filteredAdmins.length} Admins)
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13.5px', color: '#334155' }}>
                        ₹{filteredTotals.basePlanSum.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>—</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13.5px', color: '#0284c7' }}>
                        +₹{filteredTotals.addonSum.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '15px', color: '#059669' }}>
                        ₹{filteredTotals.grandTotalSum.toLocaleString('en-IN')}
                      </td>
                      <td colSpan={3} style={{ color: '#64748b', fontSize: '12px' }}>
                        All payments captured via Razorpay
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Supplementary Visual Intelligence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Monthly Trend Table */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: '#10b981' }} />
                <span>Monthly Revenue Trajectory</span>
              </h3>
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Subscribed Trusts</th>
                    <th style={{ textAlign: 'right' }}>Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rev?.monthlyRevenue?.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#334155' }}>{m.month}</td>
                      <td>{m.subscriptions} trusts</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{m.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Plan Tier Distribution */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: '#0ea5e9' }} />
                <span>Plan Tier Contribution</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rev?.planBreakdown?.map((p, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.plan}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{p.revenue.toLocaleString('en-IN')} ({p.percentage}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(5, p.percentage))}%`,
                          backgroundColor: idx === 0 ? '#10b981' : (idx === 1 ? '#0ea5e9' : (idx === 2 ? '#8b5cf6' : '#f59e0b')),
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {p.count} Active organizations
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Donation Receipts Aggregate */}
      {activeTab === 'receipts' && rcpt && (
        <div>
          {/* Top Metric Cards */}
          <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="stat-modern-card card-green">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><FileText size={22} /></div>
                <span className="stat-modern-val">{rcpt.totalReceiptsIssued.toLocaleString('en-IN')}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Platform Receipts Issued</span>
              </div>
            </div>

            <div className="stat-modern-card card-blue">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><TrendingUp size={22} /></div>
                <span className="stat-modern-val">₹{(rcpt.totalDonationVolume / 100000).toFixed(2)}L</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Donations Volume</span>
              </div>
            </div>

            <div className="stat-modern-card card-amber">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CreditCard size={22} /></div>
                <span className="stat-modern-val">₹{Math.round(rcpt.avgReceiptValue).toLocaleString('en-IN')}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Avg Donation / Receipt</span>
              </div>
            </div>

            <div className="stat-modern-card card-purple">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
                <span className="stat-modern-val">100%</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Form 10BD Audit Ready</span>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Head Breakdown */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Donation Heads Distribution
              </h3>
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Donation Head</th>
                    <th>Count</th>
                    <th style={{ textAlign: 'right' }}>Total Raised (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rcpt.headBreakdown.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{h.head}</td>
                      <td>{h.count} receipts</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{h.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Mode Breakdown */}
            <div className="trust-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Payment Mode Channels
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rcpt.paymentModeBreakdown.map((pm, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{pm.mode}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{pm.amount.toLocaleString('en-IN')} ({pm.percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pm.percentage}%`,
                          backgroundColor: i === 0 ? '#10b981' : (i === 1 ? '#0ea5e9' : (i === 2 ? '#f59e0b' : '#64748b')),
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {pm.count} Transactions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Trusts Growth */}
      {activeTab === 'growth' && growth && (
        <div>
          <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
            <div className="stat-modern-card card-green">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><Users size={22} /></div>
                <span className="stat-modern-val">{growth.totalTrusts}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Registered Organizations</span>
              </div>
            </div>

            <div className="stat-modern-card card-blue">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
                <span className="stat-modern-val">{growth.activeTrusts}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Active Paying Trusts</span>
              </div>
            </div>

            <div className="stat-modern-card card-amber">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><Calendar size={22} /></div>
                <span className="stat-modern-val">{growth.trialTrusts}</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">In 48-Hour Free Trial</span>
              </div>
            </div>
          </div>

          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              New Trust Onboarding Trajectory
            </h3>
            <table className="trust-data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>New Trusts Registered</th>
                  <th>Growth Visual</th>
                </tr>
              </thead>
              <tbody>
                {growth.monthlyRegistrations.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.month}</td>
                    <td>{m.count} Trusts</td>
                    <td>
                      <div style={{ width: '200px', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (m.count / 10) * 100)}%`, backgroundColor: '#10b981', borderRadius: '5px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
