import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Boxes,
  Users,
  UserCheck,
  FileText,
  Plus,
  ArrowRight,
  Printer,
  Sparkles,
  Megaphone,
  TrendingUp,
  Building,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function SuperAdminDashboardPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    plans: { total: 0, active: 0 },
    users: { total: 0, active: 0 },
    employees: { total: 0, active: 0 },
    receipts: { total: 0, active: 0, totalAmount: 0 }
  });

  const [recentReceipts, setRecentReceipts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/superadmin-stats');
      const data = await res.json();
      if (data.success) {
        if (data.stats) setStats(data.stats);
        if (data.recentReceipts) setRecentReceipts(data.recentReceipts);
        if (data.recentUsers) setRecentUsers(data.recentUsers);
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching superadmin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [location.pathname, location.key]);

  const handlePrintReceipt = (r) => {
    const url = r.receiptNo
      ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(r.receiptNo)}`
      : `/api/receipts/pdf?id=${encodeURIComponent(r._id)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="dashboard-container-modern">
      {/* 1. Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>SUPER ADMIN COMMAND CENTER</span>
          </div>
          <h1 className="mint-hero-title">Platform Overview &amp; Control</h1>
          <p className="mint-hero-subtitle">
            Welcome to the Super Admin Portal. Oversee all registered trusts, manage subscription plans, employees, and platform receipts in real time.
          </p>
        </div>
        <div className="mint-hero-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px' }}
            onClick={() => navigate('/superadmin/new-plan')}
          >
            <Plus size={16} />
            <span>New Plan</span>
          </button>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px' }}
            onClick={() => navigate('/superadmin/new-user')}
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px' }}
            onClick={() => navigate('/superadmin/new-employee')}
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Pending Registrations Alert */}
      {(stats.users?.pending > 0) && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⏳</span>
            <div>
              <strong style={{ color: '#92400e', fontSize: '13.5px' }}>
                {stats.users.pending} New Trust Admin Account{stats.users.pending > 1 ? 's' : ''} Awaiting Approval:
              </strong>
              <span style={{ color: '#b45309', fontSize: '13px', marginLeft: '6px' }}>
                Plan subscriptions have been paid. Admin portal access is pending your approval.
              </span>
            </div>
          </div>
          <Link
            to="/superadmin/users"
            className="btn-trust-primary"
            style={{
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              fontSize: '12.5px',
              padding: '6px 14px',
              textDecoration: 'none'
            }}
          >
            Review &amp; Approve &rarr;
          </Link>
        </div>
      )}

      {/* 2. 4 Key Stat Cards (Plans, Users, Employees, Receipts) */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        {/* Card 1: Plans */}
        <Link
          to="/superadmin/plans"
          className="stat-modern-card card-green"
          title="Manage Subscription Plans"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <Boxes size={22} strokeWidth={2.5} />
            </div>
            <span className="stat-modern-val">{stats.plans?.total ?? 0}</span>
          </div>
          <div className="stat-modern-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-modern-title">Plans</span>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>
              {stats.plans?.active ?? 0} Active &rarr;
            </span>
          </div>
        </Link>

        {/* Card 2: Users */}
        <Link
          to="/superadmin/users"
          className="stat-modern-card card-blue"
          title="Manage Registered Trusts & Users"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <Users size={22} />
            </div>
            <span className="stat-modern-val">{stats.users?.total ?? 0}</span>
          </div>
          <div className="stat-modern-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-modern-title">Users (Trusts)</span>
            <span style={{ fontSize: '11px', color: stats.users?.pending > 0 ? '#b45309' : '#0369a1', fontWeight: 700 }}>
              {stats.users?.pending > 0 ? `⏳ ${stats.users.pending} Pending` : `${stats.users?.active ?? 0} Active`} &rarr;
            </span>
          </div>
        </Link>

        {/* Card 3: Employees */}
        <Link
          to="/superadmin/employees"
          className="stat-modern-card card-purple"
          title="Super Admin Employees & Staff"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <UserCheck size={22} />
            </div>
            <span className="stat-modern-val">{stats.employees?.total ?? 0}</span>
          </div>
          <div className="stat-modern-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-modern-title">Employees</span>
            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
              Super Admin Staff &rarr;
            </span>
          </div>
        </Link>

        {/* Card 4: Receipts */}
        <Link
          to="/superadmin/all-receipts"
          className="stat-modern-card card-amber"
          title="View All Donation Receipts"
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon">
              <FileText size={22} />
            </div>
            <span className="stat-modern-val">{stats.receipts?.total ?? 0}</span>
          </div>
          <div className="stat-modern-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-modern-title">Donation Receipts</span>
            <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
              ₹{((Number(stats.receipts?.totalAmount) || 0) / 100000).toFixed(1)}L Raised &rarr;
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Two-Column Row: Recently Generated Receipt & Recently Joined User */}
      <div className="dashboard-recents-grid">
        {/* Card A: Recently Generated Receipts */}
        <div className="trust-card dashboard-recent-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Recently Generated Receipt
                  </h2>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Latest receipts issued across all trusts</span>
                </div>
              </div>

              <Link to="/superadmin/all-receipts" className="updates-view-all-btn" style={{ fontSize: '12px' }}>
                View All &rarr;
              </Link>
            </div>

            <div className="trust-table-wrapper">
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Donor &amp; Trust</th>
                    <th>Amount (₹)</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '13px' }}>
                        No receipts generated yet.
                      </td>
                    </tr>
                  ) : (
                    recentReceipts.slice(0, 5).map(r => (
                      <tr key={r._id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#00a651', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {r.receiptNo}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={r.donorName}>
                            {r.donorName}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', display: 'block' }} title={r.trustName || 'Trust'}>
                            {r.trustName || 'Trust'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                          ₹{Number(r.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.receiptDate}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handlePrintReceipt(r)}
                            title="Print Receipt"
                          >
                            <Printer size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card B: Recently Joined User */}
        <div className="trust-card dashboard-recent-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Recently Joined User
                  </h2>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Newly registered trust accounts</span>
                </div>
              </div>

              <Link to="/superadmin/users" className="updates-view-all-btn" style={{ fontSize: '12px' }}>
                View All &rarr;
              </Link>
            </div>

            <div className="trust-table-wrapper">
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Trust / Org Name</th>
                    <th>Contact Person</th>
                    <th>Plan</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '13px' }}>
                        No registered users / trusts yet.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.slice(0, 5).map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={u.trustName || u.name}>
                            {u.trustName || u.name}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', display: 'block' }} title={u.email}>
                            {u.email}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={u.contactPerson || 'Admin'}>
                          {u.contactPerson || 'Admin'}
                        </td>
                        <td>
                          <span className="badge-pill badge-info" style={{ fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                            {u.plan || 'Standard'}
                          </span>
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>{u.joinedDate || '10/01/2026'}</td>
                        <td>
                          <span
                            className={`badge-pill ${u.status === 'Active' ? 'badge-success' : 'badge-warning'}`}
                            style={{
                              fontSize: '10.5px',
                              padding: '3px 8px',
                              whiteSpace: 'nowrap',
                              backgroundColor: (u.status === 'Pending' || u.status === 'Pending Approval') ? '#fef3c7' : undefined,
                              color: (u.status === 'Pending' || u.status === 'Pending Approval') ? '#b45309' : undefined,
                              border: (u.status === 'Pending' || u.status === 'Pending Approval') ? '1px solid #fde68a' : undefined,
                              fontWeight: (u.status === 'Pending' || u.status === 'Pending Approval') ? 700 : 600
                            }}
                          >
                            {(u.status === 'Pending' || u.status === 'Pending Approval') ? 'Pending' : u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notifications & Updates Card */}
      <div className="updates-card-modern">
        <div className="updates-header-row">
          <div className="updates-title-group">
            <div className="updates-megaphone-icon">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="updates-main-heading">Notifications &amp; Updates</h2>
              <p className="updates-sub-heading">Platform announcements, tutorials, and compliance advisories broadcast to all trusts</p>
            </div>
          </div>
          <Link to="/superadmin/notifications" className="updates-view-all-btn">
            Manage Broadcasts &rarr;
          </Link>
        </div>

        <ul className="updates-timeline-modern">
          {notifications.map((n, idx) => (
            <li key={n._id || idx} className="update-row-item">
              <span className="update-bullet-icon">★</span>
              <div className="update-body">
                <span className="update-date-badge">{n.publishDate || '15/04/2026'} &rarr;</span>
                <span>
                  <strong>{n.title}:</strong> {n.message}
                </span>
                {n.actionLink && (
                  <a
                    href={n.actionLink}
                    target={n.actionLink.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="update-action-btn-link"
                  >
                    {n.actionText || 'View Details'}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
