import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import { Lock, FileText, CheckCircle2, AlertCircle, Upload, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { setTrustSession } from '../utils/authStorage';

const INDIAN_STATES = [
  'Andaman Nicobar',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    trustName: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
    state: '',
    plan: 'Standard',
    registrationNo: '',
    panNo: '',
    website: '',
    contactPerson: '',
    contactPersonEmail: '',
    contactPersonMobile: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pending Approval Modal State
  const [pendingApprovalModal, setPendingApprovalModal] = useState({
    isOpen: false,
    trustName: '',
    email: '',
    plan: '',
    paymentId: '',
    amount: ''
  });

  // Dynamically load active plans from SuperAdmin plans API
  useEffect(() => {
    fetch('/api/plans?status=Active')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setPlans(d.data);
          setFormData(prev => ({
            ...prev,
            plan: prev.plan || d.data[0].name
          }));
        } else {
          // Fallback to all plans if no Active query match
          fetch('/api/plans')
            .then(r2 => r2.json())
            .then(d2 => {
              if (d2.success && Array.isArray(d2.data) && d2.data.length > 0) {
                setPlans(d2.data);
                setFormData(prev => ({
                  ...prev,
                  plan: prev.plan || d2.data[0].name
                }));
              }
            })
            .catch(err2 => console.error('Error fetching fallback plans:', err2));
        }
      })
      .catch(err => console.error('Error fetching plans in register page:', err));
  }, []);

  // Helper to load Razorpay checkout script if not present
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

  const getSelectedPlanPrice = () => {
    const selected = plans.find(p => p.name === formData.plan || p._id === formData.plan);
    if (selected && Number(selected.price)) {
      return Number(selected.price);
    }
    const nameLower = (formData.plan || '').toLowerCase();
    if (nameLower.includes('enterprise')) return 10000;
    if (nameLower.includes('advanced')) return 7000;
    if (nameLower.includes('starter')) return 1999;
    return 4000; // Standard default
  };

  const planBasePrice = getSelectedPlanPrice();
  const planGst = parseFloat((planBasePrice * 0.18).toFixed(2));
  const planGrandTotal = (planBasePrice + planGst).toFixed(2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile' || name === 'contactPersonMobile') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericVal }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must not exceed 2MB');
        e.target.value = null;
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }
      setError('');
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.trustName.trim()) {
      setError('Please enter your Trust / NGO Name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid Trust Email address (e.g. admin@yourngo.org).');
      return;
    }

    if (!formData.mobile || formData.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (formData.contactPersonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail.trim())) {
      setError('Please enter a valid Contact Person Email address.');
      return;
    }

    if (formData.contactPersonMobile && formData.contactPersonMobile.length !== 10) {
      setError('Contact Person Mobile number must be exactly 10 digits.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Please enter a password of at least 6 characters.');
      return;
    }

    if (!agreedPrivacy) {
      setError('Please agree to the Privacy Policy to continue.');
      return;
    }

    if (!formData.state) {
      setError('Please select your State.');
      return;
    }

    setLoading(true);

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
      }

      // 2. Create order on backend for plan payment
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(planGrandTotal),
          plan: formData.plan,
          name: formData.trustName || formData.contactPerson,
          email: formData.email,
          mobile: formData.mobile
        })
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize subscription payment order');
      }

      // 3. Open Razorpay Checkout Window
      const options = {
        key: orderData.keyId || 'rzp_test_TdnRfnHpDeyWqd',
        amount: orderData.order.amount,
        currency: orderData.order.currency || 'INR',
        name: 'DonationReceipt.in',
        description: `${formData.plan} Plan Subscription Registration`,
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=128&auto=format&fit=crop&q=80',
        ...(orderData.isRealOrder && orderData.order?.id ? { order_id: orderData.order.id } : {}),
        prefill: {
          name: formData.contactPerson || formData.trustName,
          email: formData.email,
          contact: formData.mobile
        },
        notes: {
          trustName: formData.trustName,
          plan: formData.plan,
          state: formData.state,
          amount: planGrandTotal
        },
        theme: {
          color: '#00a651'
        },
        handler: async function (paymentResponse) {
          setLoading(true);
          try {
            const rawPrefix = (formData.trustName || 'REC')
              .replace(/[^a-zA-Z]/g, '')
              .slice(0, 4)
              .toUpperCase() || 'REC';

            const payload = {
              ...formData,
              logo: logoPreview || '',
              status: 'Pending',
              paymentStatus: 'Paid',
              paymentId: paymentResponse.razorpay_payment_id || 'pay_success_' + Date.now(),
              orderId: paymentResponse.razorpay_order_id || '',
              paidAmount: planGrandTotal,
              receiptPrefix: `${rawPrefix}/2026-27/`,
              receiptStartNumber: '1',
              receiptWatermarkText: rawPrefix
            };

            const regRes = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const regData = await regRes.json();

            if (regData.success) {
              setPendingApprovalModal({
                isOpen: true,
                trustName: formData.trustName,
                email: formData.email,
                plan: formData.plan,
                paymentId: paymentResponse.razorpay_payment_id || 'pay_success_' + Date.now(),
                amount: planGrandTotal
              });
            } else {
              setError(regData.message || 'Registration error occurred. Please contact support.');
            }
          } catch (regErr) {
            console.error('Registration processing error:', regErr);
            setError('Payment succeeded (' + (paymentResponse.razorpay_payment_id || '') + '), but registration encountered an error. Please contact administrator.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failedResponse) {
        setLoading(false);
        setError(failedResponse.error?.description || 'Subscription payment was not completed. Please try again to complete registration.');
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Payment launch error:', err);
      setError(err.message || 'Unable to start payment checkout. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Top green accent strip */}
      <div style={{ height: '4px', backgroundColor: '#00a651', width: '100%' }}></div>

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #eef2f5', padding: '10px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/trust/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={navLogo} alt="Donation Receipt" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.4px'
              }}
            >
              ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/trust/register"
              style={{
                backgroundColor: '#00a651',
                color: '#ffffff',
                padding: '7px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Registration
            </Link>
            <Link
              to="/trust/login"
              style={{
                border: '1px solid #ced4da',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333333',
                textDecoration: 'none'
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Green Divider Strip */}
      <div style={{ backgroundColor: '#00a651', height: '5px', width: '100%' }}></div>

      {/* Registration Card Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 15px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '820px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

            {/* Green Header Banner */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', textAlign: 'center', padding: '26px 20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Create Your Admin Account
              </h2>
              <p style={{ fontSize: '15px', fontWeight: '600', margin: 0, opacity: 0.95 }}>
                Register to Admin Portal
              </p>
            </div>

            {/* Card Content Form */}
            <div style={{ padding: '32px 30px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', fontSize: '13.5px', marginBottom: '20px' }}>
                  <AlertCircle size={18} flexShrink={0} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '6px', fontSize: '13.5px', marginBottom: '20px' }}>
                  <CheckCircle2 size={18} flexShrink={0} />
                  <span>{successMsg} Redirecting to your dashboard...</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eafaf1' }}>
                  <FileText size={20} color="#00a651" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    NGO Registration Form
                  </h3>
                </div>

                {/* Form Fields Grid: 2 columns on desktop, 1 on small screens */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                  {/* Trust / NGO Name * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="trustName"
                      required
                      placeholder="Enter Trust / NGO Name"
                      value={formData.trustName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email ID * (This cannot be changed later) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Email ID <span style={{ color: '#ef4444' }}>*</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (This cannot be changed later)
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@yourngo.org"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Password * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>{' '}
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                        (Min. 6 characters)
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        minLength={6}
                        placeholder="Create account password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 42px 10px 14px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Number * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Registered street address / city"
                      value={formData.address}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* State * (Select State + 36 Indian states & union territories) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      State <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subscription Plan * (Dynamic from SuperAdmin Plans) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Select Subscription Plan <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="plan"
                      required
                      value={formData.plan}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#065f46',
                        border: '1.5px solid #00a651',
                        borderRadius: '4px',
                        outline: 'none',
                        backgroundColor: '#f0fdf4',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      {plans && plans.length > 0 ? (
                        plans.map(p => (
                          <option key={p._id || p.name} value={p.name}>
                            ⭐ {p.name} Plan — ₹{Number(p.price).toLocaleString('en-IN')}/{p.billingCycle || 'Year'} ({p.staffUserLimit || 'Staff Access'})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Standard">⭐ Standard Plan — ₹4,000/Annual (4 Staff Users)</option>
                          <option value="Advanced">⭐ Advanced Plan — ₹7,000/Annual (9 Staff Users)</option>
                          <option value="Enterprise">⭐ Enterprise Plan — ₹10,000/Annual (20 Staff Users)</option>
                        </>
                      )}
                    </select>
                    {/* <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Includes 48-Hour Free Trial access to your selected plan features.
                    </p> */}
                    <div style={{ marginTop: '8px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12.5px', color: '#166534' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>Base Subscription Fee:</span>
                        <span style={{ fontWeight: 600 }}>₹{planBasePrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>GST (18%):</span>
                        <span style={{ fontWeight: 600 }}>₹{planGst.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed #86efac', paddingTop: '4px', fontSize: '13px', color: '#065f46' }}>
                        <span>Total Payable at Registration:</span>
                        <span>₹{Number(planGrandTotal).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust/NGO Registration Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNo"
                      placeholder="e.g. U85300TN2021NPL142443 / 123/2021"
                      value={formData.registrationNo}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Trust/NGO PAN Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNo"
                      maxLength={10}
                      placeholder="e.g. AAATT1234K"
                      value={formData.panNo}
                      onChange={(e) => setFormData(p => ({ ...p, panNo: e.target.value.toUpperCase() }))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      placeholder="e.g. https://www.yourngo.org"
                      value={formData.website}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Contact Person Email * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="contactPersonEmail"
                      required
                      placeholder="person@yourngo.org"
                      value={formData.contactPersonEmail}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Contact Person Mobile * */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Contact Person Mobile <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactPersonMobile"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={formData.contactPersonMobile}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Trust/NGO Logo (Type: jpg, Max. size: 2MB) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                      Trust/NGO Logo (Type: jpg, Max. size: 2MB)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        onChange={handleLogoChange}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13.5px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      {logoPreview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>
                          <img src={logoPreview} alt="Logo preview" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                          <span style={{ fontSize: '12px', color: '#00a651', fontWeight: '600' }}>✓ Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy Policy Checkbox */}
                <div style={{ marginTop: '22px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    required
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00a651', marginTop: '2px' }}
                  />
                  <label htmlFor="agreePrivacy" style={{ fontSize: '13.5px', color: '#334155', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the{' '}
                    <Link
                      to="/trust/privacy-policy"
                      target="_blank"
                      style={{ color: '#00a651', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button: Pay & Register */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#00a651',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    fontSize: '15.5px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '22px',
                    boxShadow: '0 3px 10px rgba(0, 166, 81, 0.3)',
                    transition: 'background-color 0.2s',
                    letterSpacing: '-0.2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <span>Opening Razorpay Payment Gateway...</span>
                  ) : (
                    <span>Proceed to Pay ₹{Number(planGrandTotal).toLocaleString('en-IN')} &amp; Register</span>
                  )}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              {/* Already Registered Link */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  Already Registered?{' '}
                  <Link
                    to="/trust/login"
                    style={{ color: '#00a651', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Login to Your Account.
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer inside card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                textAlign: 'center',
                borderTop: '1px solid #eef2f6',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} color="#00a651" />
              <Link
                to="/superadmin/login"
                style={{
                  color: '#00a651',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Go To Super Admin Portal <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Support Contacts */}
          <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#6c757d', lineHeight: '1.7' }}>
            Need help?{' '}
            <a href="mailto:support@donationreceipt.in" style={{ color: '#00a651', fontWeight: '600' }}>
              support@donationreceipt.in
            </a>
            <br />
            Call us:{' '}
            <a href="tel:+919082151500" style={{ color: '#00a651', fontWeight: '600' }}>
              +91 90821 51500
            </a>
          </div>
        </div>
      </div>

      {/* Pending Super Admin Approval Modal */}
      {pendingApprovalModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{ backgroundColor: '#00a651', padding: '24px 20px', textAlign: 'center', color: '#ffffff' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <CheckCircle2 size={32} color="#ffffff" />
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
                Registration &amp; Payment Successful!
              </h3>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                Your payment of ₹{pendingApprovalModal.amount} was received via Razorpay
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>
                  <span>⏳</span>
                  <span>Status: Pending Super Admin Approval</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                  Your trust organization registration is currently awaiting verification and activation by the <strong>Super Administrator</strong>. Once approved, you will be able to log in to your admin portal.
                </p>
              </div>

              {/* Order Info Summary */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Trust / Org Name:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{pendingApprovalModal.trustName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Login Email:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{pendingApprovalModal.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Subscription Plan:</span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>{pendingApprovalModal.plan} Plan</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#334155' }}>{pendingApprovalModal.paymentId}</span>
                </div>
              </div>

              <button
                type="button"
                style={{
                  width: '100%',
                  backgroundColor: '#00a651',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 166, 81, 0.3)'
                }}
                onClick={() => {
                  setPendingApprovalModal({ isOpen: false });
                  navigate('/trust/login');
                }}
              >
                Go to Login Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Website Footer Area */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #eef2f5', padding: '20px 0' }}>
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '13px',
            color: '#6c757d'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/trust/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/trust/cancellation-refund-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/trust/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
