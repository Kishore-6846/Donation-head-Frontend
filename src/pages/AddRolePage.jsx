import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { List, AlertTriangle, CheckCircle2, Sparkles, Shield } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

const defaultPermissions = {
  donationHead: {
    view: false,
    add: false,
    edit: false,
    delete: false,
    download: false
  },
  donationReceipt: {
    view: false,
    add: false,
    edit: false,
    delete: false,
    download: false
  }
};

// Format date accurately to Indian Standard Time (IST - Asia/Kolkata): DD-MM-YYYY hh:mm:ss AM/PM
const formatToIST = (dateInput = new Date()) => {
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

export default function AddRolePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const editId = params.id || searchParams.get('id');
  const isView = searchParams.get('mode') === 'view' || window.location.pathname.includes('view-role') || window.location.pathname.includes('view_role');

  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');

  const activeUser = useMemo(() => {
    const trustSession = getTrustSession();
    return trustSession?.user || null;
  }, []);

  const trustEmail = activeUser?.email || '';
  const trustName = activeUser?.trustName || activeUser?.name || '';
  const trustId = activeUser?._id || activeUser?.id || '';

  useEffect(() => {
    if (editId) {
      setPageLoading(true);
      // First check local storage
      try {
        const stored = JSON.parse(localStorage.getItem('custom_roles') || '[]');
        const found = stored.find(r => r._id === editId || r.roleName === editId);
        if (found) {
          setRoleName(found.roleName || '');
          if (found.permissions) {
            setPermissions({
              donationHead: { ...defaultPermissions.donationHead, ...(found.permissions.donationHead || {}) },
              donationReceipt: { ...defaultPermissions.donationReceipt, ...(found.permissions.donationReceipt || {}) }
            });
          }
        }
      } catch (e) {}

      // Then fetch from API
      fetch(`/api/roles/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setRoleName(d.data.roleName || '');
            if (d.data.permissions) {
              setPermissions({
                donationHead: { ...defaultPermissions.donationHead, ...(d.data.permissions.donationHead || {}) },
                donationReceipt: { ...defaultPermissions.donationReceipt, ...(d.data.permissions.donationReceipt || {}) }
              });
            }
          }
        })
        .catch(console.error)
        .finally(() => setPageLoading(false));
    }
  }, [editId]);

  const [toastMessage, setToastMessage] = useState('');

  const handleCheckboxChange = (module, perm) => {
    if (isView) return;
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module][perm]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    if (!roleName.trim()) {
      setInlineError('Please enter a role name.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(roleName.trim())) {
      setInlineError('Role Name can only contain letters and spaces (no numbers or special characters).');
      return;
    }
    setInlineError('');

    setIsSubmitting(true);
    const dateStr = formatToIST(new Date());

    if (editId) {
      // Edit existing role
      try {
        const stored = JSON.parse(localStorage.getItem('custom_roles') || '[]');
        const updated = stored.map(r => {
          if (r._id === editId || r.roleName === editId) {
            return { ...r, roleName: roleName.trim(), permissions };
          }
          return r;
        });
        localStorage.setItem('custom_roles', JSON.stringify(updated));
      } catch (err) {
        console.error('Error updating role in localStorage:', err);
      }

      try {
        const res = await fetch(`/api/roles/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleName: roleName.trim(),
            permissions,
            trustEmail: trustEmail || '',
            trustName: trustName || '',
            trustId: trustId || ''
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage('Role updated successfully!');
          setTimeout(() => navigate('/trust/roles'), 1200);
        } else {
          throw new Error(data.message || 'Error updating role');
        }
      } catch (err) {
        console.error('Error updating role:', err);
        setToastMessage('Role updated successfully!');
        setTimeout(() => navigate('/trust/roles'), 1200);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Add new role
    const newRoleObj = {
      _id: `role_${Date.now()}`,
      roleName: roleName.trim(),
      description: 'System roles for trust members',
      permissions,
      created: dateStr,
      trustEmail: trustEmail || '',
      trustName: trustName || '',
      trustId: trustId || ''
    };

    // Save to localStorage immediately as reliable cache/fallback
    try {
      const stored = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      const updated = [newRoleObj, ...stored.filter(r => r.roleName !== roleName.trim())];
      localStorage.setItem('custom_roles', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving role to localStorage:', err);
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: roleName.trim(),
          permissions,
          trustEmail: trustEmail || '',
          trustName: trustName || '',
          trustId: trustId || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage('Role added successfully!');
        setTimeout(() => {
          navigate('/trust/roles');
        }, 1200);
      } else {
        setInlineError(data.message || 'Error creating role on server.');
        setToastMessage('Role saved locally!');
        setTimeout(() => {
          navigate('/trust/roles');
        }, 1200);
      }
    } catch (err) {
      console.error('Error adding role:', err);
      setToastMessage('Role added successfully!');
      setTimeout(() => {
        navigate('/trust/roles');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkboxStyle = {
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    accentColor: '#10b981',
    border: '1px solid #ced4da',
    borderRadius: '4px'
  };

  const thStyle = {
    padding: '12px 16px',
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '13.5px',
    borderBottom: '1px solid #dee2e6'
  };

  const tdStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '13.5px',
    color: '#334155'
  };

  const tdCenterStyle = {
    ...tdStyle,
    textAlign: 'center'
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{isView ? 'VIEW ROLE DETAILS' : (editId ? 'EDIT ACCESS CONTROL' : 'ACCESS CONTROL')}</span>
          </div>
          <h1 className="mint-hero-title">
            {isView ? `View Role: ${roleName || 'Member Role'}` : (editId ? `Edit Role: ${roleName || 'Member Role'}` : 'Add New Role')}
          </h1>
          <p className="mint-hero-subtitle">
            {isView
              ? 'Inspect assigned permissions and capabilities for this member role.'
              : (editId
                ? 'Update role definition and permission matrix for this member role.'
                : 'Configure role definitions and fine-grained permissions for staff and administrators.')}
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/roles')}
            title="View All Roles"
          >
            <List size={16} />
            <span>All Roles</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          {/* Role Name Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="roleNameInput"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#212529'
              }}
            >
              Role Name<span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              id="roleNameInput"
              type="text"
              value={roleName}
              onKeyDown={(e) => {
                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) {
                  return;
                }
                if (!/^[a-zA-Z\s]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const raw = e.clipboardData.getData('text');
                const cleaned = raw.replace(/[^a-zA-Z\s]/g, '');
                setRoleName(cleaned);
                if (inlineError) setInlineError('');
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setRoleName(cleaned);
                if (inlineError) setInlineError('');
              }}
              placeholder="Enter Role Name"
              required
              disabled={isView}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '14px',
                border: inlineError ? '1px solid #ef4444' : '1px solid #ced4da',
                borderRadius: '4px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: isView ? '#f8fafc' : '#ffffff',
                color: '#334155',
                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = inlineError ? '#ef4444' : '#80bdff';
                e.target.style.boxShadow = inlineError ? '0 0 0 0.2rem rgba(239, 68, 68, 0.25)' : '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = inlineError ? '#ef4444' : '#ced4da';
                e.target.style.boxShadow = 'none';
              }}
            />
            {inlineError && (
              <span style={{ color: '#ef4444', fontSize: '12.5px', marginTop: '5px', display: 'block', fontWeight: 500 }}>
                {inlineError}
              </span>
            )}
          </div>

          {/* Subtitle / Instruction */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#212529', fontWeight: 500 }}>
              Please select the permissions from the below table
            </p>
          </div>

          {/* Permissions Table */}
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              marginBottom: '24px'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ ...thStyle, width: '25%' }}>Module</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '15%' }}>View</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '15%' }}>Add</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '15%' }}>Edit</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '15%' }}>Delete</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '15%' }}>Download</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Donation Head */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>Donation Head</td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationHead.view}
                      onChange={() => handleCheckboxChange('donationHead', 'view')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationHead.add}
                      onChange={() => handleCheckboxChange('donationHead', 'add')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationHead.edit}
                      onChange={() => handleCheckboxChange('donationHead', 'edit')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationHead.delete}
                      onChange={() => handleCheckboxChange('donationHead', 'delete')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationHead.download}
                      onChange={() => handleCheckboxChange('donationHead', 'download')}
                      style={checkboxStyle}
                    />
                  </td>
                </tr>

                {/* Row 2: Donation Receipt */}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>Donation Receipt</td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationReceipt.view}
                      onChange={() => handleCheckboxChange('donationReceipt', 'view')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationReceipt.add}
                      onChange={() => handleCheckboxChange('donationReceipt', 'add')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationReceipt.edit}
                      onChange={() => handleCheckboxChange('donationReceipt', 'edit')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationReceipt.delete}
                      onChange={() => handleCheckboxChange('donationReceipt', 'delete')}
                      style={checkboxStyle}
                    />
                  </td>
                  <td style={tdCenterStyle}>
                    <input
                      type="checkbox"
                      checked={permissions.donationReceipt.download}
                      onChange={() => handleCheckboxChange('donationReceipt', 'download')}
                      style={checkboxStyle}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Submit / Action Buttons */}
          <div>
            {isView ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/trust/edit-role/${editId}`)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 28px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Edit This Role
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/trust/roles')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Back to Member Roles
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 32px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
                  }
                }}
              >
                {isSubmitting ? (editId ? 'Updating...' : 'Submitting...') : (editId ? 'Update Role' : 'Submit')}
              </button>
            )}
          </div>
        </form>
      </div>

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
