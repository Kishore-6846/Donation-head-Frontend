import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import {
  Sparkles,
  List,
  FileSpreadsheet,
  Save,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  Layers,
  Wand2,
  CheckCircle2,
  Sliders,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  X,
  Tag,
  Database,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Search
} from 'lucide-react';

// Master Catalog of all available fields that SuperAdmin can select
const AVAILABLE_FIELDS_CATALOG = [
  // 1. Transaction & Receipt Identifiers
  {
    key: 'receiptNo',
    label: 'Receipt No.',
    group: 'Receipt & Transaction',
    type: 'text',
    defaultChecked: true,
    description: 'Unique receipt number identifier'
  },
  {
    key: 'receiptDate',
    label: 'Receipt Date',
    group: 'Receipt & Transaction',
    type: 'date',
    defaultChecked: true,
    description: 'Date receipt was issued'
  },
  {
    key: 'financialYear',
    label: 'Financial Year',
    group: 'Receipt & Transaction',
    type: 'text',
    defaultChecked: false,
    description: 'Financial tax year e.g. 2026-2027'
  },
  {
    key: 'reference',
    label: 'Reference / Ref No.',
    group: 'Receipt & Transaction',
    type: 'text',
    defaultChecked: false,
    description: 'Bank or internal audit reference code'
  },

  // 2. Donor / Devotee Information
  {
    key: 'donorName',
    label: 'Donor / Devotee Name',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: true,
    description: 'Full name of the contributor'
  },
  {
    key: 'phone',
    label: 'Phone Number',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: false,
    description: 'Contact phone / mobile number'
  },
  {
    key: 'email',
    label: 'Email Address',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: false,
    description: 'Email ID for digital communication'
  },
  {
    key: 'panNumber',
    label: 'PAN Card Number',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: true,
    description: 'Tax PAN number for 80G/10BD'
  },
  {
    key: 'aadhaarNumber',
    label: 'Aadhaar Number',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: false,
    description: 'Unique 12-digit Aadhaar identification'
  },
  {
    key: 'address',
    label: 'Donor Address',
    group: 'Donor Information',
    type: 'text',
    defaultChecked: false,
    description: 'Residential or organization address'
  },

  // 3. Contribution Details
  {
    key: 'donationHead',
    label: 'Donation Head / Seva',
    group: 'Donation Details',
    type: 'text',
    defaultChecked: true,
    description: 'Specific seva scheme or cause'
  },
  {
    key: 'donationType',
    label: 'Donation Type',
    group: 'Donation Details',
    type: 'text',
    defaultChecked: false,
    description: 'Voluntary Donation, Corpus, Earmarked'
  },
  {
    key: 'amount',
    label: 'Amount (₹)',
    group: 'Donation Details',
    type: 'number',
    defaultChecked: true,
    description: 'Contribution amount in INR'
  },
  {
    key: 'paymentMode',
    label: 'Payment Mode',
    group: 'Donation Details',
    type: 'text',
    defaultChecked: true,
    description: 'UPI, Cash, Cheque, Netbanking'
  },
  {
    key: 'paymentDetails',
    label: 'Payment Details / Transaction ID',
    group: 'Donation Details',
    type: 'text',
    defaultChecked: false,
    description: 'Cheque No. or UPI Ref detail'
  },

  // 4. Governance, Tax & Audit
  {
    key: 'trustName',
    label: 'Trust / Temple Name',
    group: 'Governance & Tax',
    type: 'text',
    defaultChecked: false,
    description: 'Target trust entity name'
  },
  {
    key: 'createdBy',
    label: 'Created By / Staff',
    group: 'Governance & Tax',
    type: 'text',
    defaultChecked: false,
    description: 'Operator or staff member identifier'
  },
  {
    key: 'section80G',
    label: '80G Tax Exemption Status',
    group: 'Governance & Tax',
    type: 'text',
    defaultChecked: false,
    description: 'Eligibility under Section 80G IT Act'
  },
  {
    key: 'notes',
    label: 'Notes / Remarks',
    group: 'Governance & Tax',
    type: 'text',
    defaultChecked: false,
    description: 'Audit remarks and notes'
  }
];

