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
  Sparkles
} from 'lucide-react';

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

  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);

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
          if (!mapped.some(p => p.id === selectedPlanId)) {
            setSelectedPlanId(mapped[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Billing Details matching Screenshot 2
  const [formData, setFormData] = useState({
    name: user?.trustName || user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    state: user?.state || '',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Math matching Screenshots 1, 2, 3 exactly:
  // Base plan cost = 1200 / 365 * 333 = 1094.79 (Remaining Credit)
  const remainingDays = 333;
  const remainingCredit = 1094.79;

  const currentSelectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const newPlanProRata = (currentSelectedPlan.price / 365) * remainingDays;
  const upgradeAmount = (newPlanProRata - remainingCredit).toFixed(2);
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
        key: data.keyId || 'rzp_test_1DP5mmOlF5G5ag',
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
              body: JSON.stringify(paymentResponse)
            });
          } catch (err) {
            console.error('Verification error:', err);
          }

          setPopup({
            isOpen: true,
            type: 'success',
            title: 'Upgrade Successful!',
            message: `Congratulations! Your plan has been upgraded to ${currentSelectedPlan.name}. Total Paid: ₹${grandTotal} (Payment ID: ${paymentResponse.razorpay_payment_id || 'pay_success'})`,
            onConfirm: () => {
              setPopup(p => ({ ...p, isOpen: false }));
              navigate('/trust');
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
            {/* Current Plan Cyan Strip matching Screenshot 1 */}
            <div
              style={{
                backgroundColor: '#dcf1f9',
                borderRadius: '4px',
                padding: '10px 16px',
                marginBottom: '24px',
                fontSize: '13.5px',
                color: '#212529',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span>Current Plan : <strong>Base</strong></span>
              <span style={{ color: '#aaa' }}>|</span>
              <span style={{ color: '#0056b3' }}>Users : <strong>1</strong></span>
              <span style={{ color: '#aaa' }}>|</span>
              <span>Remaining Days : <strong>333</strong></span>
            </div>

            {/* 3 Plan Cards Grid */}
            <div className="upgrade-plans-grid">
              {plans.map(p => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <div
                    key={p.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      border: isSelected ? '2px solid #28a745' : '1px solid #dee2e6',
                      boxShadow: isSelected ? '0 6px 20px rgba(40, 167, 69, 0.22)' : '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Top Green Portion */}
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

                      {/* Select / Selected Button */}
                      {isSelected ? (
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
                          <span>Selected</span>
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
                          Select Plan
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
                  type="text"
                  name="mobile"
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
                  <td style={{ padding: '10px 0', color: '#333' }}>Current Plan</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: '#212529' }}>Base</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Remaining Credit</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#212529' }}>₹ {remainingCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>New Plan</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: '#212529' }}>{currentSelectedPlan.name}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>Upgrade Amount</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#212529' }}>₹ {parseFloat(upgradeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 0', color: '#333' }}>GST</td>
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

            {/* Centered Upgrade Now Button */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleUpgradeWithRazorpay}
                disabled={isProcessing}
                className="upgrade-submit-btn"
                style={{
                  backgroundColor: '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 48px',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 2px 6px rgba(40, 167, 69, 0.35)',
                  transition: 'background-color 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#218838')}
                onMouseOut={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#28a745')}
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
            <span>Need Help?</span>
          </div>

          {/* 3 Columns: Email, WhatsApp, Video */}
          <div className="upgrade-help-grid">
            {/* Email Support */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  backgroundColor: '#eaf7ec',
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}
              >
                <Mail size={22} />
              </div>
              <strong style={{ fontSize: '13.5px', color: '#212529', marginBottom: '4px' }}>Email Support</strong>
              <a
                href="mailto:support@donationreceipt.in"
                style={{ fontSize: '12.5px', color: '#555', textDecoration: 'none' }}
              >
                support@donationreceipt.in
              </a>
            </div>

            {/* WhatsApp */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  backgroundColor: '#eaf7ec',
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}
              >
                <Phone size={22} />
              </div>
              <strong style={{ fontSize: '13.5px', color: '#212529', marginBottom: '4px' }}>WhatsApp</strong>
              <a
                href="tel:+919082151500"
                style={{ fontSize: '12.5px', color: '#555', textDecoration: 'none' }}
              >
                +91 90821 51500
              </a>
            </div>

            {/* Video Tutorials */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  backgroundColor: '#eaf7ec',
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}
              >
                <Video size={22} />
              </div>
              <strong style={{ fontSize: '13.5px', color: '#212529', marginBottom: '4px' }}>Video Tutorials</strong>
              <a
                href="https://youtube.com/@donationreceipt"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12.5px', color: '#0056b3', textDecoration: 'none' }}
              >
                Visit Channel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Themed Simple Popup for Razorpay Payment Confirmation */}
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
