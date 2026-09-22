import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  FileText,
  UserCheck,
  Eye,
  Globe,
  MapPin,
  Calendar,
  ChevronDown
} from 'lucide-react';

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openApprovalDropdown, setOpenApprovalDropdown] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    trustName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    password: '',
    registrationNo: '',
    panNo: '',
    fcraNo: '',
    section80GRegNo: '',
    plan: 'Standard',
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.approval-dropdown-container')) {
        setOpenApprovalDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      trustName: '',
      contactPerson: '',
      email: '',
      mobile: '',
      password: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
      registrationNo: 'REG-' + Date.now().toString().slice(-6),
      panNo: '',
      fcraNo: '',
      section80GRegNo: '',
      plan: 'Standard',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      trustName: u.trustName || u.name || '',
      contactPerson: u.contactPerson || '',
      email: u.email || '',
      mobile: u.mobile || '',
      password: '',
      registrationNo: u.registrationNo || '',
      panNo: u.panNo || '',
      fcraNo: u.fcraNo || '',
      section80GRegNo: u.section80GRegNo || '',
      plan: u.plan || 'Standard',
      status: u.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        handleCloseModal();
        fetchUsers();
        setPopup({
          isOpen: true,
          type: 'success',
          title: editingUser ? 'Updated Successfully' : 'Created Successfully',
          message: editingUser
            ? 'Trust admin details updated successfully.'
            : 'New trust organization created successfully with portal login access.',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: data.message || 'Operation failed',
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
        message: 'Network error occurred while saving user.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const handleApproveUser = async (u) => {
    setOpenApprovalDropdown(null);
    setPopup({
      isOpen: true,
      type: 'success',
      title: 'Approve Trust Account?',
      message: `Are you sure you want to approve "${u.trustName || u.name}"? This will activate their subscription (${u.plan || 'Standard'} Plan) and allow the admin to log in.`,
      showCancel: true,
      confirmText: 'Yes, Approve Now',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/users/${u._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Active' })
          });
          const data = await res.json();
          if (data.success) {
            fetchUsers();
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Account Approved!',
              message: `Trust account "${u.trustName || u.name}" is now Active. The admin can now log into their Admin Portal.`,
              confirmText: 'OK',
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          } else {
            setPopup({
              isOpen: true,
              type: 'error',
              title: 'Approval Failed',
              message: data.message || 'Could not update user status.',
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

  const handleRejectUser = (u) => {
    setOpenApprovalDropdown(null);
    setPopup({
      isOpen: true,
      type: 'info',
      title: 'Reject Trust Account',
      message: `Reject action for "${u.trustName || u.name}" will be configured soon.`,
      confirmText: 'OK',
      onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await fetch(`/api/users/${u._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = (u) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Remove Trust User?',
      message: `Are you sure you want to remove the trust account "${u.trustName || u.name}"?`,
      showCancel: true,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/users/${u._id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchUsers();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const nameMatch = (u.trustName && u.trustName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.contactPerson && u.contactPerson.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.mobile && u.mobile.includes(q)) ||
      (u.registrationNo && u.registrationNo.toLowerCase().includes(q));

    const planMatch = planFilter === 'All' || (u.plan && u.plan.toLowerCase() === planFilter.toLowerCase());
    const statusMatch = statusFilter === 'All' || (u.status && u.status.toLowerCase() === statusFilter.toLowerCase());
    return nameMatch && planMatch && statusMatch;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const pendingUsersCount = users.filter(u => u.status === 'Pending' || u.status === 'Pending Approval').length;
  const trialUsersCount = users.filter(u => u.status === 'Trial').length;
  const totalReceiptsIssued = users.reduce((acc, u) => acc + (Number(u.receiptsCount) || 0), 0);

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Users Management' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Users size={14} />
            <span>ORGANIZATIONS & TRUSTS DIRECTORY</span>
          </div>
          <h1 className="mint-hero-title">Users Management</h1>
          <p className="mint-hero-subtitle">
            Manage all registered Trust Admins and NGO organizations. Oversee plan assignments, status, registration credentials, and platform receipts.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
            onClick={() => navigate('/superadmin/new-user')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Pending Approvals Attention Banner */}
      {pendingUsersCount > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 10px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
                {pendingUsersCount} New Trust Admin Registration{pendingUsersCount > 1 ? 's' : ''} Awaiting Approval
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                Trust admins have paid for their subscriptions and cannot log in until Super Admin verification. Review and click "Approve" below.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-trust-primary"
            style={{
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              fontSize: '13px',
              padding: '8px 16px',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
            }}
            onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
          >
            {statusFilter === 'Pending' ? 'Show All Trusts' : 'View Pending Only'}
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green" onClick={() => setStatusFilter('All')} style={{ cursor: 'pointer' }}>
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Building size={22} /></div>
            <span className="stat-modern-val">{totalUsersCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Trusts</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer' }}>
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><UserCheck size={22} /></div>
            <span className="stat-modern-val">{activeUsersCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Trusts</span>
          </div>
        </div>

        <div
          className="stat-modern-card card-amber"
          onClick={() => setStatusFilter('Pending')}
          style={{ cursor: 'pointer', border: pendingUsersCount > 0 ? '2px solid #f59e0b' : undefined }}
        >
          <div className="stat-modern-top">
            <div className="stat-modern-icon" style={{ color: '#d97706' }}><Shield size={22} /></div>
            <span className="stat-modern-val" style={{ color: '#b45309' }}>{pendingUsersCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Pending</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><FileText size={22} /></div>
            <span className="stat-modern-val">{totalReceiptsIssued}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Receipts Issued</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div className="trust-search-wrapper" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} className="trust-search-icon" />
            <input
              type="text"
              placeholder="Search by Trust, Person, Email, Mobile, Reg No or Payment ID..."
              className="trust-input trust-search-input"
              style={{ width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="trust-select"
            style={{ width: '160px', height: '40px' }}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="All">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
          </select>
          <select
            className="trust-select"
            style={{ width: '170px', height: '40px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending ({pendingUsersCount})</option>
            <option value="Active">Active ({activeUsersCount})</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-trust-secondary"
          style={{ padding: '8px 12px' }}
          onClick={fetchUsers}
          title="Refresh Users"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading registered trusts and users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Users Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            No trust accounts match the filters provided.
          </p>
          <button type="button" className="btn-trust-primary" onClick={handleOpenCreateModal}>
            Add New User
          </button>
        </div>
      ) : (
        <div className="trust-table-wrapper trust-card">
          <table className="trust-data-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>S.No</th>
                <th>Trust</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Mobile No</th>
                <th>Plan</th>
                <th>Reg No</th>
                <th>PAN No</th>
                <th style={{ textAlign: 'center' }}>Receipts</th>
                <th style={{ textAlign: 'center' }}>Staff</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Approval</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => {
                const isPending = u.status === 'Pending' || u.status === 'Pending Approval';
                return (
                  <tr key={u._id} style={{ backgroundColor: isPending ? '#fffdf7' : undefined }}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.trustName || u.name}</div>
                    </td>
                    <td style={{ color: '#334155' }}>{u.contactPerson || u.name || 'Admin'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a' }}>
                        <Mail size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      {u.mobile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                          <Phone size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                          <span>{u.mobile}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge-pill badge-info" style={{ fontWeight: 600 }}>
                        {u.plan || 'Standard'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
                        {u.registrationNo || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
                        {u.panNo || '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>{u.receiptsCount || 0}</td>
                    <td style={{ fontWeight: 600, color: '#10b981', textAlign: 'center' }}>{u.staffCount || 0}</td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>{u.joinedDate || '10/01/2026'}</td>
                    <td>
                      {isPending ? (
                        <span className="badge-pill badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Pending
                        </span>
                      ) : (
                        <span className={`badge-pill ${u.status === 'Active' ? 'badge-success' : (u.status === 'Trial' ? 'badge-warning' : 'badge-danger')}`} style={{ whiteSpace: 'nowrap' }}>
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isPending ? (
                        <div className="approval-dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            style={{
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: '1px solid #047857',
                              padding: '5px 10px',
                              height: '30px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              fontWeight: 700,
                              fontSize: '12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenApprovalDropdown(openApprovalDropdown === u._id ? null : u._id);
                            }}
                            title="Approval Options"
                          >
                            <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                            <span>Approval</span>
                            <ChevronDown
                              size={12}
                              style={{
                                transform: openApprovalDropdown === u._id ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.15s ease'
                              }}
                            />
                          </button>

                          {openApprovalDropdown === u._id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                zIndex: 100,
                                minWidth: '130px',
                                padding: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                textAlign: 'left'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: 'none',
                                  background: 'none',
                                  borderRadius: '5px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  color: '#059669',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  textAlign: 'left'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                onClick={() => {
                                  setOpenApprovalDropdown(null);
                                  handleApproveUser(u);
                                }}
                              >
                                <CheckCircle2 size={14} style={{ color: '#059669' }} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: 'none',
                                  background: 'none',
                                  borderRadius: '5px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  textAlign: 'left'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                onClick={() => {
                                  setOpenApprovalDropdown(null);
                                  handleRejectUser(u);
                                }}
                              >
                                <XCircle size={14} style={{ color: '#dc2626' }} />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => navigate(`/superadmin/users/${u._id}`)}
                          title="View Trust Details & Statistics"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => navigate(`/superadmin/new-user?id=${u._id}`)}
                          title="Edit User Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'Active' ? 'Suspend Trust' : 'Activate Trust'}
                        >
                          {u.status === 'Active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                        <button
                          type="button"
                          className="btn-table-action delete"
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