export default function NewReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');
  const isSuperAdminRoute = location.pathname.toLowerCase().startsWith('/superadmin');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trustsList, setTrustsList] = useState([]);
  const [donationHeadsList, setDonationHeadsList] = useState([]);
  const [receiptTypesList, setReceiptTypesList] = useState([]);

  // Report Base and Scope
  const [reportBase, setReportBase] = useState('receipts');
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    category: 'Temple Endowment',
    targetTrust: 'All Trusts',
    financialYear: '2026-2027',
    fromDate: '2026-04-01',
    toDate: '2026-09-30',
    description: '',
    status: 'Published'
  });

  // SuperAdmin Filter Criteria
  const [filterCriteria, setFilterCriteria] = useState({
    donationHead: 'All Heads',
    donationType: 'All Types',
    paymentMode: 'All Modes',
    section80G: 'all', // 'all' | 'eligible' | 'non_eligible'
    minAmount: ''
  });

  // Selected Filters that will be present in the new Report
  const [enabledFilters, setEnabledFilters] = useState({
    dateRange: true,
    donationHead: true,
    donationType: true,
    paymentMode: true,
    search: true
  });

  const toggleFilter = (filterKey) => {
    setEnabledFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  // Ordered Columns State: SuperAdmin controls exact sequence (#1, #2, #3, ...)
  const [orderedColumns, setOrderedColumns] = useState(() => {
    return AVAILABLE_FIELDS_CATALOG
      .filter(f => f.defaultChecked)
      .map(f => ({ ...f }));
  });

  // Custom Columns
  const [newCustomCol, setNewCustomCol] = useState({ label: '', type: 'text' });
  const [showAddCustomCol, setShowAddCustomCol] = useState(false);

  const [notificationBanner, setNotificationBanner] = useState('');

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch registered trusts, donation heads, and receipt types
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) setTrustsList(d.data);
      })
      .catch(e => console.error('Error fetching trusts:', e));

    fetch('/api/donation-heads?limit=100')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) setDonationHeadsList(d.data);
      })
      .catch(e => console.error('Error fetching heads:', e));

    fetch('/api/receipt-types?status=Active')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) setReceiptTypesList(d.data);
      })
      .catch(e => console.error('Error fetching types:', e));
  }, []);

  // Fetch report data if editing
  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/dynamic-reports/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const rep = d.data;
            setReportBase(rep.reportBase || 'receipts');
            setFormData({
              title: rep.title || '',
              code: rep.code || '',
              category: rep.category || 'General Audit',
              targetTrust: rep.targetTrust || 'All Trusts',
              financialYear: rep.financialYear || '2026-2027',
              fromDate: rep.fromDate || '',
              toDate: rep.toDate || '',
              description: rep.description || '',
              status: rep.status || 'Published'
            });

            if (rep.filters) {
              setFilterCriteria(prev => ({ ...prev, ...rep.filters }));
            }
            if (rep.enabledFilters) {
              setEnabledFilters(prev => ({ ...prev, ...rep.enabledFilters }));
            }

            if (Array.isArray(rep.columns) && rep.columns.length > 0) {
              const catalogMap = new Map(AVAILABLE_FIELDS_CATALOG.map(f => [f.key, f]));
              const rebuilt = rep.columns.map(col => {
                const catalogItem = catalogMap.get(col.key);
                return {
                  key: col.key,
                  label: col.label || catalogItem?.label || col.key,
                  type: col.type || catalogItem?.type || 'text',
                  group: catalogItem?.group || 'Custom Fields',
                  description: catalogItem?.description || '',
                  isCustom: !catalogItem
                };
              });
              setOrderedColumns(rebuilt);
            }
          }
        })
        .catch(err => console.error('Error fetching report:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Handle header form change
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle filter criteria change
  const handleFilterChange = (field, val) => {
    setFilterCriteria(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Check if a key is currently selected in ordered columns
  const isFieldSelected = (key) => orderedColumns.some(c => c.key === key);

  // Get 1-based order index of a field in orderedColumns (returns 1, 2, 3... or null)
  const getFieldOrder = (key) => {
    const idx = orderedColumns.findIndex(c => c.key === key);
    return idx !== -1 ? idx + 1 : null;
  };

  // Ordinal suffix helper (1st, 2nd, 3rd, 4th...)
  const getOrdinal = (n) => {
    if (!n) return '';
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  // Toggle field selection in grid with dynamic ordering (1st, 2nd, 3rd...)
  const handleToggleField = (catalogField) => {
    if (isFieldSelected(catalogField.key)) {
      if (orderedColumns.length <= 1) {
        alert('At least one column must remain selected in the report.');
        return;
      }
      setOrderedColumns(prev => prev.filter(c => c.key !== catalogField.key));
    } else {
      setOrderedColumns(prev => [...prev, { ...catalogField }]);
    }
  };

  // Add custom column
  const handleAddCustomColumn = (e) => {
    e.preventDefault();
    if (!newCustomCol.label.trim()) return;

    const generatedKey = 'custom_' + newCustomCol.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (orderedColumns.some(c => c.key === generatedKey)) {
      alert('A column with this key or name already exists in the report.');
      return;
    }

    const newColObj = {
      key: generatedKey,
      label: newCustomCol.label.trim(),
      group: 'Custom Fields',
      type: newCustomCol.type || 'text',
      description: 'Custom field added by SuperAdmin',
      isCustom: true
    };

    setOrderedColumns(prev => [...prev, newColObj]);
    setNewCustomCol({ label: '', type: 'text' });
    setShowAddCustomCol(false);
  };

  // Column Reordering Methods
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setOrderedColumns(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= orderedColumns.length - 1) return;
    setOrderedColumns(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveToPosition = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= orderedColumns.length || fromIndex === toIndex) return;
    setOrderedColumns(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleUpdateColumnLabel = (index, newLabel) => {
    setOrderedColumns(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], label: newLabel };
      return updated;
    });
  };

  const handleRemoveColumn = (index) => {
    if (orderedColumns.length <= 1) {
      alert('At least one column must remain selected in the report.');
      return;
    }
    setOrderedColumns(prev => prev.filter((_, i) => i !== index));
  };

  // Group catalog fields by category for clean UI organization
  const fieldGroups = useMemo(() => {
    const groups = {};
    AVAILABLE_FIELDS_CATALOG.forEach(f => {
      if (!groups[f.group]) groups[f.group] = [];
      groups[f.group].push(f);
    });
    return groups;
  }, []);

  // Save report
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Report Title is required.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (orderedColumns.length === 0) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please select at least one field/column for the report.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch live receipts matching SuperAdmin filter rules to generate structured data rows
      let liveRows = [];
      try {
        const rcRes = await fetch('/api/receipts?limit=500');
        const rcJson = await rcRes.json();
        if (rcJson.success && Array.isArray(rcJson.data)) {
          let matched = rcJson.data;

          // Filter by Target Trust
          if (formData.targetTrust && formData.targetTrust !== 'All Trusts') {
            const tLower = formData.targetTrust.toLowerCase();
            matched = matched.filter(r =>
              (r.trustName && r.trustName.toLowerCase().includes(tLower)) ||
              (r.trustEmail && r.trustEmail.toLowerCase().includes(tLower))
            );
          }

          // Filter by Donation Head
          if (filterCriteria.donationHead && filterCriteria.donationHead !== 'All Heads') {
            matched = matched.filter(r =>
              r.donationHead && r.donationHead.toLowerCase() === filterCriteria.donationHead.toLowerCase()
            );
          }

          // Filter by Donation Type
          if (filterCriteria.donationType && filterCriteria.donationType !== 'All Types') {
            matched = matched.filter(r =>
              (r.donationType && r.donationType.toLowerCase() === filterCriteria.donationType.toLowerCase()) ||
              (r.type && r.type.toLowerCase() === filterCriteria.donationType.toLowerCase())
            );
          }

          // Filter by Payment Mode
          if (filterCriteria.paymentMode && filterCriteria.paymentMode !== 'All Modes') {
            matched = matched.filter(r =>
              r.paymentMode && r.paymentMode.toLowerCase().includes(filterCriteria.paymentMode.toLowerCase())
            );
          }

          // Filter by 80G Status
          if (filterCriteria.section80G === 'eligible') {
            matched = matched.filter(r => r.attach80g === true || r.section80G === 'Eligible');
          } else if (filterCriteria.section80G === 'non_eligible') {
            matched = matched.filter(r => !r.attach80g && r.section80G !== 'Eligible');
          }

          // Filter by Minimum Amount
          if (filterCriteria.minAmount && parseFloat(filterCriteria.minAmount) > 0) {
            const minVal = parseFloat(filterCriteria.minAmount);
            matched = matched.filter(r => (parseFloat(r.amount) || 0) >= minVal);
          }

          // Map to exact ordered columns in sequence
          liveRows = matched.map((rc, idx) => {
            const rowObj = { rowId: 'rc_' + (rc._id || idx) };
            orderedColumns.forEach(col => {
              if (col.key === 'receiptNo') rowObj[col.key] = rc.receiptNo || `ASUF/2026-27/${idx + 1}`;
              else if (col.key === 'receiptDate') rowObj[col.key] = rc.receiptDate || rc.date || new Date().toISOString().split('T')[0];
              else if (col.key === 'donorName') rowObj[col.key] = rc.donorName || rc.name || 'Devotee / Contributor';
              else if (col.key === 'phone') rowObj[col.key] = rc.phone || '';
              else if (col.key === 'email') rowObj[col.key] = rc.email || '';
              else if (col.key === 'panNumber') rowObj[col.key] = rc.panNo || rc.panNumber || rc.pan || '';
              else if (col.key === 'aadhaarNumber') rowObj[col.key] = rc.aadhaarNo || rc.aadhaarNumber || '';
              else if (col.key === 'address') rowObj[col.key] = rc.address || '';
              else if (col.key === 'donationHead') rowObj[col.key] = rc.donationHead || 'General Donation';
              else if (col.key === 'donationType') rowObj[col.key] = rc.donationType || rc.type || 'Voluntary Donation';
              else if (col.key === 'amount') rowObj[col.key] = parseFloat(rc.amount) || 0;
              else if (col.key === 'paymentMode') rowObj[col.key] = rc.paymentMode || 'Wallet/UPI';
              else if (col.key === 'paymentDetails') rowObj[col.key] = rc.paymentDetails || rc.paymentMode || '';
              else if (col.key === 'reference') rowObj[col.key] = rc.reference || '';
              else if (col.key === 'financialYear') rowObj[col.key] = formData.financialYear;
              else if (col.key === 'trustName') rowObj[col.key] = rc.trustName || formData.targetTrust || '';
              else if (col.key === 'createdBy') rowObj[col.key] = rc.createdBy || 'Admin';
              else if (col.key === 'section80G') rowObj[col.key] = rc.attach80g ? 'Eligible' : 'Non-Eligible';
              else if (col.key === 'notes') rowObj[col.key] = rc.notes || '';
              else rowObj[col.key] = '';
            });
            return rowObj;
          });
        }
      } catch (err) {
        console.warn('Could not auto-fetch live rows during save:', err);
      }

      const payload = {
        ...formData,
        reportBase,
        reportBaseLabel:
          reportBase === 'receipts' ? 'Receipts & Transactions' :
          reportBase === 'donation-head' ? 'Donation Head Wise' :
          reportBase === 'donor' ? 'Donor Directory' :
          reportBase === 'donation-type' ? 'Donation Type Matrix' :
          reportBase === 'payment-mode' ? 'Payment Mode Summary' :
          reportBase === '10bd' ? 'Form 10BD Statutory Tax' : 'Custom Matrix',
        filters: filterCriteria,
        enabledFilters: enabledFilters,
        selectedFieldKeys: orderedColumns.map(c => c.key),
        columns: orderedColumns.map(c => ({
          key: c.key,
          label: c.label,
          type: c.type || 'text'
        })),
        dataRows: liveRows
      };

      const url = editId ? `/api/dynamic-reports/${editId}` : '/api/dynamic-reports';
      const method = editId ? 'PUT' : 'POST';

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
          title: editId ? 'Report Updated Successfully' : 'Report Created & Published',
          message: editId
            ? `Report "${formData.title}" and ordered column structure (${orderedColumns.length} columns) updated.`
            : `New report "${formData.title}" published with ${orderedColumns.length} ordered columns for ${formData.targetTrust}.`,
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            if (isSuperAdminRoute) {
              navigate('/superadmin/all-reports');
            } else {
              navigate('/trust/reports');
            }
          }
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Operation Failed',
          message: data.message || 'Could not save report.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to backend server: ' + err.message,
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete report if editing
  const handleDeleteReport = () => {
    if (!editId) return;
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Delete Report',
      message: `Are you sure you want to permanently delete "${formData.title || 'this report'}"? It will be removed from all trust admin portals and the super admin directory.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dynamic-reports/${editId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Report Deleted',
              message: 'The report template has been deleted successfully.',
              showCancel: false,
              onConfirm: () => {
                setPopup(p => ({ ...p, isOpen: false }));
                navigate(isSuperAdminRoute ? '/superadmin/all-reports' : '/trust/reports');
              }
            });
          } else {
            setPopup({
              isOpen: true,
              type: 'error',
              title: 'Delete Failed',
              message: data.message || 'Could not delete report.',
              showCancel: false,
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (err) {
          setPopup({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to connect to backend server: ' + err.message,
            showCancel: false,
            onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
          });
        }
      }
    });
  };

  return (
    <>
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={13} />
            <span>SUPER ADMIN REPORT BUILDER STUDIO</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? (formData.title ? `Edit Report: ${formData.title}` : 'Edit Report Configuration') : 'Create & Configure Custom Audit Report'}
          </h1>
          <p className="mint-hero-subtitle">
            Configure report data base, filter rules, target trust audience, select fields, and arrange the exact column order for the final report.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-hero-btn-action"
            onClick={() => navigate(isSuperAdminRoute ? '/superadmin/all-reports' : '/trust/reports')}
          >
            <List size={16} />
            <span>View All Published Reports</span>
          </button>
        </div>
      </div>

      {notificationBanner && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 20px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          borderRadius: '10px',
          border: '1px solid #86efac',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="mint-table-card-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <p>Loading report configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* ========================================================= */}
            {/* 1. CREATE NEW REPORT */}
            {/* ========================================================= */}
            <div style={{ marginBottom: '32px' }}>
              <div className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileSpreadsheet size={20} color="#059669" />
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {editId ? '1. Edit Report Configuration' : '1. Create New Report'}
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '18px' }}>
                Define report identification, target audience, financial period, and publishing scope.
              </p>

              {/* Core Metadata Fields */}
              <div className="trust-form-grid">
                <div className="trust-form-group trust-col-span-2">
                  <label className="trust-form-label">
                    Report Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="trust-form-input"
                    placeholder="e.g. Annual Corpus & Temple Inflow Audit 2026-27"
                    value={formData.title}
                    onChange={handleHeaderChange}
                    required
                  />
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Report Code Identifier</label>
                  <input
                    type="text"
                    name="code"
                    className="trust-form-input"
                    placeholder="e.g. REP_AUDIT_2026"
                    value={formData.code}
                    onChange={handleHeaderChange}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  />
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Report Category</label>
                  <select
                    name="category"
                    className="trust-form-input"
                    value={formData.category}
                    onChange={handleHeaderChange}
                  >
                    <option value="Temple Endowment">Temple Endowment / Seva</option>
                    <option value="Statutory Compliance">Statutory Compliance (Form 10BD/80G)</option>
                    <option value="Donor Analytics">Donor Analytics &amp; Stewardship</option>
                    <option value="Financial Audit">Financial Audit Register</option>
                    <option value="CSR Grant">CSR Grant &amp; Corporate Funds</option>
                    <option value="General Audit">General Audit Report</option>
                  </select>
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">
                    Target Trust / Temple Audience <span className="text-danger">*</span>
                  </label>
                  <select
                    name="targetTrust"
                    className="trust-form-input"
                    value={formData.targetTrust}
                    onChange={handleHeaderChange}
                    style={{ fontWeight: 600, color: formData.targetTrust === 'All Trusts' ? '#047857' : '#0f172a' }}
                  >
                    <option value="All Trusts">🌐 All Trusts &amp; Temples (Platform-Wide)</option>
                    {trustsList.map(u => (
                      <option key={u._id} value={u.trustName || u.name}>
                        🏛️ {u.trustName || u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Financial Year</label>
                  <select
                    name="financialYear"
                    className="trust-form-input"
                    value={formData.financialYear}
                    onChange={handleHeaderChange}
                  >
                    <option value="2026-2027">Financial Year 2026-2027</option>
                    <option value="2025-2026">Financial Year 2025-2026</option>
                    <option value="2024-2025">Financial Year 2024-2025</option>
                    <option value="2023-2024">Financial Year 2023-2024</option>
                  </select>
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Period From Date</label>
                  <input
                    type="date"
                    name="fromDate"
                    className="trust-form-input"
                    value={formData.fromDate}
                    onChange={handleHeaderChange}
                  />
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Period To Date</label>
                  <input
                    type="date"
                    name="toDate"
                    className="trust-form-input"
                    value={formData.toDate}
                    onChange={handleHeaderChange}
                  />
                </div>

                <div className="trust-form-group">
                  <label className="trust-form-label">Publishing Status</label>
                  <select
                    name="status"
                    className="trust-form-input"
                    value={formData.status}
                    onChange={handleHeaderChange}
                  >
                    <option value="Published">Published (Visible on Every Trust Admin Portal)</option>
                    <option value="Draft">Draft (Internal Super Admin Only)</option>
                  </select>
                </div>

                <div className="trust-form-group trust-col-span-3">
                  <label className="trust-form-label">Report Description / Scope Summary</label>
                  <input
                    type="text"
                    name="description"
                    className="trust-form-input"
                    placeholder="e.g. Complete reconciliation of devotee collections, tax deductions, and payment methods for the chosen period..."
                    value={formData.description}
                    onChange={handleHeaderChange}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. SELECT FILTERS PRESENT IN THIS REPORT */}
            {/* ========================================================= */}
            <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Filter size={20} color="#059669" />
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    2. Select Filters for This Report
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: '#e6f4ea',
                    color: '#047857'
                  }}>
                    {Object.values(enabledFilters).filter(Boolean).length} of 5 Filters Enabled
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>
                Select which interactive filter controls should be available to users in this report. You can also configure default presets for each enabled filter.
              </p>

              {/* Filter Selection Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>

                {/* 1. Date Range Filter */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: enabledFilters.dateRange ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: enabledFilters.dateRange ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFilter('dateRange')}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar size={18} color={enabledFilters.dateRange ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: enabledFilters.dateRange ? '#065f46' : '#0f172a' }}>
                        Date Range Filter
                      </span>
                    </div>
                    {enabledFilters.dateRange ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                    Allows viewers to filter records between custom issuance date ranges (From Date → To Date).
                  </p>
                </div>

                {/* 2. Donation Head / Seva Filter */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: enabledFilters.donationHead ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: enabledFilters.donationHead ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFilter('donationHead')}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers size={18} color={enabledFilters.donationHead ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: enabledFilters.donationHead ? '#065f46' : '#0f172a' }}>
                        Donation Head Filter
                      </span>
                    </div>
                    {enabledFilters.donationHead ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 10px 0', lineHeight: '1.4' }}>
                    Allows viewers to filter records by Seva scheme, Annadhanam, Corpus, or custom heads.
                  </p>
                  {enabledFilters.donationHead && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1fae5' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                        Default Head Selection:
                      </label>
                      <select
                        className="trust-form-input"
                        style={{ padding: '6px 10px', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                        value={filterCriteria.donationHead}
                        onChange={e => handleFilterChange('donationHead', e.target.value)}
                      >
                        <option value="All Heads">All Donation Heads</option>
                        <option value="General Donation">General Donation</option>
                        <option value="Annadhanam Scheme">Annadhanam Scheme</option>
                        <option value="Temple Renovation / Corpus">Temple Renovation / Corpus</option>
                        <option value="Special Archana & Puja">Special Archana &amp; Puja</option>
                        {donationHeadsList.map(h => (
                          <option key={h._id || h.name} value={h.name}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Donation Type Filter */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: enabledFilters.donationType ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: enabledFilters.donationType ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFilter('donationType')}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Tag size={18} color={enabledFilters.donationType ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: enabledFilters.donationType ? '#065f46' : '#0f172a' }}>
                        Donation Type Filter
                      </span>
                    </div>
                    {enabledFilters.donationType ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 10px 0', lineHeight: '1.4' }}>
                    Allows viewers to filter by Voluntary Donation, Corpus Fund, or Earmarked funds.
                  </p>
                  {enabledFilters.donationType && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1fae5' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                        Default Type Selection:
                      </label>
                      <select
                        className="trust-form-input"
                        style={{ padding: '6px 10px', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                        value={filterCriteria.donationType}
                        onChange={e => handleFilterChange('donationType', e.target.value)}
                      >
                        <option value="All Types">All Donation Types</option>
                        <option value="Voluntary Donation">Voluntary Donation</option>
                        <option value="Corpus Fund">Corpus Fund</option>
                        <option value="Earmarked Fund">Earmarked Fund</option>
                        {receiptTypesList.map(t => (
                          <option key={t._id || t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Payment Mode Filter */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: enabledFilters.paymentMode ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: enabledFilters.paymentMode ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFilter('paymentMode')}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <DollarSign size={18} color={enabledFilters.paymentMode ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: enabledFilters.paymentMode ? '#065f46' : '#0f172a' }}>
                        Payment Mode Filter
                      </span>
                    </div>
                    {enabledFilters.paymentMode ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 10px 0', lineHeight: '1.4' }}>
                    Allows viewers to filter by UPI, Bank Transfer, Cheque, or Cash settlements.
                  </p>
                  {enabledFilters.paymentMode && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1fae5' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                        Default Mode Selection:
                      </label>
                      <select
                        className="trust-form-input"
                        style={{ padding: '6px 10px', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                        value={filterCriteria.paymentMode}
                        onChange={e => handleFilterChange('paymentMode', e.target.value)}
                      >
                        <option value="All Modes">All Payment Modes</option>
                        <option value="Wallet/UPI">Wallet / UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque/Draft">Cheque / Demand Draft</option>
                        <option value="Electronic/Bank Transfer">Electronic / Bank Transfer</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 5. Keyword Search Bar */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: enabledFilters.search ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: enabledFilters.search ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div
                    onClick={() => toggleFilter('search')}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Search size={18} color={enabledFilters.search ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: enabledFilters.search ? '#065f46' : '#0f172a' }}>
                        Keyword Search Filter
                      </span>
                    </div>
                    {enabledFilters.search ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                    Enables an instant search box on the report table for searching donor names, phone, PAN, and receipt numbers.
                  </p>
                </div>

              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. FIELD SELECTION CATALOG */}
            {/* ========================================================= */}
            <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div className="form-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sliders size={20} color="#059669" />
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      3. Select Available Fields for Report
                    </h2>
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Click to select fields in your desired column sequence (1st, 2nd, 3rd...). Columns will be ordered in the final report exactly as selected.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-trust-secondary"
                  onClick={() => setShowAddCustomCol(!showAddCustomCol)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px' }}
                >
                  <Plus size={15} color="#059669" />
                  <span>{showAddCustomCol ? 'Close Custom Column' : '+ Add Custom Column'}</span>
                </button>
              </div>

              {/* Custom Column Inline Form */}
              {showAddCustomCol && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 240px' }}>
                    <label className="trust-form-label" style={{ marginBottom: '4px' }}>Custom Column Header Name</label>
                    <input
                      type="text"
                      className="trust-form-input"
                      placeholder="e.g. Temple Vault Reference, Archana Slot..."
                      value={newCustomCol.label}
                      onChange={e => setNewCustomCol({ ...newCustomCol, label: e.target.value })}
                    />
                  </div>

                  <div style={{ width: '160px' }}>
                    <label className="trust-form-label" style={{ marginBottom: '4px' }}>Data Type</label>
                    <select
                      className="trust-form-input"
                      value={newCustomCol.type}
                      onChange={e => setNewCustomCol({ ...newCustomCol, type: e.target.value })}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number (Currency)</option>
                      <option value="date">Date</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-trust-primary"
                    onClick={handleAddCustomColumn}
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                  >
                    Add Column to Sequence
                  </button>
                </div>
              )}

              {/* Categorized Field Pickers Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {Object.entries(fieldGroups).map(([groupName, fields]) => (
                  <div
                    key={groupName}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{groupName}</span>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {fields.filter(f => isFieldSelected(f.key)).length} / {fields.length} selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {fields.map(f => {
                        const isChecked = isFieldSelected(f.key);
                        const orderNum = getFieldOrder(f.key);
                        const rankLabel = getOrdinal(orderNum);

                        return (
                          <div
                            key={f.key}
                            onClick={() => handleToggleField(f)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: isChecked ? '#f0fdf4' : '#fafafa',
                              border: isChecked ? '1.5px solid #059669' : '1px solid #e2e8f0',
                              boxShadow: isChecked ? '0 2px 8px rgba(5, 150, 105, 0.10)' : 'none',
                              transition: 'all 0.18s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                              {/* Visual Numbered Rank Circle (Shows 1, 2, 3... on click, or centered Plus icon when unselected) */}
                              <div style={{
                                width: '28px',
                                height: '28px',
                                minWidth: '28px',
                                minHeight: '28px',
                                borderRadius: '50%',
                                backgroundColor: isChecked ? '#059669' : '#f8fafc',
                                color: isChecked ? '#ffffff' : '#64748b',
                                border: isChecked ? '2px solid #047857' : '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '13px',
                                lineHeight: 1,
                                flexShrink: 0,
                                boxShadow: isChecked ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
                                transition: 'all 0.18s ease'
                              }}>
                                {isChecked ? (
                                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                                    {orderNum}
                                  </span>
                                ) : (
                                  <Plus size={14} strokeWidth={2.6} color="#64748b" style={{ display: 'block' }} />
                                )}
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '13px', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#065f46' : '#1e293b' }}>
                                    {f.label}
                                  </span>
                                  {isChecked && (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor: '#dcfce7',
                                      color: '#15803d',
                                      border: '1px solid #86efac',
                                      padding: '1px 7px',
                                      borderRadius: '10px'
                                    }}>
                                      #{orderNum} ({rankLabel})
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                                  {f.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. FINAL REPORT VISUAL PREVIEW */}
            {/* ========================================================= */}
            <div style={{ marginTop: '36px', borderTop: '2px solid #059669', paddingTop: '28px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={20} color="#059669" />
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    4. Final Report Visual Preview ({orderedColumns.length} Columns)
                  </h2>
                </div>

                <div style={{
                  padding: '5px 14px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#047857'
                }}>
                  Target: {formData.targetTrust || 'All Trusts'} • {formData.category}
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-8px', marginBottom: '16px' }}>
                Live preview of how the final report table and column sequence will be displayed on the Trust Admin portal and in Excel exports.
              </p>

              {/* Real-time Table Header Visualizer */}
              <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <table className="trust-table" style={{ margin: 0, width: '100%' }}>
                  <thead style={{ backgroundColor: '#059669', color: '#ffffff' }}>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center', backgroundColor: '#047857', color: '#ffffff', fontSize: '12px', padding: '12px 10px' }}>#</th>
                      {orderedColumns.map((col, idx) => (
                        <th
                          key={col.key + '_' + idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? '#059669' : '#047857',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            padding: '12px 14px'
                          }}
                        >
                          <span style={{ opacity: 0.85, fontSize: '10.5px', marginRight: '5px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 5px', borderRadius: '4px' }}>
                            Col {idx + 1}
                          </span>
                          <span>{col.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 5. SAVE & PUBLISHING ACTIONS */}
            {/* ========================================================= */}
            <div className="form-actions-row" style={{ marginTop: '36px', borderTop: '1px solid #e2e8f0', paddingTop: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn-trust-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 34px', fontSize: '15px', fontWeight: 700 }}
                >
                  <Save size={18} />
                  <span>{isSubmitting ? 'Saving Report...' : (editId ? 'Update Report & Columns' : 'Save & Publish Custom Report')}</span>
                </button>

                <button
                  type="button"
                  className="btn-trust-secondary"
                  onClick={() => navigate(isSuperAdminRoute ? '/superadmin/all-reports' : '/trust/reports')}
                  style={{ padding: '13px 26px', fontSize: '14.5px' }}
                >
                  Cancel
                </button>
              </div>

              {editId && (
                <div>
                  <button
                    type="button"
                    onClick={handleDeleteReport}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    title="Permanently delete this report"
                  >
                    <Trash2 size={16} />
                    <span>Delete Report</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
