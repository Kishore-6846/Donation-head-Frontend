import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function ReportTypesPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null
  });

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/report-types');
      const data = await res.json();
      if (data.success) {
        setTypes(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching report types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleDelete = (id, name) => {
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Delete Report Type',
      message: `Are you sure you want to delete the report type "${name}"? This will remove the schema for future reports.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/report-types/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setTypes(prev => prev.filter(t => t._id !== id));
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Deleted',
              message: 'Report type has been removed successfully.',
              showCancel: false,
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          } else {
            setPopup({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: data.message || 'Could not delete report type.',
              showCancel: false,
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (err) {
          console.error('Error deleting report type:', err);
        }
      }
    });
  };

  const filteredTypes = types.filter(t => {
    const matchesSearch =
      (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(types.map(t => t.category).filter(Boolean))];

  return (
    <div className="dashboard-container-modern">
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        showCancel={popup.showCancel}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />

      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Report Schemas' }]} />

      {/* Mint Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <FileSpreadsheet size={13} />
            <span>REPORT SCHEMAS &amp; AUDIT TYPES</span>
          </div>
          <h1 className="mint-hero-title">Report Types &amp; Schemas</h1>
          <p className="mint-hero-subtitle">
            Configure statutory compliance templates, custom audit registers, and analytical report models available across trust portals.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-hero-btn-action"
            onClick={() => navigate('/superadmin/new-report-type')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>+ Create Report Type</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="mint-table-card-container"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search bar with non-overlapping icon */}
          <div className="trust-search-wrapper" style={{ minWidth: '280px', flex: '1 1 300px' }}>
            <Search className="trust-search-icon" size={17} />
            <input
              type="text"
              className="trust-form-input trust-search-input"
              placeholder="Search by report name, code, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="trust-form-input"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
          Showing <strong>{filteredTypes.length}</strong> of {types.length} report schemas
        </div>
      </div>

      {/* Main Table */}
      <div className="mint-table-card-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <p>Loading report schemas...</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <FileSpreadsheet size={42} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              No report types found
            </h3>
            <p style={{ fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 16px' }}>
              No report types matched your search criteria. Create a new report type to get started.
            </p>
            <button
              type="button"
              className="btn-trust-primary"
              onClick={() => navigate('/superadmin/new-report-type')}
            >
              + Create Report Type
            </button>
          </div>
        ) : (
          <div className="trust-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="trust-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Report Type Name</th>
                  <th>Category</th>
                  <th>Frequency &amp; Scope</th>
                  <th>Audit Columns</th>
                  <th>Statutory Clause</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td style={{ color: '#94a3b8', fontWeight: 500 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                        {item.code}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor:
                            item.category === 'Statutory Compliance'
                              ? '#eff6ff'
                              : item.category === 'Tax Compliance'
                              ? '#ecfdf5'
                              : item.category === 'Financial Audit'
                              ? '#fef3c7'
                              : '#f1f5f9',
                          color:
                            item.category === 'Statutory Compliance'
                              ? '#1d4ed8'
                              : item.category === 'Tax Compliance'
                              ? '#047857'
                              : item.category === 'Financial Audit'
                              ? '#b45309'
                              : '#475569'
                        }}
                      >
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                        {item.frequency || 'Annual'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.scope || 'Donation Receipts'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#334155' }}>
                        <strong>{Array.isArray(item.columns) ? item.columns.length : 0}</strong> Columns
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#64748b',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={Array.isArray(item.columns) ? item.columns.join(', ') : ''}
                      >
                        {Array.isArray(item.columns) ? item.columns.slice(0, 3).join(', ') + (item.columns.length > 3 ? '...' : '') : ''}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#475569' }}>
                        {item.sectionClause || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: item.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                          color: item.status === 'Active' ? '#047857' : '#64748b'
                        }}
                      >
                        {item.status === 'Active' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{item.status || 'Active'}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-trust-table-action"
                          onClick={() => navigate(`/superadmin/new-report-type?id=${item._id}`)}
                          title="Edit Schema"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-trust-table-action btn-action-delete"
                          onClick={() => handleDelete(item._id, item.name)}
                          title="Delete Schema"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fff',
                            cursor: 'pointer',
                            color: '#ef4444'
                          }}
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
      </div>
    </div>
  );
}
