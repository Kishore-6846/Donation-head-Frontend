import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Mail, Phone, ChevronUp, Loader2, Users, Sparkles } from 'lucide-react';

export default function BuyStaffUsersPage({ user }) {
  const navigate = useNavigate();

  const [staffCount, setStaffCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const remainingDays = 333;
  const count = Math.max(1, parseInt(staffCount, 10) || 1);
  const userCharges = ((800 / 365) * remainingDays * count).toFixed(2);
  const gstAmount = (parseFloat(userCharges) * 0.18).toFixed(2);
  const grandTotal = (parseFloat(userCharges) + parseFloat(gstAmount)).toFixed(2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStaffCountChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9]+$/.test(val)) {
      setStaffCount(val);
    }
  };

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

  // Trigger Razorpay Checkout
  const handleBuyWithRazorpay = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.address.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Required Details',
        message: 'Please fill in all mandatory fields marked with *.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Ensure Razorpay checkout script is loaded
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
          staffCount: count,
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
        description: `Purchase ${count} Additional Staff User(s)`,
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=128&auto=format&fit=crop&q=80',
        ...(data.isRealOrder && data.order?.id ? { order_id: data.order.id } : {}),
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.mobile
        },
        notes: {
          trust_name: formData.name,
          address: formData.address,
          state: formData.state,
          staff_count: String(count)
        },
        theme: {
          color: '#10b981'
        },
        handler: async function (paymentResponse) {
          try {
            await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResponse,
                email: formData.email,
                staffCount: count
              })
            });
          } catch (err) {
            console.error('Verification error:', err);
          }

          setPopup({
            isOpen: true,
            type: 'success',
            title: 'Payment Successful!',
            message: `Payment of ₹${grandTotal} completed successfully via Razorpay! ${count} Additional Staff User(s) have been added to your trust account. (Payment ID: ${paymentResponse.razorpay_payment_id || 'pay_success'})`,
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
          message: failedResponse.error?.description || 'The payment was not completed. Please try again.',
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
            <span>STAFF EXPANSION</span>
          </div>
          <h1 className="mint-hero-title">Buy Staff Users</h1>
          <p className="mint-hero-subtitle">
            Scale your trust operations by adding staff members to your active subscription.
          </p>
        </div>
      </div>

      <div className="mint-table-card-container">
        <div className="buy-staff-grid">
          {/* ================= LEFT COLUMN ================= */}
          <div>

            {/* Current Subscription Card matching Screenshot 1 */}
            <div
              style={{
                backgroundColor: '#dcf1f9',
                borderRadius: '4px',
                padding: '20px 24px',
                marginBottom: '24px'
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#0e647d',
                  margin: '0 0 12px 0',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(14, 100, 125, 0.15)'
                }}
              >
                Current Subscription
              </h3>

              <div style={{ fontSize: '13.5px', lineHeight: '2', color: '#212529' }}>
                <div>
                  Plan : <strong>DonationReceipt.in Subscription - Base Plan</strong>
                </div>
                <div>
                  Valid Till : <strong>07-08-2027</strong>
                </div>
                <div>
                  Purchased Staff : <strong>0</strong>
                </div>
                <div>
                  Active Staff : <strong>0</strong>
                </div>
                <div>
                  Available Staff : <strong>0</strong>
                </div>
                <div>
                  Remaining Validity : <strong>333 Days</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleBuyWithRazorpay}>
              {/* Additional Staff Users Input */}
              <div style={{ marginBottom: '26px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#212529',
                    marginBottom: '8px'
                  }}
                >
                  Additional Staff Users <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={staffCount}
                  onChange={handleStaffCountChange}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 12px',
                    fontSize: '13.5px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#495057'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#80bdff';
                    e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#ced4da';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#28a745',
                    marginTop: '6px'
                  }}
                >
                  ₹800.00 per user per year (Pro-rata amount will be charged)
                </div>
              </div>

              {/* Billing Details Section */}
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#212529',
                  margin: '0 0 16px 0'
                }}
              >
                Billing Details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                {/* Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#212529',
                      marginBottom: '6px'
                    }}
                  >
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
                      fontSize: '13.5px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#495057'
                    }}
                  />
                </div>

                {/* Email and Mobile 2 Columns */}
                <div className="buy-staff-row-2col">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#212529',
                        marginBottom: '6px'
                      }}
                    >
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
                        fontSize: '13.5px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#495057'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#212529',
                        marginBottom: '6px'
                      }}
                    >
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
                        fontSize: '13.5px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#495057'
                      }}
                    />
                  </div>
                </div>

                {/* Address and State 2 Columns */}
                <div className="buy-staff-row-2col">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#212529',
                        marginBottom: '6px'
                      }}
                    >
                      Address <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      required
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#212529',
                        marginBottom: '6px'
                      }}
                    >
                      State <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '6px 12px',
                        fontSize: '13.5px',
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
                </div>

                {/* GSTIN */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#212529',
                      marginBottom: '6px'
                    }}
                  >
                    GSTIN (Optional)
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
                      fontSize: '13.5px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#495057'
                    }}
                  />
                </div>
              </div>

              {/* Payment Summary Section matching Screenshot 2 & 3 */}
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#212529',
                  margin: '0 0 16px 0'
                }}
              >
                Payment Summary
              </h2>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #dee2e6',
                  fontSize: '13.5px',
                  marginBottom: '20px'
                }}
              >
                <tbody>
                  <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px 14px', color: '#212529', width: '65%' }}>Additional Staff</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#212529' }}>{count}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px 14px', color: '#212529' }}>Remaining Days</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#212529' }}>{remainingDays}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px 14px', color: '#212529' }}>Additional User Charges</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#212529' }}>₹{userCharges}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px 14px', color: '#212529' }}>GST (18%)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#212529' }}>₹{gstAmount}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#ffffff', fontWeight: '700' }}>
                    <td style={{ padding: '12px 14px', color: '#212529' }}>Grand Total</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#212529' }}>₹{grandTotal}</td>
                  </tr>
                </tbody>
              </table>

              {/* Note Alert Box matching Screenshot 3 */}
              <div
                style={{
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '4px',
                  padding: '14px 18px',
                  fontSize: '13px',
                  color: '#0c5460',
                  lineHeight: '1.6',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <strong>Note:</strong>
                </div>
                <div>
                  Additional staff users will remain valid until <strong>07-08-2027</strong> .
                </div>
                <div>
                  Charges are calculated on a pro-rata basis for the remaining subscription period.
                </div>
              </div>

              {/* Green Submit Button with Razorpay action */}
              <div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="buy-staff-submit-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 28px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
                    }
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Opening Razorpay...</span>
                    </>
                  ) : (
                    <span>Buy Additional Users</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT COLUMN: SUPPORT ================= */}
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#212529',
                margin: '0 0 6px 0'
              }}
            >
              Support
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6c757d',
                margin: '0 0 16px 0',
                lineHeight: 1.4
              }}
            >
              For any help or query, please reach out to our Support team.
            </p>

            {/* Support Contact Box matching Screenshot 1 */}
            <div
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              {/* Row 1: Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #dee2e6'
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRight: '1px solid #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#333'
                  }}
                >
                  <Mail size={16} />
                </div>
                <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                  <a
                    href="mailto:support@donationreceipt.in"
                    style={{ color: '#212529', textDecoration: 'none' }}
                  >
                    support@donationreceipt.in
                  </a>
                </div>
              </div>

              {/* Row 2: WhatsApp / Phone */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff'
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRight: '1px solid #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#333'
                  }}
                >
                  <Phone size={16} />
                </div>
                <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                  <a
                    href="tel:+919082151500"
                    style={{ color: '#212529', textDecoration: 'none' }}
                  >
                    +91-90821 51500
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Themed Simple Popup for Order & Payment Confirmation */}
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
