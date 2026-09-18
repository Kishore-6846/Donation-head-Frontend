import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Users, Trash2, Pencil, Sparkles, Plus, Mail, Phone, Shield, CheckCircle2, X } from 'lucide-react';

export default function StaffPage({ user: propUser }) {
  const navigate = useNavigate();

  // Get active logged-in user
  const activeUser = useMemo(() => {
    if (propUser) return propUser;
    try {
      const saved = localStorage.getItem('user_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }, [propUser]);

  const trustEmail = activeUser?.email || '';
  const trustName = activeUser?.trustName || activeUser?.name || '';
  const trustId = activeUser?._id || activeUser?.id || '';

  const [staff, setStaff] = useState([]);
  const [rolesList, setRolesList] = useState(['Staff Member', 'Manager', 'Accountant', 'Volunteer', 'Trustee', 'Receipt Operator']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Add / Edit Staff
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff Member',
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
      const [staffRes, rolesRes] = await Promise.allSettled([
        fetch(`/api/staff${queryParam}`),
        fetch('/api/roles')
      ]);

      let staffData = [];
      if (staffRes.status === 'fulfilled') {
        const d = await staffRes.value.json();
        if (d.success && Array.isArray(d.data)) {
          staffData = d.data;
          setStaff(staffData);
        }
      }

      if (rolesRes.status === 'fulfilled') {
        const rData = await rolesRes.value.json();
        if (rData.success && Array.isArray(rData.data)) {
          const customRoles = rData.data.map(r => r.roleName).filter(Boolean);
          const defaultRoles = ['Staff Member', 'Manager', 'Accountant', 'Volunteer', 'Trustee', 'Receipt Operator'];
          setRolesList(Array.from(new Set([...defaultRoles, ...customRoles])));
        }
      }

      const allowed = activeUser?.plan?.toLowerCase() === 'enterprise' ? 25 : (activeUser?.plan?.toLowerCase() === 'advanced' ? 10 : 5);
      setPlanStats({
        planName: activeUser?.plan || 'Standard',
        ownerLogin: 1,
        staffAllowed: allowed,
        createdStaff: staffData.length,
        available: Math.max(0, allowed - staffData.length)
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
    setEditingStaff(null);
    setStaffFormData({
      name: '',
      email: '',
      phone: '',
      role: rolesList[0] || 'Staff Member',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingStaff(s);
    setStaffFormData({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      role: s.role || 'Staff Member',
      status: s.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffFormData.name.trim() || !staffFormData.email.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Required Details',
        message: 'Name and email are mandatory.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    try {
      const url = editingStaff ? `/api/staff/${editingStaff._id}` : '/api/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const payload = {
        ...staffFormData,
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

      if (data.success) {
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
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Operation Failed',
          message: data.message || 'Could not save staff member.',
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
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px' }}
            onClick={handleOpenAddModal}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Staff Member</span>
          </button>
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate('/trust/buy-staff-users')}
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
                <th style={{ ...thStyle, width: '50px' }}>#</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created At</th>
                <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Actions</th>
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
                    <td style={tdStyle}>
                      <span className={`badge-pill ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status || 'Active'}
                      </span>
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

            <form onSubmit={handleSaveStaff}>
              <div className="receipt-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={staffFormData.name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@trust.org"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    className="trust-input"
                    style={{ width: '100%' }}
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Member Role
                    </label>
                    <select
                      className="trust-select"
                      style={{ width: '100%', height: '40px' }}
                      value={staffFormData.role}
                      onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                    >
                      {rolesList.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      className="trust-select"
                      style={{ width: '100%', height: '40px' }}
                      value={staffFormData.status}
                      onChange={(e) => setStaffFormData({ ...staffFormData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
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
