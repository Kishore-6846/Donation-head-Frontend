import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Plus, Eye, Pencil, Trash2, AlertTriangle, CheckCircle2, Sparkles, Shield, X, Check, Minus } from 'lucide-react';

export default function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top-Right popup & toast states matching Profile Pages
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    roleId: null,
    roleName: ''
  });
  const [toastMessage, setToastMessage] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const localRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      const res = await fetch('/api/roles');
      const data = await res.json();
      let apiRoles = [];
      if (data.success && Array.isArray(data.data)) {
        apiRoles = data.data;
      }
      const roleMap = new Map();
      apiRoles.forEach(r => roleMap.set(r.roleName, r));
      localRoles.forEach(r => {
        if (!roleMap.has(r.roleName)) {
          roleMap.set(r.roleName, r);
        }
      });
      setRoles(Array.from(roleMap.values()));
    } catch (e) {
      console.error('Error fetching roles:', e);
      const localRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      if (localRoles.length > 0) {
        setRoles(localRoles);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

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
    fetchRoles();
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
                <th style={{ width: '60px' }}>#</th>
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
                roles.map((r, i) => (
                  <tr key={r._id || i}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, color: '#212529' }}>{r.roleName}</td>
                    <td style={{ ...tdStyle, color: '#212529' }}>{r.created || '10-09-2026 06:06:25'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* View Button */}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
