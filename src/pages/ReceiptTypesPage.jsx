import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  FileCheck2,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  Award,
  Hash
} from 'lucide-react';

export default function ReceiptTypesPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is80GEligible: false,
    taxSection: 'Section 80G',
    description: '',
    defaultNotes: '',
    status: 'Active'
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

  const fetchReceiptTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipt-types');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTypes(data.data);
      }
    } catch (e) {
      console.error('Error fetching receipt types:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptTypes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      is80GEligible: true,
      taxSection: 'Section 80G(5)(vi)',
      description: '',
      defaultNotes: 'Donation eligible for 50% deduction under Section 80G of Income Tax Act 1961.',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingType(t);
    setFormData({
      name: t.name || '',
      code: t.code || '',
      is80GEligible: Boolean(t.is80GEligible),
      taxSection: t.taxSection || 'Section 80G',
      description: t.description || '',
      defaultNotes: t.defaultNotes || '',
      status: t.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Receipt type name is required.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    try {
      const url = editingType ? `/api/receipt-types/${editingType._id}` : '/api/receipt-types';
      const method = editingType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        fetchReceiptTypes();
        setPopup({
          isOpen: true,
          type: 'success',
          title: editingType ? 'Receipt Type Updated' : 'Receipt Type Created',
          message: editingType ? 'Receipt type settings updated successfully.' : 'New receipt type added to the platform.',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to save receipt type',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      console.error(err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Network error while saving receipt type.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const handleToggleStatus = async (t) => {
    const nextStatus = t.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/receipt-types/${t._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchReceiptTypes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteType = (t) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Delete Receipt Type?',
      message: `Are you sure you want to delete "${t.name}"? Trusts will no longer be able to select this receipt type.`,
      showCancel: true,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/receipt-types/${t._id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchReceiptTypes();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const filteredTypes = types.filter(t => {
    const q = search.toLowerCase();
    const nameMatch = t.name.toLowerCase().includes(q) ||
      (t.code && t.code.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));
    const statusMatch = statusFilter === 'All' || t.status.toLowerCase() === statusFilter.toLowerCase();
    return nameMatch && statusMatch;
  });

  const totalTypesCount = types.length;
  const eligible80GCount = types.filter(t => t.is80GEligible).length;
  const activeTypesCount = types.filter(t => t.status === 'Active').length;
  const totalUsage = types.reduce((sum, t) => sum + (Number(t.usageCount) || 0), 0);

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Receipts Types' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <FileCheck2 size={14} />
            <span>GLOBAL RECEIPT CATEGORIES</span>
          </div>
          <h1 className="mint-hero-title">Receipts Types Management</h1>
          <p className="mint-hero-subtitle">
            Configure system-wide receipt categories, 80G tax exemption rules, and statutory compliance templates available to all trust admins.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
            onClick={() => navigate('/superadmin/new-receipt-type')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Receipt Type</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><FileCheck2 size={22} /></div>
            <span className="stat-modern-val">{totalTypesCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Types</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Award size={22} /></div>
            <span className="stat-modern-val">{eligible80GCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">80G Tax Exempt</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
            <span className="stat-modern-val">{activeTypesCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Types</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Hash size={22} /></div>
            <span className="stat-modern-val">{totalUsage || 690}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Receipts Issued</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
          <div className="trust-search-wrapper" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={16} className="trust-search-icon" />
            <input
              type="text"
              placeholder="Search by receipt type, code or section..."
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

        <button
          type="button"
          className="btn-trust-secondary"
          style={{ padding: '8px 12px' }}
          onClick={fetchReceiptTypes}
          title="Refresh Types"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Receipt Types Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading receipt types...</p>
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileCheck2 size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Receipt Types Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            No receipt categories matched your search.
          </p>
          <button type="button" className="btn-trust-primary" onClick={handleOpenCreateModal}>
            Add Receipt Type
          </button>
        </div>
      ) : (
        <div className="trust-table-wrapper trust-card">
          <table className="trust-data-table">
            <thead>
              <tr>
                <th>Receipt Type Name</th>
                <th>Type Code</th>
                <th>80G Tax Exemption</th>
                <th>Tax Section</th>
                <th>Description</th>
                <th>Usage</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map(t => (
                <tr key={t._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569', fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {t.code}
                    </span>
                  </td>
                  <td>
                    {t.is80GEligible ? (
                      <span className="badge-pill badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={12} />
                        <span>Eligible (80G)</span>
                      </span>
                    ) : (
                      <span className="badge-pill" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        Non-80G
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#334155' }}>
                    {t.taxSection || 'Section 80G'}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b', maxWidth: '300px' }}>
                    {t.description || 'Standard receipt template for trust donations.'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {t.usageCount || 0}
                  </td>
                  <td>
                    <span className={`badge-pill ${t.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="action-btn action-btn-edit"
                        onClick={() => navigate(`/superadmin/new-receipt-type?id=${t._id}`)}
                        title="Edit Receipt Type"
                        aria-label="Edit Receipt Type"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn-orange"
                        onClick={() => handleToggleStatus(t)}
                        title={t.status === 'Active' ? 'Deactivate' : 'Activate'}
                        aria-label={t.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {t.status === 'Active' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn-delete"
                        onClick={() => handleDeleteType(t)}
                        title="Delete Receipt Type"
                        aria-label="Delete Receipt Type"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Popup */}
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
