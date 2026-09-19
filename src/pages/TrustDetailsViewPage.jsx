import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Building,
  Mail,
  Phone,
  Calendar,
  Shield,
  FileText,
  Users,
  UserCheck,
  CreditCard,
  IndianRupee,
  Search,
  Printer,
  ExternalLink,
  Edit2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  Award,
  Layers,
  HeartHandshake
} from 'lucide-react';

export default function TrustDetailsViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'receipts' | 'staff' | 'donors' | 'heads'
  const [receiptSearch, setReceiptSearch] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: null
  });

  const handleApproveTrust = async () => {
    if (!data?.user?._id) return;
    setPopup({
      isOpen: true,
      type: 'success',
      title: 'Approve Trust Account?',
      message: `Are you sure you want to approve "${data.user.trustName || data.user.name}"? This will activate their subscription (${data.user.plan || 'Standard'} Plan) and grant Admin Portal login access immediately.`,
      showCancel: true,
      confirmText: 'Yes, Approve & Activate',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`/api/users/${data.user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Active' })
          });
          const result = await res.json();
          if (result.success) {
            fetchTrustDetails();
            setPopup({
              isOpen: true,
              type: 'success',
              title: 'Trust Account Approved!',
              message: `Trust account "${data.user.trustName || data.user.name}" is now Active. The trust admin can log in right away.`,
              confirmText: 'OK',
              onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const fetchTrustDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${id}/summary`);
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        // Fallback to basic user endpoint if summary not available
        const basicRes = await fetch(`/api/users/${id}`);
        const basicData = await basicRes.json();
        if (basicData.success && basicData.data) {
          setData({
            user: basicData.data,
            stats: {
              totalReceipts: basicData.data.receiptsCount || 0,
              totalAmount: 0,
              totalStaff: 0,
              activeStaff: 0,
              totalDonors: 0
            },
            plan: { name: basicData.data.plan || 'Standard' },
            receipts: [],
            staff: [],
            donors: [],
            headsBreakdown: [],
            modesBreakdown: []
          });
        }
      }
    } catch (e) {
      console.error('Error fetching trust details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTrustDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-container-modern" style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block', color: '#10b981' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Loading Trust Profile & Details...</h2>
        <p style={{ fontSize: '14px', marginTop: '6px' }}>Fetching receipts, staff members, and statutory records.</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="dashboard-container-modern">
        <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Users Management', link: '/superadmin/users' }, { label: 'Trust Not Found' }]} />
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '20px' }}>
          <Building size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Trust Account Not Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            The requested organization record could not be found or has been removed.
          </p>
          <button type="button" className="btn-trust-primary" onClick={() => navigate('/superadmin/users')}>
            Back to Users Management
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, receipts = [], staff = [], donors = [], headsBreakdown = [], modesBreakdown = [], plan } = data;

  // Filter receipts
  const filteredReceipts = receipts.filter(r => {
    const q = receiptSearch.toLowerCase();
    if (!q) return true;
    return (
      (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
      (r.donorName && r.donorName.toLowerCase().includes(q)) ||
      (r.donationHead && r.donationHead.toLowerCase().includes(q)) ||
      (r.paymentMode && r.paymentMode.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q))
    );
  });

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const q = staffSearch.toLowerCase();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  // Filter donors
  const filteredDonors = donors.filter(d => {
    const q = donorSearch.toLowerCase();
    if (!q) return true;
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.phone && d.phone.includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.panNo && d.panNo.toLowerCase().includes(q))
    );
  });

  const handlePrintReceipt = (r) => {
    const url = r.receiptNo
      ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(r.receiptNo)}`
      : `/api/receipts/pdf?id=${encodeURIComponent(r._id)}`;
    window.open(url, '_blank');
  };

  const trustName = user.trustName || user.name || 'Trust Organization';

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb
        items={[
          { label: 'Super Admin', link: '/superadmin' },
          { label: 'Users Management', link: '/superadmin/users' },
          { label: trustName }
        ]}
      />

      {/* Hero Banner with Trust Profile */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)',
              flexShrink: 0
            }}
          >
            {trustName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div className="mint-hero-badge">
                <Building size={13} />
                <span>TRUST / NGO PROFILE</span>
              </div>
              <span className={`badge-pill ${user.status === 'Active' ? 'badge-success' : (user.status === 'Trial' ? 'badge-warning' : 'badge-danger')}`}>
                {user.status || 'Active'}
              </span>
              <span className="badge-pill badge-info" style={{ fontWeight: 600 }}>
                {user.plan || 'Standard'} Plan
              </span>
            </div>
            <h1 className="mint-hero-title" style={{ fontSize: '24px', marginBottom: '6px' }}>
              {trustName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#475569', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={13} style={{ color: '#10b981' }} /> {user.email}
              </span>
              {user.mobile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} style={{ color: '#10b981' }} /> {user.mobile}
                </span>
              )}
              {user.registrationNo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace' }}>
                  <Shield size={13} style={{ color: '#3b82f6' }} /> Reg: {user.registrationNo}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: '#64748b' }} /> Joined: {user.joinedDate || 'Recently'}
              </span>
            </div>
          </div>
        </div>

        <div className="mint-hero-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(user.status === 'Pending' || user.status === 'Pending Approval') && (
            <button
              type="button"
              className="btn-trust-primary"
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                boxShadow: '0 3px 8px rgba(5, 150, 105, 0.3)'
              }}
              onClick={handleApproveTrust}
            >
              <CheckCircle2 size={16} />
              <span>Approve Trust</span>
            </button>
          )}
          <button
            type="button"
            className="btn-trust-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
            onClick={() => navigate('/superadmin/users')}
          >
            <ArrowLeft size={16} />
            <span>Back to Users</span>
          </button>
          <button
            type="button"
            className="btn-trust-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
            onClick={() => navigate(`/superadmin/new-user?id=${user._id}`)}
          >
            <Edit2 size={16} />
            <span>Edit Trust Details</span>
          </button>
        </div>
      </div>

      {/* Pending Approval Action Banner */}
      {(user.status === 'Pending' || user.status === 'Pending Approval') && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#92400e' }}>
                Account Awaiting Super Admin Approval
              </div>
              <div style={{ fontSize: '13.5px', color: '#b45309', marginTop: '3px' }}>
                This trust admin has registered and completed subscription payment ({user.plan || 'Standard'} Plan{user.paidAmount ? ` • ₹${Number(user.paidAmount).toLocaleString('en-IN')}` : ''}{user.paymentId ? ` • Ref: ${user.paymentId}` : ''}).
                Admin portal access remains locked until approval.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-trust-primary"
            style={{
              backgroundColor: '#059669',
              borderColor: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              fontSize: '14.5px',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
            }}
            onClick={handleApproveTrust}
          >
            <CheckCircle2 size={18} />
            <span>Approve &amp; Activate Trust</span>
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="dashboard-stat-grid-modern" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-modern-card card-green">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><IndianRupee size={22} /></div>
            <span className="stat-modern-val">₹{(stats.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Total Donations Raised</span>
          </div>
        </div>

        <div className="stat-modern-card card-blue">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><FileText size={22} /></div>
            <span className="stat-modern-val">{stats.totalReceipts || 0}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Receipts Generated</span>
          </div>
        </div>

        <div className="stat-modern-card card-purple">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><Users size={22} /></div>
            <span className="stat-modern-val">{stats.totalStaff || 0}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Staff / Members</span>
          </div>
        </div>

        <div className="stat-modern-card card-amber">
          <div className="stat-modern-top">
            <div className="stat-modern-icon"><HeartHandshake size={22} /></div>
            <span className="stat-modern-val">{stats.totalDonors || 0}</span>
          </div>
          <div className="stat-modern-bottom">
            <span className="stat-modern-title">Active Donors</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="trust-card" style={{ padding: '8px 12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
        <button
          type="button"
          className={`btn-trust-secondary ${activeTab === 'overview' ? 'active' : ''}`}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'overview' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'overview' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'overview' ? '#059669' : '#475569',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('overview')}
        >
          <Building size={16} />
          <span>Trust Profile &amp; Compliance</span>
        </button>

        <button
          type="button"
          className={`btn-trust-secondary ${activeTab === 'receipts' ? 'active' : ''}`}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'receipts' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'receipts' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'receipts' ? '#059669' : '#475569',
            fontWeight: activeTab === 'receipts' ? 700 : 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('receipts')}
        >
          <FileText size={16} />
          <span>Receipts ({stats.totalReceipts || 0})</span>
        </button>

        <button
          type="button"
          className={`btn-trust-secondary ${activeTab === 'staff' ? 'active' : ''}`}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'staff' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'staff' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'staff' ? '#059669' : '#475569',
            fontWeight: activeTab === 'staff' ? 700 : 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('staff')}
        >
          <Users size={16} />
          <span>Members / Staff ({stats.totalStaff || 0})</span>
        </button>

        <button
          type="button"
          className={`btn-trust-secondary ${activeTab === 'donors' ? 'active' : ''}`}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'donors' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'donors' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'donors' ? '#059669' : '#475569',
            fontWeight: activeTab === 'donors' ? 700 : 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('donors')}
        >
          <HeartHandshake size={16} />
          <span>Donors ({stats.totalDonors || 0})</span>
        </button>

        <button
          type="button"
          className={`btn-trust-secondary ${activeTab === 'heads' ? 'active' : ''}`}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'heads' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'heads' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'heads' ? '#059669' : '#475569',
            fontWeight: activeTab === 'heads' ? 700 : 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('heads')}
        >
          <Layers size={16} />
          <span>Donation Heads</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PROFILE */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {/* Contact & Organization Details */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: '#10b981' }} />
              Organization &amp; Contact Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Primary Contact Person:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.contactPerson || user.name || 'Admin'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Official Email Address:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Primary Mobile Phone:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.mobile || 'N/A'}</span>
              </div>
              {user.contactPersonEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#64748b' }}>Contact Person Email:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.contactPersonEmail}</span>
                </div>
              )}
              {user.contactPersonMobile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#64748b' }}>Contact Person Mobile:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.contactPersonMobile}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Registered Address:</span>
                <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>
                  {user.address ? `${user.address}${user.state ? ', ' + user.state : ''}` : (user.state || 'N/A')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Official Website:</span>
                {user.website ? (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{user.website}</span>
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8' }}>N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* Statutory Compliance Details */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: '#3b82f6' }} />
              Statutory &amp; Legal Compliance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Trust Registration No:</span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  {user.registrationNo || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>PAN Card Number:</span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  {user.panNo || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Section 80G Reg Number:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.section80GRegNo || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>FCRA Registration No:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.fcraNo || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Subscription Plan:</span>
                <span className="badge-pill badge-info" style={{ fontWeight: 600 }}>{user.plan || 'Standard'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Account Role &amp; ID:</span>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{user.role || 'Admin'} ({user._id})</span>
              </div>
            </div>
          </div>

          {/* Breakdown by Donation Head */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#8b5cf6' }} />
              Donations by Head
            </h3>
            {headsBreakdown.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No receipts generated under this trust yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {headsBreakdown.map((hb, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{hb.head}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{hb.count} receipts</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>₹{hb.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown by Payment Mode */}
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: '#f59e0b' }} />
              Donations by Payment Mode
            </h3>
            {modesBreakdown.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No receipts generated under this trust yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modesBreakdown.map((mb, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{mb.mode}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{mb.count} transactions</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{mb.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS */}
      {activeTab === 'receipts' && (
        <div>
          <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div className="trust-search-wrapper" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
              <Search size={16} className="trust-search-icon" />
              <input
                type="text"
                placeholder="Search receipts by donor, head, mode..."
                className="trust-input trust-search-input"
                style={{ width: '100%' }}
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              Showing <strong>{filteredReceipts.length}</strong> of <strong>{receipts.length}</strong> receipts
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FileText size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>No Receipts Found</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {receipts.length === 0 ? 'This trust has not generated any receipts yet.' : 'No receipts match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="trust-table-wrapper trust-card">
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Donor Name</th>
                    <th>Donation Head</th>
                    <th>Amount (₹)</th>
                    <th>Payment Mode</th>
                    <th>Receipt Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map(r => (
                    <tr key={r._id}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                          {r.receiptNo}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.donorName}</div>
                        {r.phone && <span style={{ fontSize: '12px', color: '#64748b' }}>{r.phone}</span>}
                      </td>
                      <td>
                        <span className="badge-pill badge-info">{r.donationHead || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{r.paymentMode || 'Online / UPI'}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{r.receiptDate}</td>
                      <td>
                        <span className="badge-pill badge-success">{r.status || 'Active'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-trust-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handlePrintReceipt(r)}
                          title="View / Print PDF"
                        >
                          <Printer size={13} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAFF / MEMBERS */}
      {activeTab === 'staff' && (
        <div>
          <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div className="trust-search-wrapper" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
              <Search size={16} className="trust-search-icon" />
              <input
                type="text"
                placeholder="Search staff members by name, email, role..."
                className="trust-input trust-search-input"
                style={{ width: '100%' }}
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{filteredStaff.length}</strong> Registered Staff Members
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>No Staff Members Found</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {staff.length === 0 ? 'No team members or staff users are registered under this trust yet.' : 'No staff members match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="trust-table-wrapper trust-card">
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Added Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                          <Mail size={13} style={{ color: '#64748b' }} />
                          <span>{s.email}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{s.phone || 'N/A'}</td>
                      <td>
                        <span className="badge-pill badge-info">{s.role || 'Staff Member'}</span>
                      </td>
                      <td>
                        <span className={`badge-pill ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DONORS */}
      {activeTab === 'donors' && (
        <div>
          <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div className="trust-search-wrapper" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
              <Search size={16} className="trust-search-icon" />
              <input
                type="text"
                placeholder="Search donors by name, phone, PAN..."
                className="trust-input trust-search-input"
                style={{ width: '100%' }}
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{filteredDonors.length}</strong> Unique Donors
            </div>
          </div>

          {filteredDonors.length === 0 ? (
            <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <HeartHandshake size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>No Donors Found</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {donors.length === 0 ? 'No donor transactions recorded for this trust yet.' : 'No donors match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="trust-table-wrapper trust-card">
              <table className="trust-data-table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Phone</th>
                    <th>Email Address</th>
                    <th>PAN Card</th>
                    <th>Total Donated (₹)</th>
                    <th>Donations Count</th>
                    <th>Last Donation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((d, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{d.name}</td>
                      <td style={{ fontSize: '13px', color: '#334155' }}>{d.phone || 'N/A'}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{d.email || 'N/A'}</td>
                      <td>
                        {d.panNo ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{d.panNo}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>
                        ₹{d.totalDonated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{d.donationsCount}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{d.lastDonationDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DONATION HEADS */}
      {activeTab === 'heads' && (
        <div>
          <div className="trust-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#10b981' }} />
              Donation Heads &amp; Fund Summary
            </h3>
            {headsBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                No donation head transactions have been recorded for this trust yet.
              </p>
            ) : (
              <div className="trust-table-wrapper">
                <table className="trust-data-table">
                  <thead>
                    <tr>
                      <th>Donation Head Name</th>
                      <th>Total Receipts</th>
                      <th>Total Amount Collected (₹)</th>
                      <th>Share of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headsBreakdown.map((hb, i) => {
                      const share = stats.totalAmount > 0 ? ((hb.totalAmount / stats.totalAmount) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{hb.head}</td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{hb.count}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>
                            ₹{hb.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${share}%`, background: '#10b981', height: '100%' }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', minWidth: '35px' }}>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
