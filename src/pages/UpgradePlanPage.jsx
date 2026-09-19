import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import {
  Boxes,
  FileText,
  Calculator,
  HelpCircle,
  Mail,
  Phone,
  Video,
  Check,
  ChevronUp,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

export default function UpgradePlanPage({ user }) {
  const navigate = useNavigate();

  const DEFAULT_PLANS = [
    {
      id: 'standard',
      code: 'standard',
      name: 'Standard',
      price: 4000,
      adminUsers: 1,
      staffUsers: '4 Staff Users'
    },
    {
      id: 'advanced',
      code: 'advanced',
      name: 'Advanced',
      price: 7000,
      adminUsers: 1,
      staffUsers: '9 Staff Users'
    },
    {
      id: 'enterprise',
      code: 'enterprise',
      name: 'Enterprise',
      price: 10000,
      adminUsers: 1,
      staffUsers: 'Unlimited Staff'
    }
  ];

  // Resolve active logged-in trust session
  const activeSessionUser = (!isSuperUser(user) && user) || getTrustSession()?.user || {};
  const [liveUser, setLiveUser] = useState(activeSessionUser);

  const currentPlanName = liveUser?.plan || activeSessionUser?.plan || 'Standard';

  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const pLower = currentPlanName.toLowerCase();
    if (pLower.includes('standard')) return 'advanced';
    if (pLower.includes('advanced')) return 'enterprise';
    if (pLower.includes('starter')) return 'standard';
    return 'enterprise';
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch live user data for up-to-date plan status
  useEffect(() => {
    const targetId = activeSessionUser?._id || activeSessionUser?.id || activeSessionUser?.email;
    if (targetId) {
      fetch(`/api/users/${encodeURIComponent(targetId)}`)
        .then(r => r.json())
        .then(d => {
          const u = d?.data || d?.user || (d?.email ? d : null);
          if (u) {
            setLiveUser(u);
            if (u.name || u.trustName) {
              setFormData(prev => ({
                ...prev,
                name: u.trustName || u.name || prev.name,
                email: u.email || prev.email,
                mobile: u.mobile || u.phone || prev.mobile,
                address: u.address || prev.address,
                state: u.state || prev.state
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, [activeSessionUser?.email]);

  // Fetch active plans from backend
  useEffect(() => {
    fetch('/api/plans?status=Active')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          const mapped = d.data.map(p => ({
            id: p.code || p._id,
            code: p.code || p._id,
            name: p.name,
            price: Number(p.price) || 4000,
            adminUsers: 1,
            staffUsers: p.staffUserLimit || '4 Staff Users'
          }));
          setPlans(mapped);

          // Auto-select next higher tier if available
          const currLower = currentPlanName.toLowerCase();
          const nextPlan = mapped.find(p => {
            const pCode = (p.code || p.id || p.name).toLowerCase();
            if (currLower.includes('standard')) return pCode.includes('advanced') || pCode.includes('enterprise');
            if (currLower.includes('advanced')) return pCode.includes('enterprise');
            if (currLower.includes('starter')) return pCode.includes('standard');
            return false;
          });

          if (nextPlan) {
            setSelectedPlanId(nextPlan.id);
          } else if (mapped.length > 0 && !mapped.some(p => p.id === selectedPlanId)) {
            setSelectedPlanId(mapped[0].id);
          }
        }
      })
      .catch(console.error);
  }, [currentPlanName]);

  // Billing Details Form Data
  const [formData, setFormData] = useState({
    name: activeSessionUser?.trustName || activeSessionUser?.name || '',
    email: activeSessionUser?.email || '',
    mobile: activeSessionUser?.mobile || activeSessionUser?.phone || '',
    address: activeSessionUser?.address || '',
    state: activeSessionUser?.state || 'Tamil Nadu',
    gstin: ''
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, mobile: numericVal }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentPlanUsers = (planName) => {
    const pl = (planName || '').toLowerCase();
    if (pl.includes('enterprise')) return 'Unlimited Staff';
    if (pl.includes('advanced')) return '9 Staff Users';
    if (pl.includes('starter')) return '1 Staff User';
    return '4 Staff Users';
  };

  // Math Calculations:
  const remainingDays = 333;
  const remainingCredit = 1094.79;

  const currentSelectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const isSelectedSameAsCurrent = (currentSelectedPlan?.name || '').toLowerCase() === currentPlanName.toLowerCase();

  const newPlanProRata = (currentSelectedPlan.price / 365) * remainingDays;
  const upgradeAmount = isSelectedSameAsCurrent ? '0.00' : Math.max(0, (newPlanProRata - remainingCredit)).toFixed(2);
  const gstAmount = (parseFloat(upgradeAmount) * 0.18).toFixed(2);
  const grandTotal = (parseFloat(upgradeAmount) + parseFloat(gstAmount)).toFixed(2);

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Trigger Razorpay Checkout on Upgrade Now
  const handleUpgradeWithRazorpay = async (e) => {
    e.preventDefault();

    if (isSelectedSameAsCurrent) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Already on this Plan',
        message: `Your trust is currently active on the ${currentPlanName} plan. Please choose a different plan above to upgrade.`,
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.address.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Required Details',
        message: 'Please complete all required fields marked with *.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Email Address',
        message: 'Please enter a valid email address (e.g. admin@trust.org).',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (formData.mobile.trim().length !== 10) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Mobile Number',
        message: 'Mobile number must be exactly 10 digits.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Ensure Razorpay script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
      }

      // 2. Create order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(grandTotal),
          plan: currentSelectedPlan.name,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize payment order');
      }

      // 3. Open Razorpay Checkout Window
      const options = {
        key: data.keyId || 'rzp_test_TdnRfnHpDeyWqd',
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'DonationReceipt.in',
        description: `Upgrade to ${currentSelectedPlan.name} Plan`,
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=128&auto=format&fit=crop&q=80',
        ...(data.isRealOrder && data.order?.id ? { order_id: data.order.id } : {}),
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.mobile
        },
        notes: {
          trust_name: formData.name,
          new_plan: currentSelectedPlan.name,
          address: formData.address,
          state: formData.state
        },
        theme: {
          color: '#28a745'
        },
        handler: async function (paymentResponse) {
          try {
            await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResponse,
                email: formData.email,
                plan: currentSelectedPlan.name
              })
            });
          } catch (err) {
            console.error('Verification error:', err);
          }

          setPopup({
            isOpen: true,
            type: 'success',
            title: 'Upgrade Successful!',
            message: `Congratulations! Your subscription has been successfully upgraded to the ${currentSelectedPlan.name} Plan. Total Paid: ₹${grandTotal} (Payment ID: ${paymentResponse.razorpay_payment_id || 'pay_success'})`,
            onConfirm: () => {
              setPopup(p => ({ ...p, isOpen: false }));
              navigate('/trust/staff');
            }
          });
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failedResponse) {
        setIsProcessing(false);
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Payment Cancelled or Failed',
          message: failedResponse.error?.description || 'The transaction could not be processed. Please try again.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Razorpay launch error:', error);
      setIsProcessing(false);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Payment Gateway Notice',
        message: error.message || 'Unable to connect to Razorpay. Please try again.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const indianStates = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>SUBSCRIPTION UPGRADE</span>
          </div>
          <h1 className="mint-hero-title">Upgrade Subscription</h1>
          <p className="mint-hero-subtitle">
            Unlock more admin users, expanded staff capacity, and premium trust management tools.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* ================= SECTION 1: CHOOSE SUBSCRIPTION PLAN ================= */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            marginBottom: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              backgroundColor: '#28a745',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            <Boxes size={18} />
            <span>1. Choose Subscription Plan</span>
          </div>

          <div style={{ padding: '22px 20px' }}>
            {/* Current Plan Active Status Strip */}
            <div
              style={{
                backgroundColor: '#e0f2fe',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                padding: '12px 18px',
                marginBottom: '24px',
                fontSize: '13.5px',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap'
              }}
            >
              <span>Current Active Plan : <strong style={{ color: '#0c4a6e', fontSize: '14px' }}>{currentPlanName}</strong></span>
              <span style={{ color: '#7dd3fc' }}>|</span>
              <span>Staff Users Allowed : <strong style={{ color: '#0c4a6e' }}>{getCurrentPlanUsers(currentPlanName)}</strong></span>
              <span style={{ color: '#7dd3fc' }}>|</span>
              <span>Remaining Days : <strong style={{ color: '#0c4a6e' }}>{remainingDays}</strong></span>
              <span style={{ color: '#7dd3fc' }}>|</span>
              <span>Status : <strong style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>● Active Subscribed</strong></span>
            </div>

            {/* Plan Cards Grid */}
            <div className="upgrade-plans-grid">
              {plans.map(p => {
                const isCurrentPlan = (p.code || p.id || p.name || '').toLowerCase() === currentPlanName.toLowerCase();
                const isSelected = p.id === selectedPlanId;

                return (
                  <div
                    key={p.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      border: isSelected
                        ? '2px solid #28a745'
                        : (isCurrentPlan ? '2px solid #28a745' : '1px solid #dee2e6'),
                      boxShadow: isSelected
                        ? '0 6px 20px rgba(40, 167, 69, 0.25)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: '#ffffff',
                          color: '#166534',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          letterSpacing: '0.4px',
                          zIndex: 2
                        }}
                      >
                        <ShieldCheck size={13} color="#166534" strokeWidth={2.5} />
                        <span>CURRENT PLAN</span>
                      </div>
                    )}

                    {/* Top Green Portion - Original #28a745 Green */}
                    <div
                      style={{
                        backgroundColor: '#28a745',
                        color: '#ffffff',
                        padding: '18px 16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{p.name}</div>
                      <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0 2px 0' }}>
                        ₹{p.price.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.95 }}>+18% GST / Year</div>
                    </div>

                    {/* Bottom White Portion */}
                    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#212529' }}>
                          <Check size={16} color="#28a745" strokeWidth={3} />
                          <span>{p.adminUsers} Admin User</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#212529' }}>
                          <Check size={16} color="#28a745" strokeWidth={3} />
                          <span>{p.staffUsers}</span>
                        </div>
                      </div>

                      {/* Button Actions */}
                      {isCurrentPlan ? (
                        <button
                          type="button"
                          disabled
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1.5px solid #86efac',
                            borderRadius: '4px',
                            padding: '8px 0',
                            width: '100%',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'default'
                          }}
                        >
                          <Check size={15} color="#166534" strokeWidth={3} />
                          <span>Your Current Plan</span>
                        </button>
                      ) : isSelected ? (
                        <button
                          type="button"
                          style={{
                            backgroundColor: '#28a745',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px 0',
                            width: '100%',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'default'
                          }}
                        >
                          <Check size={15} strokeWidth={3} />
                          <span>Selected for Upgrade</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPlanId(p.id)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#28a745',
                            border: '1px solid #28a745',
                            borderRadius: '4px',
                            padding: '8px 0',
                            width: '100%',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#28a745';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#28a745';
                          }}
                        >
                          Select to Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: BILLING DETAILS ================= */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            marginBottom: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              backgroundColor: '#28a745',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            <FileText size={18} />
            <span>2. Billing Details</span>
          </div>

          <div style={{ padding: '22px 20px' }}>
            {/* Row 1: Name, Email, Mobile */}
            <div className="upgrade-billing-grid-3col" style={{ marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  Email <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  Mobile <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057'
                  }}
                />
              </div>
            </div>

            {/* Row 2: Address, State, GSTIN */}
            <div className="upgrade-billing-grid-3col">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057',
                    resize: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057',
                    background: '#ffffff'
                  }}
                >
                  {indianStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '6px' }}>
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: UPGRADE SUMMARY ================= */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            marginBottom: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              backgroundColor: '#28a745',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            <Calculator size={18} />
            <span>3. Upgrade Summary</span>
          </div>

          <div style={{ padding: '22px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', marginBottom: '22px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Current Active Plan</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: '#0284c7' }}>
                    {currentPlanName}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Remaining Credit Balance</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#212529' }}>₹ {remainingCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Selected Upgrade Plan</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: isSelectedSameAsCurrent ? '#0284c7' : '#28a745' }}>
                    {currentSelectedPlan.name}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Upgrade Amount</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#212529' }}>₹ {parseFloat(upgradeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>GST (18%)</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#212529' }}>₹ {parseFloat(gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 0 0 0', fontWeight: '700', color: '#212529', fontSize: '14.5px' }}>Grand Total</td>
                  <td style={{ padding: '14px 0 0 0', textAlign: 'right', fontWeight: '800', color: '#28a745', fontSize: '17px' }}>
                    ₹ {parseFloat(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Same Plan Notice Banner */}
            {isSelectedSameAsCurrent ? (
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  color: '#0369a1',
                  fontSize: '13px',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}
              >
                You are currently active on the <strong>{currentPlanName}</strong> plan. Please select a different plan in Step 1 to proceed with an upgrade.
              </div>
            ) : null}

            {/* Centered Upgrade Now Button */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleUpgradeWithRazorpay}
                disabled={isProcessing || isSelectedSameAsCurrent}
                className="upgrade-submit-btn"
                style={{
                  backgroundColor: isSelectedSameAsCurrent ? '#94a3b8' : '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 48px',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  cursor: isSelectedSameAsCurrent ? 'not-allowed' : (isProcessing ? 'wait' : 'pointer'),
                  boxShadow: isSelectedSameAsCurrent ? 'none' : '0 2px 6px rgba(40, 167, 69, 0.35)',
                  transition: 'background-color 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => !isProcessing && !isSelectedSameAsCurrent && (e.currentTarget.style.backgroundColor = '#218838')}
                onMouseOut={(e) => !isProcessing && !isSelectedSameAsCurrent && (e.currentTarget.style.backgroundColor = '#28a745')}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <span>Upgrade Now</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= SECTION 4: NEED HELP? ================= */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              backgroundColor: '#28a745',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            <HelpCircle size={18} />
            <span>4. Need Help?</span>
          </div>

          <div style={{ padding: '22px 20px' }}>
            <p style={{ fontSize: '13.5px', color: '#495057', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              If you have any questions regarding subscriptions, custom NGO billing, or enterprise onboarding, please reach out directly:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#212529' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="#28a745" />
                <span>Email : <a href="mailto:support@donationreceipt.in" style={{ color: '#007bff', textDecoration: 'none' }}>support@donationreceipt.in</a></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="#28a745" />
                <span>Helpline : <strong style={{ color: '#212529' }}>+91 98765 43210</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '80px',
            backgroundColor: '#28a745',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 999
          }}
        >
          <ChevronUp size={22} />
        </button>
      )}

      {/* Themed Confirmation & Notification Modal */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText="OK"
        onConfirm={popup.onConfirm}
      />
    </>
  );
}
