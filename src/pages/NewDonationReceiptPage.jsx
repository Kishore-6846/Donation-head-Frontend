import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

// Accurate Indian Numbering System to Words Converter
function convertNumberToWords(num) {
  if (!num || isNaN(num) || Number(num) <= 0) return '';
  num = Math.floor(Number(num));
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  if (crore > 0) words += inWords(crore) + ' Crore ';
  if (lakh > 0) words += inWords(lakh) + ' Lakh ';
  if (thousand > 0) words += inWords(thousand) + ' Thousand ';
  if (hundred > 0) words += inWords(hundred) + ' Hundred ';
  if (rem > 0) {
    if (words !== '') words += 'and ';
    words += inWords(rem) + ' ';
  }

  return words.trim() + ' Rupees Only';
}

// Default donation heads for instant fallback
const DEFAULT_HEADS = [
  { _id: 'dh_1', name: 'General Donation' },
  { _id: 'dh_2', name: '365 Drive' },
  { _id: 'dh_3', name: 'Food Drive' },
  { _id: 'dh_4', name: 'Fengal Cyclone' },
  { _id: 'dh_5', name: 'Kind' },
  { _id: 'dh_6', name: 'General' },
  { _id: 'dh_7', name: 'Anna Chathiram' }
];

const deduplicateHeads = (list) => {
  const seen = new Set();
  return list.filter(item => {
    if (!item || !item.name) return false;
    const base = (item.rawName || item.name).replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
};

const getInitialHeads = () => {
  try {
    const custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
    return deduplicateHeads([...custom, ...DEFAULT_HEADS]);
  } catch (e) {
    return DEFAULT_HEADS;
  }
};

export default function NewDonationReceiptPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const trustSession = getTrustSession();
  const activeTrustUser = (!isSuperUser(user) && user) || trustSession?.user || {};

  const isSuperAdmin =
    Boolean(user?.isSuperAdmin) ||
    (user?.role && user.role.toLowerCase().includes('super')) ||
    location.pathname.toLowerCase().startsWith('/superadmin');

  // Current Date format YYYY-MM-DD (e.g. 2026-09-09)
  const todayISO = new Date().toISOString().split('T')[0];

  const getInitialReceiptNo = () => {
    try {
      const activeUser = isSuperAdmin ? (user || {}) : activeTrustUser;
      const uEmail = (activeUser?.email || '').toLowerCase().trim();
      const profile = uEmail ? JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}') : {};
      if (profile.receiptPrefix) {
        return `${profile.receiptPrefix}${profile.receiptStartNumber || '1'}`;
      }
      const tName = (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') || profile.name || (!isSuperUser(activeUser) ? activeUser?.name : '');
      const prefix = tName ? tName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'REC';
      return `${prefix}/2026-27/1`;
    } catch (e) {}
    return 'REC/2026-27/1';
  };

  const [receiptNo, setReceiptNo] = useState(getInitialReceiptNo);
  const [heads, setHeads] = useState(getInitialHeads);
  const [receiptTypes, setReceiptTypes] = useState(['Corpus', 'Voluntary', 'Earmarked Fund']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Donors state for Name autocomplete dropdown
  const [donors, setDonors] = useState([]);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const donorDropdownRef = useRef(null);

  // Form State matching Screenshots 1 & 2
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    panNo: '',
    aadhaarNo: '',
    donationType: 'Voluntary', // 'Corpus', 'Voluntary', 'Earmarked Fund'
    donationHead: '',
    amount: '',
    donationDate: todayISO,
    paymentMode: '',
    paymentDetails: '',
    reference: '',
    notes: '',
    attach80g: 'No', // 'Yes', 'No'
    attachVerification: 'Yes', // 'Yes', 'No'
    panFileName: '',
    aadhaarFileName: ''
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch next receipt number preview, donation heads, and donors list
  useEffect(() => {
    const activeUser = isSuperAdmin ? (user || {}) : activeTrustUser;
    const uEmail = (activeUser?.email || '').toLowerCase().trim();
    let tName = (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') || (!isSuperUser(activeUser) ? activeUser?.name : '');
    let pPrefix = '';
    try {
      if (uEmail) {
        const p = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
        if (p.name) tName = p.name;
        if (p.receiptPrefix) pPrefix = p.receiptPrefix.replace(/\/?(20\d\d-\d\d\/?)?$/, '').replace(/[^a-zA-Z0-9]/g, '');
      }
    } catch(e) {}
    const query = pPrefix ? `?prefix=${encodeURIComponent(pPrefix)}` : (tName ? `?trustName=${encodeURIComponent(tName)}` : '');
    fetch(`/api/receipts/next-number${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.receiptNo) {
          setReceiptNo(data.receiptNo);
        }
      })
      .catch(err => console.error('Error fetching receipt no:', err));

    const headsQuery = tName
      ? `?limit=100&trustName=${encodeURIComponent(tName)}&trustEmail=${encodeURIComponent(uEmail)}`
      : '?limit=100';
    fetch(`/api/donation-heads${headsQuery}`)
      .then(res => res.json())
      .then(data => {
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        } catch (e) {}

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const merged = deduplicateHeads([...data.data, ...custom, ...DEFAULT_HEADS]);
          setHeads(merged);
        } else {
          setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
        }
      })
      .catch(err => {
        console.error('Error fetching heads:', err);
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        } catch (e) {}
        setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
      });

    fetch('/api/receipts/donors')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setDonors(data.data);
        }
      })
      .catch(err => console.error('Error fetching donors:', err));

    fetch('/api/receipt-types?status=Active')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const names = data.data.map(t => t.name);
          setReceiptTypes(names);
          // If current donationType is not in list, default to first
          setFormData(prev => {
            if (!names.includes(prev.donationType)) {
              return { ...prev, donationType: names[0] };
            }
            return prev;
          });
        }
      })
      .catch(err => console.error('Error fetching receipt types:', err));
  }, []);

  // Close donor dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (donorDropdownRef.current && !donorDropdownRef.current.contains(e.target)) {
        setShowDonorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, name: value }));
    setShowDonorDropdown(true);
  };

  const handleSelectDonor = (donor) => {
    setFormData(prev => ({
      ...prev,
      name: donor.name,
      address: donor.address || prev.address,
      mobile: donor.phone || prev.mobile,
      email: donor.email || prev.email,
      panNo: donor.panNo || prev.panNo,
      aadhaarNo: donor.aadhaarNo || prev.aadhaarNo
    }));
    setShowDonorDropdown(false);
  };

  // Filter donors by matching name
  const filteredDonors = donors.filter(d =>
    !formData.name.trim() || d.name.toLowerCase().includes(formData.name.toLowerCase().trim())
  );

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'File Too Large',
          message: 'Selected file exceeds maximum allowed size of 2MB.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, [field]: file.name }));
    }
  };

  const amountInWords = convertNumberToWords(formData.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Missing Required Field',
        message: 'Please enter the donor Name.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!formData.donationHead) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Missing Required Field',
        message: 'Please select a Donation Head.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Missing Required Field',
        message: 'Please enter a valid donation Amount.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    setIsSubmitting(true);

    // Pre-open window in user gesture context to avoid browser popup blockers
    let newTab = null;
    try {
      newTab = window.open('', '_blank');
    } catch (e) {}

    try {
      const activeUser = isSuperAdmin ? (user || {}) : activeTrustUser;
      const uEmail = (activeUser?.email || '').toLowerCase().trim();
      let profileData = {};
      try {
        if (uEmail) {
          profileData = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
        }
      } catch (e) {}

      const finalActiveUser = { ...profileData, ...activeUser };

      const payload = {
        receiptNo: receiptNo,
        donorName: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        panNo: formData.panNo.trim().toUpperCase(),
        aadhaarNo: formData.aadhaarNo.trim(),
        donationType: formData.donationType,
        donationHead: formData.donationHead,
        amount: Number(formData.amount),
        amountInWords: amountInWords,
        receiptDate: formData.donationDate,
        paymentMode: formData.paymentMode || 'Online / UPI',
        paymentDetails: formData.paymentDetails.trim(),
        reference: formData.reference.trim(),
        notes: formData.notes.trim(),
        attach80g: formData.attach80g === 'Yes',
        attachVerification: formData.attachVerification === 'Yes',
        createdBy: isSuperAdmin ? 'Super Admin' : (finalActiveUser.email || user?.email || localUser?.email || 'Admin'),
        isSuperAdminReceipt: isSuperAdmin,
        trustEmail: isSuperAdmin ? '' : (finalActiveUser.email || user?.email || localUser?.email || ''),
        trustName: finalActiveUser.trustName || finalActiveUser.name || user?.trustName || localUser?.trustName || '',
        trustAddress: finalActiveUser.address || user?.address || '',
        trustPhone: finalActiveUser.phone || finalActiveUser.mobile || user?.mobile || user?.phone || '',
        trustWebsite: finalActiveUser.website || user?.website || '',
        trustRegNo: finalActiveUser.registrationNo || user?.registrationNo || '',
        trustPan: finalActiveUser.panNo || user?.panNo || '',
        trust80G: finalActiveUser.reg12ANo || finalActiveUser.section80GRegNo || '',
        trust12A: finalActiveUser.reg12ANo || '',
        trustLogo: finalActiveUser.logo || '',
        trustSignature: finalActiveUser.signature || '',
        signatoryName: finalActiveUser.signatoryName || finalActiveUser.contactPerson || `${finalActiveUser.firstName || ''} ${finalActiveUser.surname || ''}`.trim() || 'Authorized Signatory',
        signatoryPan: finalActiveUser.signatoryPan || finalActiveUser.panNo || ''
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      const savedReceipt = result.data || {
        ...payload,
        _id: `rec_${Date.now()}`,
        fy: '2026-2027'
      };

      // Store receipt in sessionStorage so print-receipt can access it immediately
      try {
        sessionStorage.setItem('last_printed_receipt', JSON.stringify(savedReceipt));
      } catch (e) {}

      // Open PDF in a new page/tab matching View button behavior
      const printUrl = `/api/receipts/pdf?receiptNo=${encodeURIComponent(savedReceipt.receiptNo || receiptNo)}${payload.trustEmail ? `&trustEmail=${encodeURIComponent(payload.trustEmail)}` : ''}${payload.trustName ? `&trustName=${encodeURIComponent(payload.trustName)}` : ''}`;
      if (newTab && !newTab.closed) {
        newTab.location.href = printUrl;
        newTab.focus();
      } else {
        window.open(printUrl, '_blank');
      }

      // Navigate current tab back to appropriate Donation Receipts page
      navigate(isSuperAdmin ? '/superadmin/all-receipts' : '/trust/donation-receipt');
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      console.error('Error creating receipt:', err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Failed to save donation receipt. Please try again.',
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

  const readonlyInputStyle = {
    ...inputStyle,
    backgroundColor: '#e9ecef',
    color: '#495057',
    cursor: 'not-allowed'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>NEW RECEIPT ENTRY</span>
          </div>
          <h1 className="mint-hero-title">Add New Donation Receipt</h1>
          <p className="mint-hero-subtitle">
            Generate an instant 80G tax-exempt donation receipt with automatic number-to-words calculation.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/donation-receipt')}
            title="View All Receipts"
          >
            <List size={16} />
            <span>All Receipts</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>

        <form onSubmit={handleSubmit}>
          {/* ================= ROW 1: Receipt No, Name, Full Address ================= */}
          <div className="receipt-form-row-1">
            {/* Receipt No. */}
            <div>
              <label style={labelStyle}>
                Receipt No. <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={receiptNo}
                style={readonlyInputStyle}
              />
            </div>

            {/* Name with Auto-Suggest Dropdown */}
            <div style={{ position: 'relative' }} ref={donorDropdownRef}>
              <label style={labelStyle}>
                Name <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                onFocus={() => setShowDonorDropdown(true)}
                placeholder="Enter Name"
                required
                autoComplete="off"
                style={inputStyle}
              />

              {/* Autocomplete Dropdown */}
              {showDonorDropdown && filteredDonors.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.14)',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    zIndex: 1050,
                    marginTop: '3px'
                  }}
                >
                  {filteredDonors.map((donor, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => handleSelectDonor(donor)}
                      style={{
                        padding: '9px 14px',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        color: '#212529',
                        borderBottom: idx < filteredDonors.length - 1 ? '1px solid #f1f3f5' : 'none',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#eaf7ec')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {donor.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Address */}
            <div>
              <label style={labelStyle}>
                Full Address(Max 75 Characters)
              </label>
              <input
                type="text"
                name="address"
                maxLength={75}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter Full Address"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ================= ROW 2: Mobile, Email, PAN Number, Aadhaar No, Donation Type ================= */}
          <div className="receipt-form-row-2">
            {/* Mobile */}
            <div>
              <label style={labelStyle}>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Mobile Number"
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                style={inputStyle}
              />
            </div>

            {/* PAN Number */}
            <div>
              <label style={labelStyle}>PAN Number</label>
              <input
                type="text"
                name="panNo"
                maxLength={10}
                value={formData.panNo}
                onChange={(e) => setFormData(p => ({ ...p, panNo: e.target.value.toUpperCase() }))}
                placeholder="Enter PAN"
                style={inputStyle}
              />
            </div>

            {/* Aadhaar No. */}
            <div>
              <label style={labelStyle}>Aadhaar No.</label>
              <input
                type="text"
                name="aadhaarNo"
                maxLength={12}
                value={formData.aadhaarNo}
                onChange={handleChange}
                placeholder="Enter Aadhaar N"
                style={inputStyle}
              />
            </div>

            {/* Donation Type Radio Group */}
            <div>
              <label style={labelStyle}>Donation Type</label>
              <div className="radio-group-wrap" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                {receiptTypes.map(typeName => (
                  <label key={typeName} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#212529', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="donationType"
                      value={typeName}
                      checked={formData.donationType === typeName}
                      onChange={handleChange}
                      style={{ accentColor: '#007bff' }}
                    />
                    <span>{typeName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ================= ROW 3: Donation Head, Amount, Donation Date, Payment Mode, Payment Details ================= */}
          <div className="receipt-form-row-3">
            {/* Donation Head */}
            <div>
              <label style={labelStyle}>
                Donation Head <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                name="donationHead"
                value={formData.donationHead}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">-- Select --</option>
                {heads.map(h => (
                  <option key={h._id || h.name} value={h.name}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label style={labelStyle}>
                Amount <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                min="1"
                step="any"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter Amount"
                required
                style={inputStyle}
              />
            </div>

            {/* Donation Date */}
            <div>
              <label style={labelStyle}>
                Donation Date <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="donationDate"
                value={formData.donationDate}
                onChange={handleChange}
                required
                style={{ ...inputStyle, backgroundColor: '#e9ecef' }}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label style={labelStyle}>Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">-- Select --</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online / UPI">Online / UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Payment Details */}
            <div>
              <label style={labelStyle}>Payment Details</label>
              <input
                type="text"
                name="paymentDetails"
                value={formData.paymentDetails}
                onChange={handleChange}
                placeholder="Enter Payment Details"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ================= ROW 4: Reference, Upload PAN, Upload Aadhaar ================= */}
          <div className="receipt-form-row-4">
            {/* Reference */}
            <div>
              <label style={labelStyle}>Reference</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Donor Reference"
                style={inputStyle}
              />
            </div>

            {/* Upload PAN */}
            <div>
              <label style={labelStyle}>Upload PAN (jpg, png, Max 2MB)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'panFileName')}
                style={{
                  ...inputStyle,
                  padding: '4px 6px',
                  height: '38px',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Upload Aadhaar */}
            <div>
              <label style={labelStyle}>Upload Aadhaar (jpg, png, Max 2MB)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'aadhaarFileName')}
                style={{
                  ...inputStyle,
                  padding: '4px 6px',
                  height: '38px',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* ================= ROW 5: Amount (Words) ================= */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Amount (Words)</label>
            <input
              type="text"
              disabled
              readOnly
              value={amountInWords}
              placeholder="Amount in Words"
              style={readonlyInputStyle}
            />
          </div>

          {/* ================= ROW 6: Additional Notes ================= */}
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>
              Additional Notes (For Internal purpose only, this will NOT be shown on receipt)
            </label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter Additional Notes (optional)"
              style={inputStyle}
            />
          </div>

          {/* ================= ROW 7: Attach 80G Certificate & Attach Verification ================= */}
          <div className="receipt-form-row-attach">
            {/* Do you want to attach 80G Certificate? */}
            <div>
              <label style={labelStyle}>Do you want to attach 80G Certificate?</label>
              <div className="radio-group-wrap">
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attach80g"
                    value="Yes"
                    checked={formData.attach80g === 'Yes'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  <span>Yes</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attach80g"
                    value="No"
                    checked={formData.attach80g === 'No'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Attach Verification with receipt? [Demo] */}
            <div>
              <label style={labelStyle}>
                Attach Verification with receipt?
                <span
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px'
                  }}
                >
                  Demo
                </span>
              </label>
              <div className="radio-group-wrap">
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attachVerification"
                    value="Yes"
                    checked={formData.attachVerification === 'Yes'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  <span>Yes</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attachVerification"
                    value="No"
                    checked={formData.attachVerification === 'No'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* ================= Centered Submit Button matching Screenshot 2 ================= */}
          <div className="receipt-submit-container">
            <button
              type="submit"
              disabled={isSubmitting}
              className="receipt-submit-btn"
              style={{
                cursor: isSubmitting ? 'wait' : 'pointer'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Themed Dialog Popup */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
