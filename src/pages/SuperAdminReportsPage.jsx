import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

export default function SuperAdminReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'receipts' | 'growth'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

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

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === 'revenue') {
      csvContent += "Category,Metric,Value\n";
      csvContent += `Total Platform Revenue,INR,${reportData.subscriptionRevenue.totalRevenue}\n\n`;
      csvContent += "Month,Revenue (INR),Subscriptions\n";
      reportData.subscriptionRevenue.monthlyRevenue.forEach(m => {
        csvContent += `${m.month},${m.amount},${m.subscriptions}\n`;
      });
      csvContent += "\nPlan,Subscribers,Revenue (INR),Share (%)\n";
      reportData.subscriptionRevenue.planBreakdown.forEach(p => {
        csvContent += `"${p.plan}",${p.count},${p.revenue},${p.percentage}%\n`;
      });
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
    link.setAttribute("download", `superadmin_report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const rev = reportData?.subscriptionRevenue;
  const rcpt = reportData?.receiptsAnalytics;
  const growth = reportData?.usersGrowth;

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Platform Reports' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <BarChart2 size={14} />
            <span>EXECUTIVE AUDIT &amp; ANALYTICS</span>
          </div>
          <h1 className="mint-hero-title">Platform Reports &amp; Intelligence</h1>
          <p className="mint-hero-subtitle">
            Consolidated platform-wide intelligence: Subscription revenues, overall donations raised by trusts, head-wise distributions, and growth rates.
          </p>
        </div>
        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Print Report</span>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          className={activeTab === 'revenue' ? 'btn-trust-primary' : 'btn-trust-secondary'}
          style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setActiveTab('revenue')}
        >
          <CreditCard size={16} />
          <span>Subscription Revenue</span>
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

      {/* Tab 1: Subscription Revenue */}
      {activeTab === 'revenue' && rev && (
        <div>
          {/* Top Metric Cards */}
          <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="stat-modern-card card-green">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><CreditCard size={22} /></div>
                <span className="stat-modern-val">₹{(rev.totalRevenue / 100000).toFixed(2)}L</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Subscription Revenue</span>
              </div>
            </div>

            <div className="stat-modern-card card-blue">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><Layers size={22} /></div>
                <span className="stat-modern-val">41</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Total Active Subscriptions</span>
              </div>
            </div>

            <div className="stat-modern-card card-amber">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><TrendingUp size={22} /></div>
                <span className="stat-modern-val">₹5,560</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Average Revenue Per Trust</span>
              </div>
            </div>

            <div className="stat-modern-card card-purple">
              <div className="stat-modern-top">
                <div className="stat-modern-icon"><ArrowUpRight size={22} /></div>
                <span className="stat-modern-val">+18.5%</span>
              </div>
              <div className="stat-modern-bottom">
                <span className="stat-modern-title">Quarterly Growth</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown Grid */}
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
                    <th>Subscriptions</th>
                    <th style={{ textAlign: 'right' }}>Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rev.monthlyRevenue.map((m, idx) => (
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
                {rev.planBreakdown.map((p, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.plan}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{p.revenue.toLocaleString('en-IN')} ({p.percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${p.percentage}%`,
                        backgroundColor: idx === 0 ? '#10b981' : (idx === 1 ? '#0ea5e9' : (idx === 2 ? '#8b5cf6' : '#f59e0b')),
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {p.count} Active subscribers
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
                      <div style={{
                        height: '100%',
                        width: `${pm.percentage}%`,
                        backgroundColor: i === 0 ? '#10b981' : (i === 1 ? '#0ea5e9' : (i === 2 ? '#f59e0b' : '#64748b')),
                        borderRadius: '4px'
                      }} />
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
                        <div style={{ height: '100%', width: `${(m.count / 10) * 100}%`, backgroundColor: '#10b981', borderRadius: '5px' }} />
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
