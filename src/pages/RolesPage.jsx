import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Plus, Eye, Pencil, Trash2, AlertTriangle, CheckCircle2, Sparkles, Shield, X, Check, Minus, Users, Mail, Phone } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

// Format any date/timestamp accurately to Indian Standard Time (IST - Asia/Kolkata): DD-MM-YYYY hh:mm:ss AM/PM
const formatToIST = (dateInput) => {
  if (!dateInput) return '';

  // If already a 24-hour string like DD-MM-YYYY HH:mm:ss, convert to 12-hour AM/PM
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

  // If already a 12-hour format string, return formatted
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

const formatRoleCreated = (role) => {
  if (!role) return '';

  // 1. If createdAt exists as ISO timestamp or Date object
  if (role.createdAt) {
    const formatted = formatToIST(role.createdAt);
    if (formatted) return formatted;
  }

  // 2. If created string exists
  const raw = role.created || role.date;
  if (raw && typeof raw === 'string' && raw.trim()) {
    // If it's the old hardcoded dummy date, ignore it
    if (raw.trim() !== '10-09-2026 06:06:25') {
      const formatted = formatToIST(raw);
      if (formatted) return formatted;
    }
  }

  // 3. If updatedAt exists
  if (role.updatedAt) {
    const formatted = formatToIST(role.updatedAt);
    if (formatted) return formatted;
  }

  return formatToIST(new Date());
};

export default function RolesPage({ user: propUser }) {
  const navigate = useNavigate();

  // Get active logged-in user / trust session
  const activeUser = useMemo(() => {
    if (propUser && !isSuperUser(propUser)) return propUser;
    const trustSession = getTrustSession();
    return trustSession?.user || null;
  }, [propUser]);

  const trustEmail = activeUser?.email || '';

  const [roles, setRoles] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal for viewing staff members with a specific role
  const [membersModal, setMembersModal] = useState({
    isOpen: false,
    roleName: '',
    members: []
  });

  // Top-Right popup & toast states matching Profile Pages
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    roleId: null,
    roleName: ''
  });
  const [toastMessage, setToastMessage] = useState('');

  const fetchRolesAndStaff = async () => {
    setLoading(true);
    try {
      const queryParam = trustEmail ? `?trustEmail=${encodeURIComponent(trustEmail)}` : '';
      const [rolesRes, staffRes] = await Promise.allSettled([
        fetch(`/api/roles${queryParam}`),
        fetch(`/api/staff${queryParam}`)
      ]);

      let apiRoles = [];
      if (rolesRes.status === 'fulfilled' && rolesRes.value && rolesRes.value.ok) {
        try {
          const data = await rolesRes.value.json();
          if (data.success && Array.isArray(data.data)) {
            apiRoles = data.data;
          }
        } catch (e) {}
      }

      const localRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      const roleMap = new Map();
      apiRoles.forEach(r => {
        if (r && r.roleName) roleMap.set(r.roleName, r);
      });
      localRoles.forEach(r => {
        if (r && r.roleName && !roleMap.has(r.roleName)) {
          roleMap.set(r.roleName, r);
        }
      });
      setRoles(Array.from(roleMap.values()));

      if (staffRes.status === 'fulfilled' && staffRes.value && staffRes.value.ok) {
        try {
          const sData = await staffRes.value.json();
          if (sData.success && Array.isArray(sData.data)) {
            setStaffList(sData.data);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error fetching roles and staff:', e);
      const localRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      if (localRoles.length > 0) {
        setRoles(localRoles);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndStaff();
  }, [trustEmail]);

  // Helper to filter staff members belonging to a given role
  const getMembersByRole = (roleName) => {
    if (!roleName) return [];
    const target = roleName.trim().toLowerCase();
    return staffList.filter(s => (s.role || '').trim().toLowerCase() === target);
  };

  const handleOpenMembersModal = (roleName) => {
    const matched = getMembersByRole(roleName);
    setMembersModal({
      isOpen: true,
      roleName,
      members: matched
    });
  };

  const triggerDelete = (id, name) => {
    setDeleteConfirm({
      isOpen: true,
      roleId: id,
      roleName: name
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, roleId: null, roleName: '' });
  };

  const handleConfirmDelete = async () => {
    const { roleId, roleName } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, roleId: null, roleName: '' });

    try {
      if (roleId) {
        await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.error('Error deleting role from API:', e);
    }

    try {
      const stored = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      const updated = stored.filter(r => r._id !== roleId && r.roleName !== roleName);
      localStorage.setItem('custom_roles', JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

    setToastMessage('Role deleted successfully!');
    setTimeout(() => setToastMessage(''), 3000);
    fetchRolesAndStaff();
  };

  const thStyle = {
    padding: '12px 16px',
    fontWeight: '700',
    color: '#212529',
    fontSize: '14px',
    borderRight: '1px solid #dee2e6',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#ffffff',
    textAlign: 'left'
  };

  const tdStyle = {
    padding: '12px 16px',
    borderRight: '1px solid #dee2e6',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    color: '#212529'
  };

  const actionBtnStyle = {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '6px',
    width: '30px',
    height: '30px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s ease'
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>ROLES &amp; PERMISSIONS</span>
          </div>
          <h1 className="mint-hero-title">Manage Member Roles</h1>
          <p className="mint-hero-subtitle">
            Define permission levels, designations, and administrative authorities for your trust.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/add-role')}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New Role</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="mint-table-card-container">
        <div className="table-responsive">
          <table className="custom-table table-mint" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '240px' }}>Role Name</th>
                <th style={{ width: '300px' }}>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#666', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#555', fontSize: '13.5px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>
                    No data available in table
                  </td>
                </tr>
              ) : (
                roles.map((r, i) => {
                  const assignedCount = getMembersByRole(r.roleName).length;
                  return (
                    <tr key={r._id || i}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, color: '#212529', fontWeight: 600 }}>{r.roleName}</td>
                      <td style={{ ...tdStyle, color: '#555' }}>{formatRoleCreated(r)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Members Button with Users icon */}
                          <button
                            type="button"
                            title={`View Staff Members assigned to "${r.roleName}" (${assignedCount})`}
                            onClick={() => handleOpenMembersModal(r.roleName)}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid rgba(37, 99, 235, 0.25)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                          >
                            <Users size={15} />
                          </button>

                          {/* View Role Permissions Button */}
                          <button
                            type="button"
                            title="View Role Details"
                            onClick={() => navigate(`/trust/edit-role/${r._id || r.roleName}?mode=view`)}
                            style={actionBtnStyle}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ecfdf5';
                              e.currentTarget.style.color = '#059669';
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            title="Edit Role"
                            onClick={() => navigate(`/trust/edit-role/${r._id || r.roleName}`)}
                            style={actionBtnStyle}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ecfdf5';
                              e.currentTarget.style.color = '#059669';
                            }}
                          >
                            <Pencil size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => triggerDelete(r._id, r.roleName)}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fee2e2'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Assigned Members Modal */}
      {membersModal.isOpen && (
        <div
          className="receipt-modal-backdrop"
          onClick={() => setMembersModal({ isOpen: false, roleName: '', members: [] })}
        >
          <div
            className="receipt-modal-dialog"
            style={{ maxWidth: '680px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="receipt-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="receipt-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                    Staff Members: <span style={{ color: '#00a651' }}>{membersModal.roleName}</span>
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    {membersModal.members.length === 1
                      ? '1 staff member currently assigned to this role'
                      : `${membersModal.members.length} staff members currently assigned to this role`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="receipt-modal-close"
                onClick={() => setMembersModal({ isOpen: false, roleName: '', members: [] })}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="receipt-modal-body" style={{ padding: '20px', maxHeight: '440px', overflowY: 'auto' }}>
              {membersModal.members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}
                  >
                    <Users size={26} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                    No Members Assigned Yet
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Currently, there are no staff members assigned to the <strong>"{membersModal.roleName}"</strong> role.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMembersModal({ isOpen: false, roleName: '', members: [] });
                      navigate('/trust/staff');
                    }}
                    style={{
                      backgroundColor: '#00a651',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={15} />
                    <span>Go to Staff Members</span>
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, color: '#334155', textAlign: 'left', width: '50px' }}>S.No</th>
                        <th style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, color: '#334155', textAlign: 'left' }}>Staff Name</th>
                        <th style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, color: '#334155', textAlign: 'left' }}>Email Address</th>
                        <th style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, color: '#334155', textAlign: 'left' }}>Mobile Number</th>
                        <th style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, color: '#334155', textAlign: 'left', width: '130px' }}>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersModal.members.map((m, idx) => (
                        <tr key={m._id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  backgroundColor: '#ecfdf5',
                                  color: '#059669',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {(m.name || 'S').charAt(0)}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13.5px' }}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={13} color="#94a3b8" />
                              <span>{m.email}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="#94a3b8" />
                              <span>{m.phone || '—'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>
                            {m.createdAt ? formatToIST(m.createdAt) : (m.created ? formatToIST(m.created) : 'Today')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="receipt-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                Total: <strong>{membersModal.members.length}</strong> member{membersModal.members.length === 1 ? '' : 's'}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-trust-secondary"
                  onClick={() => setMembersModal({ isOpen: false, roleName: '', members: [] })}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-trust-primary"
                  onClick={() => {
                    setMembersModal({ isOpen: false, roleName: '', members: [] });
                    navigate('/trust/staff');
                  }}
                >
                  Manage Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Themed Confirmation Modal */}
      <SimplePopup
        isOpen={deleteConfirm.isOpen}
        type="confirm"
        title="Delete Role?"
        message={`Are you sure you want to delete the role "${deleteConfirm.roleName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
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
