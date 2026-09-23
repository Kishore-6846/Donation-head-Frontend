import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, UserCheck, Save, Lock } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  'Manage Plans',
  'Manage Users',
  'View Receipts',
  'Broadcast Notifications',
  'Platform Reports',
  'Export Data'
];

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    empId: 'EMP-1',
    name: '',
    email: '',
    phone: '',
    role: 'Support Executive',
    department: 'Customer Success',
    permissions: ['Manage Users', 'View Receipts'],
    status: 'Active'
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/employees/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const e = d.data;
            setFormData({
              empId: e.empId || 'EMP-1',
              name: e.name || '',
              email: e.email || '',
              phone: e.phone || '',
              role: (e.role && e.role.toLowerCase() !== 'admin') ? e.role : 'Support Executive',
              department: e.department || 'Customer Success',
              permissions: Array.isArray(e.permissions) ? e.permissions : [],
              status: e.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching employee:', err))
        .finally(() => setLoading(false));
    } else {
      fetch('/api/employees/next-id')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.nextId) {
            setFormData(prev => ({ ...prev, empId: d.nextId }));
          }
        })
        .catch(() => {
          setFormData(prev => ({ ...prev, empId: 'EMP-1' }));
        });
    }
  }, [editId]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePermissionToggle = (perm) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(perm)) {
        return { ...prev, permissions: current.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...current, perm] };
      }
    });
  };

  const getFieldInputStyle = (fieldName, extraStyle = {}) => {
    const hasError = Boolean(fieldErrors[fieldName]);
    return {
      width: '100%',
      height: '38px',
      padding: '6px 12px',
      fontSize: '13px',
      border: hasError ? '1.5px solid #ef4444' : '1px solid #ced4da',
      borderRadius: '4px',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#495057',
      backgroundColor: hasError ? '#fef2f2' : (extraStyle.backgroundColor || '#ffffff'),
      boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
      transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      ...extraStyle
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const cleanName = (formData.name || '').trim();
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');

    // 1. Name Validation
    if (!cleanName) {
      errors.name = 'Full Name is required.';
    } else if (!/^[a-zA-Z\s.]+$/.test(cleanName)) {
      errors.name = 'Name should only contain letters and spaces (no numbers or special characters).';
    }

    // 2. Email Validation
    if (!cleanEmail) {
      errors.email = 'Corporate Email ID is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid corporate email address (e.g. name@domain.com).';
    }

    // 3. Mobile Number Validation
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required.';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Mobile number must be exactly 10 digits.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Mobile number must start with 6, 7, 8, or 9.';
    }

    // 4. Role Validation
    if (!formData.role || formData.role.toLowerCase() === 'admin') {
      errors.role = 'Please select a valid staff role.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const url = editId ? `/api/employees/${editId}` : '/api/employees';
      const method = editId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setPopup({
          isOpen: true,
          type: 'success',
          title: editId ? 'Employee Updated' : 'Employee Onboarded',
          message: editId
            ? 'Employee profile and permissions have been updated.'
            : `New employee ${payload.name} (${data.data?.empId || formData.empId}) has been successfully added.`,
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/employees');
          }
        });
      } else {
        const errMsg = data.message || 'Failed to save employee';
        if (errMsg.toLowerCase().includes('email')) {
          setFieldErrors({ email: errMsg });
        } else if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('phone')) {
          setFieldErrors({ phone: errMsg });
        } else if (errMsg.toLowerCase().includes('name')) {
          setFieldErrors({ name: errMsg });
        } else {
          throw new Error(errMsg);
        }
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'An error occurred while saving the employee.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#212529',
    marginBottom: '6px'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{editId ? 'EDIT EMPLOYEE PROFILE' : 'NEW EMPLOYEE ONBOARDING'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? 'Edit Employee Profile' : 'Add New Employee'}
          </h1>
          <p className="mint-hero-subtitle">
            Register new Super Admin staff members, specify internal roles, and assign security permissions.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/superadmin/employees')}
            title="View All Employees"
          >
            <List size={16} />
            <span>All Employees</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading employee details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* ROW 1: Employee ID, Name, Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Employee ID <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>(Auto-generated)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="empId"
                    value={formData.empId}
                    readOnly
                    disabled
                    placeholder="EMP-1"
                    style={getFieldInputStyle('empId', {
                      backgroundColor: '#f8fafc',
                      cursor: 'not-allowed',
                      color: '#059669',
                      fontWeight: '700',
                      letterSpacing: '0.5px'
                    })}
                  />
                  <Lock size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Full Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="e.g. Rajesh Kumar"
                  style={getFieldInputStyle('name')}
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
                <label style={labelStyle}>
                  Corporate Email <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="rajesh@donationreceipt.in"
                  style={getFieldInputStyle('email')}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
                {fieldErrors.email && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>
            </div>

            {/* ROW 2: Mobile, Role, Department */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Phone / Mobile <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  inputMode="numeric"
                  value={formData.phone}
                  placeholder="10-digit mobile (starts with 6-9)"
                  style={getFieldInputStyle('phone')}
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) {
                      return;
                    }
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    } else if (!formData.phone && !/^[6-9]$/.test(e.key)) {
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
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                    const cleaned = raw ? (['6', '7', '8', '9'].includes(raw[0]) ? raw : raw.slice(1)) : '';
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
                <label style={labelStyle}>Role <span style={{ color: '#dc3545' }}>*</span></label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                  style={getFieldInputStyle('role')}
                >
                  <option value="Support Executive">Support Executive</option>
                  <option value="Platform Manager">Platform Manager</option>
                  <option value="Compliance Auditor">Compliance Auditor</option>
                  <option value="Technical Lead">Technical Lead</option>
                  <option value="Operations Executive">Operations Executive</option>
                </select>
                {fieldErrors.role && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {fieldErrors.role}
                  </span>
                )}
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  style={getFieldInputStyle('department')}
                >
                  <option value="Customer Success">Customer Success</option>
                  <option value="Platform Operations">Platform Operations</option>
                  <option value="Compliance">Compliance &amp; Legal</option>
                  <option value="Engineering">Engineering / IT</option>
                </select>
              </div>
            </div>

            {/* ROW 3: Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '22px' }}>
              <div>
                <label style={labelStyle}>Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  style={getFieldInputStyle('status')}
                >
                  <option value="Active">Active (Permitted)</option>
                  <option value="Inactive">Inactive (Suspended Access)</option>
                </select>
              </div>
            </div>

            {/* ROW 4: Assigned Permissions */}
            <div style={{ marginBottom: '28px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>
                Assigned Platform Permissions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isChecked = formData.permissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: isChecked ? '#0f172a' : '#64748b',
                        fontWeight: isChecked ? '600' : '400'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePermissionToggle(perm)}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                      <span>{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button
                type="submit"
                className="btn-trust-primary"
                disabled={isSubmitting}
                style={{ padding: '10px 24px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Saving...' : editId ? 'Update Employee' : 'Save Employee Profile'}</span>
              </button>

              <button
                type="button"
                className="btn-trust-outline"
                onClick={() => navigate('/superadmin/employees')}
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
}
