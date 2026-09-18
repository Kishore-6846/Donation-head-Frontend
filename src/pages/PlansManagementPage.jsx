import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw
} from 'lucide-react';

export default function PlansManagementPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

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

  const handleEditPlan = (plan) => {
    const planId = plan._id || plan.id || plan.code;
    navigate(`/superadmin/new-plan?id=${planId}`);
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
                    <strong style={{ color: '#0f172a' }}>{plan.staffUserLimit || '4 Staff Users'}</strong>
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

