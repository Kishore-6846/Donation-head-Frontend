import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, UserCheck, Save } from 'lucide-react';

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

  const [formData, setFormData] = useState({
    empId: 'EMP-' + Math.floor(100 + Math.random() * 900),
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
              empId: e.empId || '',
              name: e.name || '',
              email: e.email || '',
              phone: e.phone || '',
              role: e.role || 'Support Executive',
              department: e.department || 'Customer Success',
              permissions: Array.isArray(e.permissions) ? e.permissions : [],
              status: e.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching employee:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Employee Name and Email ID are mandatory.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/employees/${editId}` : '/api/employees';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setPopup({
          isOpen: true,
          type: 'success',
          title: editId ? 'Employee Updated' : 'Employee Onboarded',
          message: editId
            ? 'Employee profile and permissions have been updated.'
            : 'New staff employee profile has been added to Super Admin.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/employees');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to save employee');
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

  const inputStyle = {
    width: '100%',
    height: '38px',
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#495057',
    backgroundColor: '#ffffff'
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
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Employee ID, Name, Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Employee ID</label>
                <input
                  type="text"
                  name="empId"
                  value={formData.empId}
                  onChange={handleChange}
                  placeholder="e.g. EMP-001"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Full Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Corporate Email <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rajesh@donationreceipt.in"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 2: Mobile, Role, Department */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Phone / Mobile</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9840123456"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Admin">Admin</option>
                  <option value="Support Executive">Support Executive</option>
                  <option value="Platform Manager">Platform Manager</option>
                  <option value="Compliance Auditor">Compliance Auditor</option>
                  <option value="Technical Lead">Technical Lead</option>
                  <option value="Operations Executive">Operations Executive</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={inputStyle}
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
                  onChange={handleChange}
                  style={inputStyle}
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
