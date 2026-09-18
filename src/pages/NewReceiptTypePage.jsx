import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, FileCheck2, Save } from 'lucide-react';

export default function NewReceiptTypePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is80GEligible: true,
    taxSection: 'Section 80G(5)(vi)',
    description: '',
    defaultNotes: 'Donation eligible for 50% deduction under Section 80G of Income Tax Act 1961.',
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
      fetch(`/api/receipt-types/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const t = d.data;
            setFormData({
              name: t.name || '',
              code: t.code || '',
              is80GEligible: Boolean(t.is80GEligible),
              taxSection: t.taxSection || 'Section 80G(5)(vi)',
              description: t.description || '',
              defaultNotes: t.defaultNotes || '',
              status: t.status || 'Active'
            });
          }
        })
        .catch(err => console.error('Error fetching receipt type:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Receipt Type Name is required.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/receipt-types/${editId}` : '/api/receipt-types';
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
          title: editId ? 'Receipt Type Updated' : 'Receipt Type Created',
          message: editId
            ? 'Receipt type settings have been updated successfully.'
            : 'New donation receipt type added. Trusts can now select this type during receipt creation.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/receipt-types');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to save receipt type');
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'An error occurred while saving the receipt type.',
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
            <span>{editId ? 'EDIT RECEIPT TYPE' : 'NEW RECEIPT TYPE ENTRY'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? 'Edit Receipt Type' : 'Create New Receipt Type'}
          </h1>
          <p className="mint-hero-subtitle">
            Define donation categories, 80G tax deductibility sections, and standard disclaimer notes for printed receipts.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/superadmin/receipt-types')}
            title="View All Receipt Types"
          >
            <List size={16} />
            <span>All Receipt Types</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading receipt type details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Type Name, Code, 80G Exemption */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Receipt Type Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Corpus Fund, Voluntary Contribution"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Type Identifier Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. CORPUS_FUND, VOLUNTARY"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>80G Tax Exemption Applicable</label>
                <div style={{ display: 'flex', gap: '18px', height: '38px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is80GEligible"
                      checked={formData.is80GEligible === true}
                      onChange={() => setFormData(p => ({ ...p, is80GEligible: true }))}
                      style={{ accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span>Yes (80G Tax Exempt)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is80GEligible"
                      checked={formData.is80GEligible === false}
                      onChange={() => setFormData(p => ({ ...p, is80GEligible: false }))}
                      style={{ accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span>No (Non-Exempt)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ROW 2: Tax Section, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Tax Section Clause</label>
                <input
                  type="text"
                  name="taxSection"
                  value={formData.taxSection}
                  onChange={handleChange}
                  placeholder="e.g. Section 80G(5)(vi), Section 35AC, Section 11(1)(d)"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Active">Active (Available for Trusts)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            {/* ROW 3: Description */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Scope / Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the purpose of this donation receipt category"
                style={inputStyle}
              />
            </div>

            {/* ROW 4: Default Notes */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>
                Default Notes on Printed Receipts
              </label>
              <textarea
                name="defaultNotes"
                value={formData.defaultNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Printed disclaimer at the bottom of the donation receipt PDF..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
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
                <span>{isSubmitting ? 'Saving...' : editId ? 'Update Receipt Type' : 'Save Receipt Type'}</span>
              </button>

              <button
                type="button"
                className="btn-trust-outline"
                onClick={() => navigate('/superadmin/receipt-types')}
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
