import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Check,
  Zap,
  RefreshCw,
  Users,
  Building,
  ArrowLeft,
  Phone,
  Mail,
  Eye,
  CreditCard
} from 'lucide-react';

export default function PlansManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Selected Plan for Subscribed Trusts View (driven by URL query param ?trusts=PlanName)
  const planTrustsQuery = searchParams.get('trusts');
  const [activePlanTrusts, setActivePlanTrusts] = useState(null);
  const [trustsList, setTrustsList] = useState([]);
  const [loadingTrusts, setLoadingTrusts] = useState(false);
  const [trustSearch, setTrustSearch] = useState('');
  const [trustStatusFilter, setTrustStatusFilter] = useState('All');
  const [trustNameFilter, setTrustNameFilter] = useState('All');

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

  const getPlanBaseStaffQuota = (planObj) => {
    if (!planObj) return 1;
    const limitStr = String(planObj.staffUserLimit || '');
    const numMatch = limitStr.match(/\d+/);
    if (numMatch) {
      return parseInt(numMatch[0], 10);
    }
    const nameLower = String(planObj.name || '').toLowerCase();
    if (nameLower.includes('basic') || nameLower.includes('starter')) return 1;
    if (nameLower.includes('standard')) return 2;
    if (nameLower.includes('advanced')) return 9;
    if (nameLower.includes('enterprise')) return 999;
    return 1;
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPlans(data.data);
      }
    } catch (e) {
      console.error('Error fetching plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const loadTrustsData = async (plan) => {
    setLoadingTrusts(true);
    setTrustSearch('');
    setTrustStatusFilter('All');
    setTrustNameFilter('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const planName = plan.name || '';
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const pLower = planName.toLowerCase().trim();
        const matched = data.data.filter(u => {
          const userPlan = (u.plan || 'Standard').toLowerCase().trim();
          if (pLower.includes('basic') || pLower.includes('starter')) {
            return userPlan.includes('basic') || userPlan.includes('starter');
          }
          if (pLower.includes('standard')) {
            return userPlan.includes('standard') || userPlan.includes('advanced') || userPlan.includes('enterprise');
          }
          return userPlan === pLower;
        });
        setTrustsList(matched);
      } else {
        setTrustsList([]);
      }
    } catch (e) {
      console.error('Error fetching trusts for plan:', e);
      setTrustsList([]);
    } finally {
      setLoadingTrusts(false);
    }
  };

  // Sync activePlanTrusts state with URL query ?trusts=PlanName
  useEffect(() => {
    if (!planTrustsQuery) {
      setActivePlanTrusts(null);
      setTrustsList([]);
      setTrustSearch('');
      setTrustNameFilter('All');
    } else {
      const targetQuery = planTrustsQuery.trim();
      const matchedPlan = plans.find(p =>
        (p.name && p.name.toLowerCase() === targetQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === targetQuery.toLowerCase()) ||
        (p._id && p._id.toLowerCase() === targetQuery.toLowerCase())
      );

      const targetPlanObj = matchedPlan || {
        name: targetQuery,
        price: targetQuery.toLowerCase().includes('basic') ? 1200 : 2500,
        staffUserLimit: targetQuery.toLowerCase().includes('basic') ? '1 Staff User' : '2 Staff Users'
      };

      setActivePlanTrusts(targetPlanObj);
      loadTrustsData(targetPlanObj);
    }
  }, [planTrustsQuery, plans, location.pathname, location.search]);

  const handleEditPlan = (plan) => {
    const planId = plan._id || plan.id || plan.code;
    navigate(`/superadmin/new-plan?id=${planId}`);
  };

  const handleOpenTrustList = (plan) => {
    navigate(`/superadmin/plans?trusts=${encodeURIComponent(plan.name || plan.code)}`);
  };

  const handleBackToPlans = () => {
    navigate('/superadmin/plans');
  };

  const handleToggleStatus = async (plan) => {
    const planId = plan._id || plan.id || plan.code;
    const nextStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = (plan) => {
    const planId = plan._id || plan.id || plan.code;
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`,
      showCancel: true,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchPlans();
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Plan Deleted',
              message: 'The plan was deleted successfully.',
              confirmText: 'OK',
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || (p.status && p.status.toLowerCase() === statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter(p => p.status === 'Active').length;

  // ==========================================
  // VIEW 2: SUB-VIEW - SUBSCRIBED TRUSTS LIST
  // ==========================================
  if (activePlanTrusts) {
    const planPrice = Number(activePlanTrusts.price) || 0;
    const sTerm = (trustSearch || '').toLowerCase().trim();

    const uniqueTrustNames = Array.from(
      new Set(trustsList.map(t => t.trustName || t.name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const filteredTrusts = trustsList.filter(t => {
      const matchesSearch =
        !sTerm ||
        (t.trustName && t.trustName.toLowerCase().includes(sTerm)) ||
        (t.name && t.name.toLowerCase().includes(sTerm)) ||
        (t.contactPerson && t.contactPerson.toLowerCase().includes(sTerm)) ||
        (t.email && t.email.toLowerCase().includes(sTerm)) ||
        (t.mobile && t.mobile.toLowerCase().includes(sTerm)) ||
        (t.phone && t.phone.toLowerCase().includes(sTerm));

      const matchesStatus =
        trustStatusFilter === 'All' ||
        (t.status && t.status.toLowerCase() === trustStatusFilter.toLowerCase());

      const matchesTrust =
        trustNameFilter === 'All' ||
        (t.trustName || t.name || '') === trustNameFilter;

      return matchesSearch && matchesStatus && matchesTrust;
    });

    const totalSubscribedTrusts = trustsList.length;
    const activeSubscribedTrusts = trustsList.filter(t => (t.status || 'Active').toLowerCase() === 'active').length;
    const totalPlanRevenue = trustsList.reduce((sum, t) => {
      const paid = Number(t.paidAmount);
      return sum + (!isNaN(paid) && paid > 0 ? paid : planPrice);
    }, 0);

    const baseAllowed = getPlanBaseStaffQuota(activePlanTrusts);

    return (
      <div className="dashboard-container-modern">
        <Breadcrumb
          items={[
            { label: 'Super Admin', link: '/superadmin' },
            { label: 'Plans Management', link: '/superadmin/plans', onClick: handleBackToPlans },
            { label: `${activePlanTrusts.name} Subscribed Trusts` }
          ]}
        />

        {/* Hero Header */}
        <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
          <div className="mint-hero-left">
            <div className="mint-hero-badge">
              <Users size={14} />
              <span>PLAN SUBSCRIBED TRUSTS DIRECTORY</span>
            </div>
            <h1 className="mint-hero-title">
              {activePlanTrusts.name} Plan — Subscribed Trusts
            </h1>
            <p className="mint-hero-subtitle">
              Detailed breakdown of all trusts, NGOs, and admin organizations currently subscribed to the {activePlanTrusts.name} plan, including quota usage and subscription revenue collected.
            </p>
          </div>
          <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-trust-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', backgroundColor: '#ffffff' }}
              onClick={handleBackToPlans}
            >
              <ArrowLeft size={16} />
              <span>Back to All Plans</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
          <div className="stat-modern-card card-blue">
            <div className="stat-modern-top">
              <div className="stat-modern-icon"><Users size={22} /></div>
              <span className="stat-modern-val">{totalSubscribedTrusts}</span>
            </div>
            <div className="stat-modern-bottom">
              <span className="stat-modern-title">Subscribed Trusts</span>
            </div>
          </div>

          <div className="stat-modern-card card-green">
            <div className="stat-modern-top">
              <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
              <span className="stat-modern-val">{activeSubscribedTrusts}</span>
            </div>
            <div className="stat-modern-bottom">
              <span className="stat-modern-title">Active Subscriptions</span>
            </div>
          </div>

          <div className="stat-modern-card card-amber">
            <div className="stat-modern-top">
              <div className="stat-modern-icon"><CreditCard size={22} /></div>
              <span className="stat-modern-val">₹{planPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-modern-bottom">
              <span className="stat-modern-title">Annual Rate / Year</span>
            </div>
          </div>

          <div className="stat-modern-card card-green" style={{ border: '1.5px solid #10b981', backgroundColor: '#f0fdf4' }}>
            <div className="stat-modern-top">
              <div className="stat-modern-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                <Zap size={22} />
              </div>
              <span className="stat-modern-val" style={{ color: '#15803d' }}>
                ₹{totalPlanRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="stat-modern-bottom">
              <span className="stat-modern-title" style={{ color: '#166534', fontWeight: 600 }}>
                Total Plan Revenue
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div className="trust-search-wrapper" style={{ width: '100%', maxWidth: '360px' }}>
              <Search size={16} className="trust-search-icon" />
              <input
                type="text"
                placeholder="Search trust by organization name, admin, email, or mobile..."
                className="trust-input trust-search-input"
                style={{ width: '100%' }}
                value={trustSearch}
                onChange={(e) => setTrustSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="trust-select"
              style={{ width: '150px', height: '40px' }}
              value={trustStatusFilter}
              onChange={(e) => setTrustStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active ({activeSubscribedTrusts})</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Trust Name Filter */}
            <select
              className="trust-select"
              style={{ width: '180px', height: '40px' }}
              value={trustNameFilter}
              onChange={(e) => setTrustNameFilter(e.target.value)}
            >
              <option value="All">All Trusts ({trustsList.length})</option>
              {uniqueTrustNames.map(tName => (
                <option key={tName} value={tName}>
                  {tName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-trust-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => loadTrustsData(activePlanTrusts)}
              title="Refresh Trusts List"
            >
              <RefreshCw size={15} style={{ marginRight: '6px' }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Main Trusts Table */}
        {loadingTrusts ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            <p>Loading subscribed trusts for {activePlanTrusts.name} plan...</p>
          </div>
        ) : filteredTrusts.length === 0 ? (
          <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Building size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              No Trusts Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {trustSearch || trustStatusFilter !== 'All' || trustNameFilter !== 'All'
                ? 'No trusts match your current filter criteria.'
                : `There are currently no trusts subscribed to the ${activePlanTrusts.name} plan.`}
            </p>
            <button type="button" className="btn-trust-secondary" onClick={handleBackToPlans}>
              Return to Plans Management
            </button>
          </div>
        ) : (
          <div className="trust-table-wrapper trust-card">
            <table className="trust-data-table">
              <thead>
                <tr>
                  <th style={{ width: '55px' }}>S.No</th>
                  <th>Trust Organization &amp; Admin</th>
                  <th>Contact Email &amp; Phone</th>
                  <th style={{ textAlign: 'center' }}>Staff Users</th>
                  <th>Plan Revenue / Paid</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrusts.map((trust, idx) => {
                  const trustId = trust._id || trust.id;
                  const tName = trust.trustName || trust.name || 'Trust Organization';
                  const cPerson = trust.contactPerson || trust.name || 'Admin';
                  const phone = trust.mobile || trust.phone || '—';
                  const email = trust.email || '—';
                  const status = trust.status || 'Active';
                  const paidAmount = Number(trust.paidAmount) || planPrice;
                  const joined = trust.joinedDate || (trust.createdAt ? new Date(trust.createdAt).toLocaleDateString('en-GB') : '—');

                  const currentStaff = Number(trust.staffCount) || 0;
                  const isExceeded = currentStaff > baseAllowed;

                  return (
                    <tr key={trustId || idx}>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{tName}</div>
                        <span style={{ fontSize: '12.5px', color: '#64748b' }}>Admin: {cPerson}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>{email}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{phone}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          {isExceeded ? (
                            <span style={{ color: '#dc2626', fontWeight: 800 }}>{currentStaff}</span>
                          ) : (
                            <span>{currentStaff}</span>
                          )}
                          /{baseAllowed} staff
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '14px' }}>
                          ₹{paidAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{joined}</td>
                      <td>
                        <span className={`badge-pill ${status.toLowerCase() === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-trust-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => navigate(`/superadmin/users/${trustId}`)}
                          title="View Complete Trust Details"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 1: MAIN PLANS OVERVIEW
  // ==========================================
  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Plans Management' }]} />

      {/* Header Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Boxes size={14} />
            <span>SUBSCRIPTION PACKAGES</span>
          </div>
          <h1 className="mint-hero-title">Plans Management</h1>
          <p className="mint-hero-subtitle">
            Create, configure, and manage dynamic subscription plans. What you configure here is directly available in the Admin Upgrade Plan portal.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
            onClick={() => navigate('/superadmin/new-plan')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Boxes size={22} /></div>
            <span className="stat-modern-val">{totalPlansCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Plans</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
            <span className="stat-modern-val">{activePlansCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Plans</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Zap size={22} /></div>
            <span className="stat-modern-val">{plans.filter(p => p.billingCycle === 'Annual').length}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Annual Cycles</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Sparkles size={22} /></div>
            <span className="stat-modern-val">{plans.filter(p => p.badge).length}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Featured Badges</span>
          </div>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div className="trust-search-wrapper" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={16} className="trust-search-icon" />
            <input
              type="text"
              placeholder="Search plan by name or description..."
              className="trust-input trust-search-input"
              style={{ width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="trust-select"
            style={{ width: '160px', height: '40px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={viewMode === 'cards' ? 'btn-trust-primary' : 'btn-trust-secondary'}
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={() => setViewMode('cards')}
          >
            Grid View
          </button>
          <button
            type="button"
            className={viewMode === 'table' ? 'btn-trust-primary' : 'btn-trust-secondary'}
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ padding: '8px 12px' }}
            onClick={fetchPlans}
            title="Refresh Plans"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Content: Cards or Table View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading subscription plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Boxes size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Plans Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            No plans match your current search criteria.
          </p>
          <button type="button" className="btn-trust-primary" onClick={() => navigate('/superadmin/new-plan')}>
            Create New Plan
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredPlans.map(plan => (
            <div
              key={plan._id}
              className="trust-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                border: plan.badge ? '2px solid #10b981' : '1px solid #e2e8f0',
                position: 'relative',
                borderRadius: '12px'
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{plan.name}</h3>
                  <span className={`badge-pill ${plan.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {plan.status}
                  </span>
                </div>

                {plan.description && (
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
                    {plan.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>₹{Number(plan.price || 0).toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>/ {plan.billingCycle || 'Year'}</span>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '12px 0', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                    <span>Receipt Limit:</span>
                    <strong style={{ color: '#0f172a' }}>{plan.receiptLimit || 'Unlimited'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                    <span>Staff Users:</span>
                    <strong style={{ color: '#0f172a' }}>{plan.staffUserLimit || '2 Staff Users'}</strong>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                  {plan.features && plan.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                      <Check size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn-trust-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleEditPlan(plan)}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn-trust-secondary"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  onClick={() => handleToggleStatus(plan)}
                  title={plan.status === 'Active' ? 'Deactivate Plan' : 'Activate Plan'}
                >
                  {plan.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="btn-trust-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    borderColor: '#bae6fd',
                    backgroundColor: '#f0f9ff'
                  }}
                  onClick={() => handleOpenTrustList(plan)}
                  title="View Subscribed Trusts & Plan Revenue"
                >
                  <Users size={14} />
                </button>
                <button
                  type="button"
                  className="btn-trust-danger"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  onClick={() => handleDeletePlan(plan)}
                  title="Delete Plan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trust-table-wrapper trust-card">
          <table className="trust-data-table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Price (₹)</th>
                <th>Billing Cycle</th>
                <th>Staff Quota</th>
                <th>Receipt Quota</th>
                <th>Badge</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => (
                <tr key={plan._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{plan.name}</div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Code: {plan.code}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                  </td>
                  <td>{plan.billingCycle || 'Annual'} ({plan.validityDays} days)</td>
                  <td>{plan.staffUserLimit}</td>
                  <td>{plan.receiptLimit}</td>
                  <td>
                    {plan.badge ? (
                      <span className="badge-pill badge-info">{plan.badge}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>&mdash;</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge-pill ${plan.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleEditPlan(plan)}
                        title="Edit Plan"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleToggleStatus(plan)}
                        title={plan.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {plan.status === 'Active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                      <button
                        type="button"
                        className="btn-table-action"
                        style={{ color: '#0284c7' }}
                        onClick={() => handleOpenTrustList(plan)}
                        title="View Subscribed Trusts & Plan Revenue"
                      >
                        <Users size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-table-action delete"
                        onClick={() => handleDeletePlan(plan)}
                        title="Delete Plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Confirmation / Notice Popup */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        showCancel={popup.showCancel}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
