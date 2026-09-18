import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, Megaphone, Send, Save } from 'lucide-react';

export default function NewNotificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const editId = params.id || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Announcement',
    targetAudience: 'All Trusts',
    actionText: '',
    actionLink: '',
    status: 'Published'
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
      fetch(`/api/notifications/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const n = d.data;
            setFormData({
              title: n.title || '',
              message: n.message || '',
              category: n.category || 'Announcement',
              targetAudience: n.targetAudience || 'All Trusts',
              actionText: n.actionText || '',
              actionLink: n.actionLink || '',
              status: n.status || 'Published'
            });
          }
        })
        .catch(err => console.error('Error fetching notification:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Announcement Title and Message Body are required.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/notifications/${editId}` : '/api/notifications';
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
          title: editId ? 'Notification Updated' : 'Announcement Broadcasted',
          message: editId
            ? 'Broadcast notification updated successfully.'
            : 'New announcement broadcasted live to all trust admin dashboards.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate('/superadmin/notifications');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to broadcast update');
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'An error occurred while broadcasting update.',
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
            <span>{editId ? 'EDIT BROADCAST ALERT' : 'COMMUNICATION & BROADCAST CENTER'}</span>
          </div>
          <h1 className="mint-hero-title">
            {editId ? 'Edit Broadcast Announcement' : 'Broadcast New Update'}
          </h1>
          <p className="mint-hero-subtitle">
            Publish system announcements, new features, compliance advisories, and video tutorial alerts visible across all trust admin dashboards.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/superadmin/notifications')}
            title="View All Notifications"
          >
            <List size={16} />
            <span>All Notifications</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading notification details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Title, Category, Target Audience */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>
                  Announcement Title <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Form No. 10BD Statutory Updates"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Announcement">Announcement (General)</option>
                  <option value="Release">Feature Release</option>
                  <option value="Compliance">Statutory Compliance</option>
                  <option value="Tutorial">Video Tutorial</option>
                  <option value="Alert">Important Notice</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Target Audience</label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="All Trusts">All Trusts (Universal)</option>
                  <option value="Standard Plan">Standard Plan Trusts</option>
                  <option value="Premium Plan">Premium Pro Trusts</option>
                  <option value="Free Starter">Free Starter Accounts</option>
                </select>
              </div>
            </div>

            {/* ROW 2: Action Button Label, Target Link, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Action Button Text (optional)</label>
                <input
                  type="text"
                  name="actionText"
                  value={formData.actionText}
                  onChange={handleChange}
                  placeholder="e.g. Click here to check now, View Tutorial"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Target Link URL</label>
                <input
                  type="text"
                  name="actionLink"
                  value={formData.actionLink}
                  onChange={handleChange}
                  placeholder="e.g. /trust/donation-receipt, /trust/all-certificate, https://youtube..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Broadcast Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Published">Published (Active on Dashboards)</option>
                  <option value="Draft">Draft (Save Without Broadcasting)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* ROW 3: Message Body */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>
                Message Content / Announcement Body <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Detailed description of the announcement, changes made, or advisory instructions for trusts..."
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
                <Send size={16} />
                <span>{isSubmitting ? 'Publishing...' : editId ? 'Update Broadcast' : 'Publish & Broadcast Update'}</span>
              </button>

              <button
                type="button"
                className="btn-trust-outline"
                onClick={() => navigate('/superadmin/notifications')}
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
