import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Users, Trash2, Pencil, Sparkles, Plus, Mail, Phone, Shield, CheckCircle2, X } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

export default function StaffPage({ user: propUser }) {
  const navigate = useNavigate();

  // Get active logged-in user
  const activeUser = useMemo(() => {
    if (propUser && !isSuperUser(propUser)) return propUser;
    const trustSession = getTrustSession();
    return trustSession?.user || null;
  }, [propUser]);

  const trustEmail = activeUser?.email || '';
  const trustName = (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') || (!isSuperUser(activeUser) ? activeUser?.name : '') || '';
  const trustId = activeUser?._id || activeUser?.id || '';

  const [staff, setStaff] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Add / Edit Staff
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'Active'
  });

  // Stats from plan
  const [planStats, setPlanStats] = useState({
    planName: activeUser?.plan || 'Standard',
    ownerLogin: 1,
    staffAllowed: 5,
    createdStaff: 0,
    available: 5
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const queryParam = trustEmail ? `?trustEmail=${encodeURIComponent(trustEmail)}` : '';
      const targetUserId = trustEmail || trustId;
      const [staffRes, rolesRes, userRes] = await Promise.allSettled([
        fetch(`/api/staff${queryParam}`),
        fetch('/api/roles'),
        targetUserId ? fetch(`/api/users/${encodeURIComponent(targetUserId)}`) : Promise.resolve(null)
      ]);

      let staffData = [];
      if (staffRes.status === 'fulfilled' && staffRes.value) {
        const d = await staffRes.value.json();
        if (d.success && Array.isArray(d.data)) {
          staffData = d.data;
          setStaff(staffData);
        }
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value) {
        const rData = await rolesRes.value.json();
        let apiRoles = [];
        if (rData.success && Array.isArray(rData.data)) {
          apiRoles = rData.data.map(r => r.roleName).filter(Boolean);
        }
        try {
          const localRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
          localRoles.forEach(r => {
            if (r?.roleName && !apiRoles.includes(r.roleName)) {
              apiRoles.push(r.roleName);
            }
          });
        } catch (e) {}

        const uniqueRoles = Array.from(new Set(apiRoles));
        setRolesList(uniqueRoles);
      }

      let currentPlan = activeUser?.plan || 'Standard';
      let extraUsers = Number(activeUser?.extraStaffUsers || activeUser?.purchasedStaffUsers || 0);

      if (userRes.status === 'fulfilled' && userRes.value) {
        try {
          const uData = await userRes.value.json();
          const liveUser = uData?.data || uData?.user || (uData?.email ? uData : null);
          if (liveUser) {
            if (liveUser.plan) currentPlan = liveUser.plan;
            extraUsers = Number(liveUser.extraStaffUsers || liveUser.purchasedStaffUsers || 0);
          }
        } catch (e) {}
      }

      const planLower = (currentPlan || '').toLowerCase();
      let baseAllowed = 4; // Standard plan default is 4
      if (planLower.includes('enterprise')) baseAllowed = 999;
      else if (planLower.includes('advanced')) baseAllowed = 9;
      else if (planLower.includes('starter')) baseAllowed = 1;
      else baseAllowed = 4; // Standard plan is 4

      const totalAllowed = baseAllowed === 999 ? 999 : (baseAllowed + extraUsers);
      const availableCount = baseAllowed === 999 ? 'Unlimited' : Math.max(0, totalAllowed - staffData.length);

      setPlanStats({
        planName: currentPlan,
        ownerLogin: 1,
        staffAllowed: totalAllowed === 999 ? 'Unlimited' : totalAllowed,
        createdStaff: staffData.length,
        available: availableCount
      });
    } catch (e) {
      console.error('Error fetching staff:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [trustEmail]);

  const handleOpenAddModal = () => {
    // Check if staff member limit reached for current plan
    if (planStats.staffAllowed !== 'Unlimited' && planStats.staffAllowed !== 999 && staff.length >= planStats.staffAllowed) {
      setPopup({
        isOpen: true,
        type: 'warning',
        title: 'Staff Member Limit Reached',
        message: `You have reached the maximum allowed limit of ${planStats.staffAllowed} staff member(s) for your ${planStats.planName} plan. To add more staff members, please purchase additional users via "Buy Users" or upgrade your plan.`,
        confirmText: '₹ Buy Users',
        cancelText: 'Close',
        showCancel: true,
        onConfirm: () => {
          setPopup(p => ({ ...p, isOpen: false }));
          navigate('/trust/buy-staff-users');
        },
        onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    const initialRole = rolesList.length > 0 ? rolesList[0] : '';
    setEditingStaff(null);
    setFieldErrors({});
    setStaffFormData({
      name: '',
      email: '',
      phone: '',
      role: initialRole,
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingStaff(s);
    setFieldErrors({});
    setStaffFormData({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      role: s.role || (rolesList.length > 0 ? rolesList[0] : ''),
      status: s.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    setStaffFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getFieldInputStyle = (fieldName, extraStyle = {}) => {
    const hasError = Boolean(fieldErrors[fieldName]);
    return {
      width: '100%',
      border: hasError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
      backgroundColor: hasError ? '#fef2f2' : '#ffffff',
      boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
      outline: 'none',
      transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      ...extraStyle
    };
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    const errors = {};

    const cleanName = (staffFormData.name || '').trim();
    const emailToValidate = (staffFormData.email || '').trim().toLowerCase();
    const phoneToValidate = (staffFormData.phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanName) {
      errors.name = 'Full Name is required.';
    } else if (!/^[a-zA-Z\s.]+$/.test(cleanName)) {
      errors.name = 'Name should only contain letters and spaces (no numbers or special characters).';
    }

    if (!emailToValidate) {
      errors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate)) {
      errors.email = 'Please enter a valid email address (e.g. staff@example.com).';
    } else {
      // Check if duplicate of another staff member's email
      const isDuplicateEmail = staff.some(s => {
        if (editingStaff && (s._id === editingStaff._id || s.id === editingStaff.id)) return false;
        return (s.email || '').trim().toLowerCase() === emailToValidate;
      });
      if (isDuplicateEmail) {
        errors.email = 'A staff member with this email address already exists.';
      } else if (trustEmail && trustEmail.toLowerCase() === emailToValidate) {
        errors.email = 'This email is already in use by the Trust Admin account.';
      }
    }

    if (!phoneToValidate) {
      errors.phone = 'Mobile number is required.';
    } else if (phoneToValidate.length !== 10) {
      errors.phone = 'Mobile number must be exactly 10 digits.';
    } else if (!/^[6-9]\d{9}$/.test(phoneToValidate)) {
      errors.phone = 'Mobile number must start with 6, 7, 8, or 9.';
    } else {
      // Check if duplicate of another staff member's mobile
      const isDuplicatePhone = staff.some(s => {
        if (editingStaff && (s._id === editingStaff._id || s.id === editingStaff.id)) return false;
        const sPhone = (s.phone || '').replace(/\D/g, '').slice(-10);
        return sPhone === phoneToValidate;
      });
      if (isDuplicatePhone) {
        errors.phone = 'A staff member with this mobile number already exists.';
      } else if (activeUser?.mobile && activeUser.mobile.replace(/\D/g, '').slice(-10) === phoneToValidate) {
        errors.phone = 'This mobile number is already in use by the Trust Admin account.';
      }
    }

    let selectedRole = (staffFormData.role || '').trim();
    if (!selectedRole && rolesList.length > 0) {
      selectedRole = rolesList[0];
    }
    if (!selectedRole && rolesList.length === 0) {
      errors.role = 'Please add at least one role in Member Roles first.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Limit check for new staff addition
    if (!editingStaff && planStats.staffAllowed !== 'Unlimited' && planStats.staffAllowed !== 999 && staff.length >= planStats.staffAllowed) {
      setPopup({
        isOpen: true,
        type: 'warning',
        title: 'Staff Member Limit Reached',
        message: `You have reached your maximum limit of ${planStats.staffAllowed} staff member(s) for your ${planStats.planName} plan. Please purchase additional users to add more staff.`,
        confirmText: '₹ Buy Users',
        cancelText: 'Close',
        showCancel: true,
        onConfirm: () => {
          setPopup(p => ({ ...p, isOpen: false }));
          navigate('/trust/buy-staff-users');
        },
        onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    try {
      const url = editingStaff ? `/api/staff/${editingStaff._id}` : '/api/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const payload = {
        ...staffFormData,
        role: selectedRole || staffFormData.role || 'Staff Member',
        trustEmail: trustEmail || editingStaff?.trustEmail || '',
        trustName: trustName || editingStaff?.trustName || '',
        trustId: trustId || editingStaff?.trustId || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setModalOpen(false);
        fetchStaff();
        setPopup({
          isOpen: true,
          type: 'success',
          title: editingStaff ? 'Staff Updated' : 'Staff Added',
          message: editingStaff ? 'Staff member details updated successfully.' : 'New staff member has been added to your trust.',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      } else {
        const errMsg = data.message || (editingStaff ? 'Could not update staff member.' : 'Could not add staff member.');
        const errLower = errMsg.toLowerCase();

        const backendFieldErrors = {};
        if (errLower.includes('email')) {
          backendFieldErrors.email = errMsg;
        }
        if (errLower.includes('mobile') || errLower.includes('phone')) {
          backendFieldErrors.phone = errMsg;
        }
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors(prev => ({ ...prev, ...backendFieldErrors }));
        }

        setPopup({
          isOpen: true,
          type: 'error',
          title: editingStaff ? 'Update Failed' : 'Add Staff Failed',
          message: errMsg,
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      console.error('Error saving staff:', err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to the server to save staff member.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const handleDelete = (id, name) => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Remove Staff Member?',
      message: `Are you sure you want to remove staff member "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await fetch(`/api/staff/${id}`, { method: 'DELETE' });
          fetchStaff();
        } catch (e) {
          console.error('Error deleting staff member:', e);
        }
        setPopup(p => ({ ...p, isOpen: false }));
      },
      onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staff;
    const term = searchTerm.toLowerCase();
    return staff.filter(s =>
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.role && s.role.toLowerCase().includes(term))
    );
  }, [staff, searchTerm]);

  const totalEntries = filteredStaff.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredStaff.slice(startIndex, startIndex + entriesPerPage);

  const thStyle = {
    padding: '12px 16px',
    fontWeight: '700',
    color: '#212529',
    fontSize: '13.5px',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#ffffff'
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '13.5px',
    color: '#212529'
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '20px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>TEAM &amp; ACCESS</span>
          </div>
          <h1 className="mint-hero-title">All Staff Members</h1>
          <p className="mint-hero-subtitle">
            Assign roles, manage staff team credentials, and control access permissions.
          </p>
        </div>
        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={handleOpenAddModal}
            title="Add New Staff Member"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/buy-staff-users')}
            title="Buy Additional Staff Users"
          >
            <Users size={16} />
            <span>₹ Buy Users</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="mint-table-card-container">
        {/* Current Plan Strip */}
        <div
          style={{
            backgroundColor: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '13.5px',
            fontWeight: 500,
            color: '#0369a1',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <span>Current Plan: <strong style={{ color: '#0c4a6e' }}>{planStats.planName}</strong></span>
          <span style={{ color: '#7dd3fc' }}>|</span>
          <span>Owner Login: <strong style={{ color: '#0c4a6e' }}>{planStats.ownerLogin}</strong></span>
          <span style={{ color: '#7dd3fc' }}>|</span>
          <span>Staff Users Allowed: <strong style={{ color: '#0c4a6e' }}>{planStats.staffAllowed}</strong></span>
          <span style={{ color: '#7dd3fc' }}>|</span>
          <span>Created Staff: <strong style={{ color: '#0c4a6e' }}>{planStats.createdStaff}</strong></span>
          <span style={{ color: '#7dd3fc' }}>|</span>
          <span>Available: <strong style={{ color: '#0c4a6e' }}>{planStats.available}</strong></span>
        </div>

        {/* Entries & Search Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13.5px',
              color: '#475569'
            }}
          >
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13.5px',
              color: '#475569'
            }}
          >
            <label htmlFor="staff-search-input" style={{ fontWeight: 500 }}>Search:</label>
            <input
              id="staff-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search staff members..."
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                width: '220px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table table-mint" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '55px' }}>S.No</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Created At</th>
                <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                    Loading staff members...
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px 22px', color: '#555', fontSize: '13.5px' }}>
                    No staff members found. Click <strong>"Add Staff Member"</strong> to add your first team member.
                  </td>
                </tr>
              ) : (
                currentEntries.map((s, i) => (
                  <tr
                    key={s._id || i}
                    style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#fcfcfc'
                    }}
                  >
                    <td style={tdStyle}>{startIndex + i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#212529' }}>{s.name}</td>
                    <td style={tdStyle}>{s.email}</td>
                    <td style={{ ...tdStyle, color: '#555' }}>{s.phone || '—'}</td>
                    <td style={tdStyle}>
                      <span className="badge-pill badge-info">{s.role || 'Staff Member'}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#555' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : 'Today'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          title="Edit Staff"
                          onClick={() => handleOpenEditModal(s)}
                          style={{
                            background: '#f8f9fa',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#495057'
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete Staff"
                          onClick={() => handleDelete(s._id, s.name)}
                          style={{
                            background: '#f8f9fa',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#dc2626'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Info & Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '13px',
            color: '#666',
            marginTop: '16px'
          }}
        >
          <div>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 10px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                color: currentPage === 1 ? '#aaa' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '12.5px'
              }}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalEntries === 0}
              style={{
                padding: '4px 10px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === totalPages || totalEntries === 0 ? '#f5f5f5' : '#ffffff',
                color: currentPage === totalPages || totalEntries === 0 ? '#aaa' : '#333',
                cursor: currentPage === totalPages || totalEntries === 0 ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '12.5px'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="receipt-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="receipt-modal-dialog"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="receipt-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="receipt-modal-title">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                className="receipt-modal-close"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStaff} noValidate>
              <div className="receipt-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    className="trust-input"
                    style={getFieldInputStyle('name')}
                    value={staffFormData.name}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) {
                        return;
                      }
                      if (!/^[a-zA-Z\s.]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const raw = e.clipboardData.getData('text');
                      const cleaned = raw.replace(/[^a-zA-Z\s.]/g, '');
                      handleFieldChange('name', cleaned);
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                      handleFieldChange('name', cleaned);
                    }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ramesh@trust.org"
                    className="trust-input"
                    style={getFieldInputStyle('email')}
                    value={staffFormData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                  {fieldErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit mobile number (starts with 6-9)"
                    className="trust-input"
                    style={getFieldInputStyle('phone')}
                    value={staffFormData.phone}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) {
                        return;
                      }
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      } else if (!staffFormData.phone && !/^[6-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const raw = e.clipboardData.getData('text').replace(/\D/g, '');
                      const cleaned = raw.replace(/^[^6-9]+/, '').slice(0, 10);
                      handleFieldChange('phone', cleaned);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const cleaned = raw.replace(/^[^6-9]+/, '').slice(0, 10);
                      handleFieldChange('phone', cleaned);
                    }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: 0 }}>
                      Member Role <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        navigate('/trust/add-role');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00a651',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                      title="Add a new member role"
                    >
                      + Add Role
                    </button>
                  </div>
                  <select
                    className="trust-select"
                    style={getFieldInputStyle('role', { width: '100%', height: '40px' })}
                    value={staffFormData.role}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                  >
                    {rolesList.length === 0 ? (
                      <option value="" disabled>No member roles added yet</option>
                    ) : (
                      <>
                        {/* If editing staff has a role not in current rolesList, preserve it */}
                        {editingStaff?.role && !rolesList.includes(editingStaff.role) && (
                          <option value={editingStaff.role}>{editingStaff.role}</option>
                        )}
                        {rolesList.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {fieldErrors.role && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      {fieldErrors.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="receipt-modal-footer">
                <button
                  type="button"
                  className="btn-trust-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-trust-primary"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Themed Confirmation & Notification Modal */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onCancel={popup.onCancel}
      />
    </>
  );
}
