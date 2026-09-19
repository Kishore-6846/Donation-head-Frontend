import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Briefcase,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Lock,
  Layers
} from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  'Full Access',
  'Manage Plans',
  'Manage Users',
  'Manage Employees',
  'Broadcast Updates',
  'Financial Reports',
  'View Receipts'
];

export default function EmployeesManagementPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    empId: '',
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
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
      }
    } catch (e) {
      console.error('Error fetching employees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      empId: 'EMP-' + String(employees.length + 1).padStart(3, '0'),
      name: '',
      email: '',
      phone: '',
      role: 'Support Executive',
      department: 'Customer Success',
      permissions: ['Manage Users', 'View Receipts'],
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      empId: emp.empId || '',
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role || 'Support Executive',
      department: emp.department || 'Customer Success',
      permissions: emp.permissions || [],
      status: emp.status || 'Active'
    });
    setModalOpen(true);
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

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Name and email are required.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        fetchEmployees();
        setPopup({
          isOpen: true,
          type: 'success',
          title: editingEmployee ? 'Employee Updated' : 'Employee Added',
          message: editingEmployee ? 'Employee details have been updated.' : 'New Super Admin staff member created.',
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
        message: 'Network error occurred while saving employee.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/employees/${emp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = (emp) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Remove Employee?',
      message: `Are you sure you want to remove staff member "${emp.name}" (${emp.empId})?`,
      showCancel: true,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/employees/${emp._id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchEmployees();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const filteredEmployees = employees.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.empId && e.empId.toLowerCase().includes(q)) ||
      (e.phone && e.phone.includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'All' || e.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || e.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter(e => e.status === 'Active').length;
  const departmentsCount = new Set(employees.map(e => e.department).filter(Boolean)).size;

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Employee Management' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <UserCheck size={14} />
            <span>SUPER ADMIN TEAM</span>
          </div>
          <h1 className="mint-hero-title">Employee Management</h1>
          <p className="mint-hero-subtitle">
            Manage your internal team members, customer success engineers, billing staff, and system administrators with granular role permissions.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px' }}
            onClick={() => navigate('/superadmin/new-employee')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><UserCheck size={22} /></div>
            <span className="stat-modern-val">{totalEmployeesCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Staffs</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><CheckCircle2 size={22} /></div>
            <span className="stat-modern-val">{activeEmployeesCount}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Staffs</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Layers size={22} /></div>
            <span className="stat-modern-val">{departmentsCount || 3}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Departments</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><ShieldCheck size={22} /></div>
            <span className="stat-modern-val">{employees.filter(e => e.role.toLowerCase().includes('admin')).length}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Administrators</span>
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
              placeholder="Search employee by name, ID, email or phone..."
              className="trust-input trust-search-input"
              style={{ width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="trust-select"
            style={{ width: '180px', height: '40px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Super Administrator">Super Administrator</option>
            <option value="Support Lead">Support Lead</option>
            <option value="Support Executive">Support Executive</option>
            <option value="Billing & Accounts Manager">Billing &amp; Accounts</option>
            <option value="Technical Operations">Technical Operations</option>
          </select>
          <select
            className="trust-select"
            style={{ width: '150px', height: '40px' }}
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
          onClick={fetchEmployees}
          title="Refresh Employees"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading super admin employees...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UserCheck size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Employees Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            No team members matched the current search criteria.
          </p>
          <button type="button" className="btn-trust-primary" onClick={handleOpenCreateModal}>
            Add New Employee
          </button>
        </div>
      ) : (
        <div className="trust-table-wrapper trust-card">
          <table className="trust-data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Contact Details</th>
                <th>Designation &amp; Role</th>
                <th>Department</th>
                <th>Permissions</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp._id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                      {emp.empId}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Joined: {emp.joinedDate}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a' }}>
                      <Mail size={13} style={{ color: '#64748b' }} />
                      <span>{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        <Phone size={12} style={{ color: '#94a3b8' }} />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge-pill badge-info" style={{ fontWeight: 600 }}>
                      {emp.role}
                    </span>
                  </td>
                  <td style={{ color: '#334155', fontSize: '13px' }}>{emp.department}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                      {emp.permissions && emp.permissions.slice(0, 3).map((p, i) => (
                        <span key={i} style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                      {emp.permissions && emp.permissions.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#64748b', padding: '2px 4px' }}>
                          +{emp.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pill ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => navigate(`/superadmin/new-employee?id=${emp._id}`)}
                        title="Edit Employee"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleToggleStatus(emp)}
                        title={emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {emp.status === 'Active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                      <button
                        type="button"
                        className="btn-table-action delete"
                        onClick={() => handleDeleteEmployee(emp)}
                        title="Delete Employee"
                      >
                        <Trash2 size={14} />
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
