import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Users, Trash2, Pencil, Sparkles, Plus, Mail, Phone, Shield, CheckCircle2, X, Filter, RotateCcw } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

// Format date accurately to Indian Standard Time (IST - Asia/Kolkata): DD-MM-YYYY hh:mm:ss AM/PM
const formatToIST = (dateInput) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/.test(dateInput.trim())) {
    const [dPart, tPart] = dateInput.trim().split(' ');
    const [day, month, year] = dPart.split('-');
    const [hh, mm, ss] = tPart.split(':');
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const strH = String(h).padStart(2, '0');
    return `${day}-${month}-${year} ${strH}:${mm}:${ss} ${ampm}`;
  }

  if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)$/i.test(dateInput.trim())) {
    return dateInput.trim().toUpperCase();
  }

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).formatToParts(d);

    let day = '', month = '', year = '', hour = '', minute = '', second = '', dayPeriod = '';
    for (const p of parts) {
      if (p.type === 'day') day = p.value;
      else if (p.type === 'month') month = p.value;
      else if (p.type === 'year') year = p.value;
      else if (p.type === 'hour') hour = p.value;
      else if (p.type === 'minute') minute = p.value;
      else if (p.type === 'second') second = p.value;
      else if (p.type === 'dayPeriod') dayPeriod = p.value;
    }

    const strHour = String(hour).padStart(2, '0');
    const strMin = String(minute).padStart(2, '0');
    const strSec = String(second).padStart(2, '0');
    const ampm = (dayPeriod || (d.getHours() >= 12 ? 'PM' : 'AM')).toUpperCase();

    return `${day}-${month}-${year} ${strHour}:${strMin}:${strSec} ${ampm}`;
  } catch (e) {
    const d = new Date(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
  }
};

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
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [appliedFilter, setAppliedFilter] = useState({ search: '', role: '' });
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
  const [toastMessage, setToastMessage] = useState('');

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
        fetch(`/api/roles${queryParam}`),
        targetUserId ? fetch(`/api/users/${encodeURIComponent(targetUserId)}`) : Promise.resolve(null)
      ]);

      let staffData = [];
      if (staffRes.status === 'fulfilled' && staffRes.value && staffRes.value.ok) {
        try {
          const d = await staffRes.value.json();
          if (d.success && Array.isArray(d.data)) {
            staffData = d.data;
            setStaff(staffData);
          }
        } catch (e) {}
      }

      let apiRoles = [];
      if (rolesRes.status === 'fulfilled' && rolesRes.value && rolesRes.value.ok) {
        try {
          const rData = await rolesRes.value.json();
          if (rData.success && Array.isArray(rData.data)) {
            apiRoles = rData.data.map(r => r.roleName).filter(Boolean);
          }
        } catch (e) {}
      }

      // Merge with localStorage custom_roles (scoped to this trust)
      const roleStorageKey = trustEmail ? `custom_roles_${trustEmail.toLowerCase()}` : 'custom_roles';
      try {
        const localRoles = JSON.parse(localStorage.getItem(roleStorageKey) || '[]');
        localRoles.forEach(r => {
          if (r?.roleName && !apiRoles.some(ar => ar.trim().toLowerCase() === r.roleName.trim().toLowerCase())) {
            apiRoles.push(r.roleName);
          }
        });
      } catch (e) {}

      // Deduplicate roles case-insensitively
      const roleMap = new Map();
      apiRoles.forEach(rName => {
        if (rName && typeof rName === 'string' && rName.trim()) {
          const key = rName.trim().toLowerCase();
          if (!roleMap.has(key)) {
            roleMap.set(key, rName.trim());
          }
        }
      });
      const uniqueRoles = Array.from(roleMap.values());
      setRolesList(uniqueRoles);

      let currentPlan = activeUser?.plan || 'Standard';
      let extraUsers = Number(activeUser?.extraStaffUsers || activeUser?.purchasedStaffUsers || 0);

      if (userRes.status === 'fulfilled' && userRes.value && userRes.value.ok) {
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
      let baseAllowed = 2; // Standard plan default is 2
      if (planLower.includes('basic') || planLower.includes('starter')) {
        baseAllowed = 1;
      } else if (planLower.includes('standard')) {
        baseAllowed = 2;
      } else if (planLower.includes('advanced')) {
        baseAllowed = 9;
      } else if (planLower.includes('enterprise')) {
        baseAllowed = 999;
      } else {
        baseAllowed = 2;
      }

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
      try {
        const roleStorageKey = trustEmail ? `custom_roles_${trustEmail.toLowerCase()}` : 'custom_roles';
        const localRoles = JSON.parse(localStorage.getItem(roleStorageKey) || '[]');
        const extracted = localRoles.map(r => r?.roleName).filter(Boolean);
        if (extracted.length > 0) setRolesList(extracted);
      } catch (err) {}
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

    // Refresh role list from state and local storage immediately
    let currentRoles = [...rolesList];
    try {
      const roleStorageKey = trustEmail ? `custom_roles_${trustEmail.toLowerCase()}` : 'custom_roles';
      const localRoles = JSON.parse(localStorage.getItem(roleStorageKey) || '[]');
      localRoles.forEach(r => {
        if (r?.roleName && !currentRoles.some(cr => cr.trim().toLowerCase() === r.roleName.trim().toLowerCase())) {
          currentRoles.push(r.roleName);
        }
      });
    } catch (e) {}

    const safeMap = new Map();
    currentRoles.forEach(rName => {
      if (rName && typeof rName === 'string' && rName.trim()) {
        const key = rName.trim().toLowerCase();
        if (!safeMap.has(key)) {
          safeMap.set(key, rName.trim());
        }
      }
    });
    const safeRoles = Array.from(safeMap.values());
    if (safeRoles.length > 0) {
      setRolesList(safeRoles);
    }

    setEditingStaff(null);
    setFieldErrors({});
    setStaffFormData({
      name: '',
      email: '',
      phone: '',
      role: safeRoles.length > 0 ? safeRoles[0] : '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (staffMember) => {
    setEditingStaff(staffMember);
    setFieldErrors({});
    setStaffFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      phone: (staffMember.phone || '').replace(/\D/g, '').slice(-10),
      role: staffMember.role || (rolesList.length > 0 ? rolesList[0] : ''),
      status: staffMember.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (staffMember) => {
    const targetId = String(staffMember._id || staffMember.id || '');
    const currentStatus = staffMember.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // If attempting to activate, verify that assigned role exists in Member Roles
    if (newStatus === 'Active') {
      const assignedRole = (staffMember.role || '').trim();
      const roleExists = rolesList.some(r =>
        (typeof r === 'string' ? r : r.roleName || '').trim().toLowerCase() === assignedRole.toLowerCase()
      );

      if (!roleExists) {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Cannot Activate Staff Member',
          message: `Cannot activate "${staffMember.name}" because their assigned role "${assignedRole || 'Unknown'}" does not exist in Member Roles. Please recreate this role in Member Roles or edit this staff member to assign an existing active role.`,
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
        return;
      }
    }

    // Optimistically update ONLY this specific target staff member
    setStaff(prev => prev.map(s => {
      const isMatch = (targetId && (String(s._id) === targetId || String(s.id) === targetId)) ||
                      (staffMember.email && s.email && s.email.toLowerCase() === staffMember.email.toLowerCase());
      return isMatch ? { ...s, status: newStatus } : s;
    }));

    try {
      const res = await fetch(`/api/staff/${encodeURIComponent(targetId || staffMember.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Staff "${staffMember.name}" marked as ${newStatus}!`);
        setTimeout(() => setToastMessage(''), 3000);
      } else {
        // Revert only this specific staff member on error
        setStaff(prev => prev.map(s => {
          const isMatch = (targetId && (String(s._id) === targetId || String(s.id) === targetId)) ||
                          (staffMember.email && s.email && s.email.toLowerCase() === staffMember.email.toLowerCase());
          return isMatch ? { ...s, status: currentStatus } : s;
        }));
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Status Update Failed',
          message: data.message || 'Could not update staff status.',
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      setStaff(prev => prev.map(s => {
        const isMatch = (targetId && (String(s._id) === targetId || String(s.id) === targetId)) ||
                        (staffMember.email && s.email && s.email.toLowerCase() === staffMember.email.toLowerCase());
        return isMatch ? { ...s, status: currentStatus } : s;
      }));
      setToastMessage('Network error updating staff status.');
      setTimeout(() => setToastMessage(''), 3000);
    }
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
    } else if (staffFormData.status === 'Active') {
      const roleExists = rolesList.some(r =>
        (typeof r === 'string' ? r : r.roleName || '').trim().toLowerCase() === selectedRole.toLowerCase()
      );
      if (!roleExists) {
        errors.role = `The role "${selectedRole}" does not exist in Member Roles. Please recreate it in Member Roles or select an existing active role.`;
      }
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

  const handleApplyFilter = () => {
    setAppliedFilter({
      search: searchInput.trim(),
      role: roleFilter
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setRoleFilter('');
    setAppliedFilter({
      search: '',
      role: ''
    });
    setCurrentPage(1);
  };

  const filteredStaff = useMemo(() => {
    const term = (appliedFilter.search || '').toLowerCase();
    const selectedRole = (appliedFilter.role || '').toLowerCase();

    return staff.filter(s => {
      const matchesSearch = !term || (
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.phone && s.phone.toLowerCase().includes(term)) ||
        (s.role && s.role.toLowerCase().includes(term))
      );

      const matchesRole = !selectedRole || (
        s.role && s.role.toLowerCase() === selectedRole
      );

      return matchesSearch && matchesRole;
    });
  }, [staff, appliedFilter]);

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
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="staff-search-input" style={{ fontWeight: 500, fontSize: '13.5px', color: '#475569' }}>Search:</label>
              <input
                id="staff-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyFilter();
                  }
                }}
                placeholder="Search name, email, mobile..."
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  width: '200px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
              />
            </div>

            {/* Role Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="staff-role-filter" style={{ fontWeight: 500, fontSize: '13.5px', color: '#475569' }}>Role:</label>
              <select
                id="staff-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  cursor: 'pointer',
                  minWidth: '130px',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
              >
                <option value="">All Roles</option>
                {rolesList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={handleApplyFilter}
              style={{
                backgroundColor: '#00a651',
                color: '#ffffff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 5px rgba(0, 166, 81, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#008c44')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#00a651')}
              title="Apply search and role filter"
            >
              <Filter size={14} />
              <span>Filter</span>
            </button>

            {/* Reset Filter Button */}
            {(appliedFilter.search || appliedFilter.role || searchInput || roleFilter) && (
              <button
                type="button"
                onClick={handleResetFilter}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Reset filters to show all staff members"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
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
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created At</th>
                <th style={{ ...thStyle, width: '180px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                    Loading staff members...
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px 22px', color: '#555', fontSize: '13.5px' }}>
                    {appliedFilter.search || appliedFilter.role ? (
                      <div>
                        <p style={{ margin: '0 0 8px 0', color: '#475569' }}>
                          No staff members found matching the filter criteria.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilter}
                          style={{
                            backgroundColor: '#00a651',
                            color: '#ffffff',
                            border: 'none',
                            padding: '5px 14px',
                            borderRadius: '4px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Clear Filter
                        </button>
                      </div>
                    ) : (
                      <span>
                        No staff members found. Click <strong>"Add Member"</strong> to add your first team member.
                      </span>
                    )}
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
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontWeight: 600,
                          backgroundColor: (s.status || 'Active') === 'Inactive' ? '#fee2e2' : '#dcfce7',
                          color: (s.status || 'Active') === 'Inactive' ? '#b91c1c' : '#15803d',
                          border: (s.status || 'Active') === 'Inactive' ? '1px solid #fca5a5' : '1px solid #bbf7d0',
                          display: 'inline-block'
                        }}
                      >
                        {s.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#555' }}>
                      {s.createdAt ? formatToIST(s.createdAt) : (s.created ? formatToIST(s.created) : (s.formattedDate ? formatToIST(s.formattedDate) : 'Today'))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        {/* Active / Inactive Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          title={(s.status || 'Active') === 'Active' ? 'Click to mark Inactive' : 'Click to mark Active'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backgroundColor: (s.status || 'Active') === 'Active' ? '#f0fdf4' : '#fef2f2',
                            color: (s.status || 'Active') === 'Active' ? '#16a34a' : '#dc2626',
                            border: (s.status || 'Active') === 'Active' ? '1px solid #86efac' : '1px solid #fca5a5',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (s.status || 'Active') === 'Active' ? '#16a34a' : '#dc2626' }} />
                          <span>{(s.status || 'Active') === 'Active' ? 'Active' : 'Inactive'}</span>
                        </button>

                        <button
                          type="button"
                          className="action-btn action-btn-edit"
                          title="Edit Staff"
                          onClick={() => handleOpenEditModal(s)}
                          aria-label="Edit Staff"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn-delete"
                          title="Delete Staff"
                          onClick={() => handleDelete(s._id, s.name)}
                          aria-label="Delete Staff"
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
                        backgroundColor: '#00a651',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0, 166, 81, 0.25)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#008c44')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#00a651')}
                      title="Add a new member role"
                    >
                      Add Role
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

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    className="trust-select"
                    style={{ width: '100%', height: '40px' }}
                    value={staffFormData.status || 'Active'}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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

      {/* Top-Right Success Notification matching Profile Pages */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: '600'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
