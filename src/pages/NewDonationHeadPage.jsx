import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Menu, Sparkles, ListFilter } from 'lucide-react';

export default function NewDonationHeadPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isSuperAdmin =
    location.pathname.toLowerCase().startsWith('/superadmin') ||
    Boolean(user?.role && user.role.toLowerCase().includes('super')) ||
    Boolean(user?.isSuperAdmin);

  const targetListUrl = isSuperAdmin ? '/superadmin/donation-heads' : '/trust/donation-head';

  const activeUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; }
  })();
  const activeTrustName = activeUser?.trustName || activeUser?.name || '';

  const [headName, setHeadName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Themed simple popup state
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (editId) {
      // First check local storage
      try {
        const stored = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        const found = stored.find(s => s._id === editId);
        if (found) {
          const clean = (found.rawName || found.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
          setHeadName(clean);
        }
      } catch (e) {}

      fetch(`/api/donation-heads/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const clean = d.data.rawName || (d.data.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
            setHeadName(clean);
          }
        })
        .catch(console.error);
    }
  }, [editId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanHeadName = headName.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!cleanHeadName) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Input Required',
        message: 'Please enter a donation head name',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);

    // Call backend API
    try {
      if (editId) {
        await fetch(`/api/donation-heads/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanHeadName,
            isGlobal: isSuperAdmin,
            trustName: isSuperAdmin ? '' : activeTrustName
          })
        });

        try {
          const stored = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
          const updated = stored.map(s => s._id === editId ? { ...s, name: cleanHeadName, rawName: cleanHeadName } : s);
          localStorage.setItem('custom_donation_heads', JSON.stringify(updated));
        } catch (err) {}
      } else {
        const res = await fetch('/api/donation-heads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanHeadName,
            isGlobal: isSuperAdmin,
            createdBy: isSuperAdmin ? 'Super Admin' : (activeTrustName || activeUser?.email || 'Admin'),
            trustName: isSuperAdmin ? '' : activeTrustName,
            trustEmail: isSuperAdmin ? '' : (activeUser?.email || '')
          })
        });
        const d = await res.json();

        try {
          const stored = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
          const cleaned = stored.filter(s => {
            const sBase = (s.rawName || s.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
            return sBase !== cleanHeadName.toLowerCase();
          });
          if (d.success && d.data) {
            localStorage.setItem('custom_donation_heads', JSON.stringify([d.data, ...cleaned]));
          } else {
            localStorage.setItem('custom_donation_heads', JSON.stringify(cleaned));
          }
        } catch (err) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }

    const successMsg = editId ? 'Donation Head updated successfully!' : 'Donation Head added successfully!';
    setPopup({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: successMsg,
      onConfirm: () => {
        setPopup(p => ({ ...p, isOpen: false }));
        navigate(targetListUrl);
      }
    });

    setTimeout(() => {
      navigate(targetListUrl);
    }, 1200);
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{isSuperAdmin ? 'SUPER ADMIN • GLOBAL CATEGORIES' : 'ACCOUNTING CATEGORIES'}</span>
          </div>
          <h1 className="mint-hero-title">{editId ? 'Edit Donation Head' : 'Add New Donation Head'}</h1>
          <p className="mint-hero-subtitle">
            {isSuperAdmin
              ? 'Define universal cause categories that will be globally distributed to all trust accounts.'
              : 'Define purposeful cause classifications and categories for organizing your trust receipts.'}
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate(targetListUrl)}
            title="View All Donation Heads"
          >
            <Menu size={16} />
            <span>View All Heads</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '8px'
              }}
            >
              Donation Head Name
            </label>
            <input
              type="text"
              name="headName"
              placeholder="Enter Head Name"
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              autoFocus
              required
              style={{
                width: '340px',
                maxWidth: '100%',
                height: '38px',
                padding: '8px 13px',
                fontSize: '13.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#1e293b'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Left-aligned Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 36px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.38)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Themed Simple Popup for Add / Update */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
