import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import VerificationDemoModal from '../components/VerificationDemoModal';
import { Sparkles, List, AlertCircle, Trash2 } from 'lucide-react';

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

  return words.trim();
}

// Convert DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
function formatToISODate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('-')) return dateStr;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().split('T')[0];
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

export default function EditDonationReceiptPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const rid = searchParams.get('rid') || searchParams.get('id') || searchParams.get('pr_id');
  const initialReceipt = location.state?.receipt || null;

  const [receiptId, setReceiptId] = useState(initialReceipt?._id || rid || '');
  const [receiptNo, setReceiptNo] = useState(initialReceipt?.receiptNo || '');
  const [heads, setHeads] = useState(getInitialHeads);
  const [receiptTypes, setReceiptTypes] = useState(['Corpus', 'Voluntary', 'Earmarked Fund']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showVerificationDemo, setShowVerificationDemo] = useState(false);

  // Field validation errors state
  const [fieldErrors, setFieldErrors] = useState({});

  // File Upload Refs & States
  const panInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const [panPreview, setPanPreview] = useState(initialReceipt?.panDoc || null);
  const [aadhaarPreview, setAadhaarPreview] = useState(initialReceipt?.aadhaarDoc || null);

  const [formData, setFormData] = useState({
    name: initialReceipt?.donorName || '',
    receiptDate: formatToISODate(initialReceipt?.receiptDate || new Date()),
    address: initialReceipt?.address || '',
    mobile: initialReceipt?.phone || '',
    email: initialReceipt?.email || '',
    panNo: initialReceipt?.panNo || '',
    aadhaarNo: initialReceipt?.aadhaarNo || '',
    donationType: initialReceipt?.donationType || initialReceipt?.type || 'Voluntary',
    donationHead: initialReceipt?.donationHead || '',
    amount: initialReceipt?.amount || '',
    donationDate: formatToISODate(initialReceipt?.receiptDate || initialReceipt?.donationDate || new Date()),
    paymentMode: initialReceipt?.paymentMode || 'Cheque',
    paymentDetails: initialReceipt?.paymentDetails || '',
    reference: initialReceipt?.reference || '',
    reasonToEdit: '',
    notes: initialReceipt?.notes || '',
    attach80g: initialReceipt?.attach80g ? 'Yes' : 'No',
    attachVerification: initialReceipt?.attachVerification !== false ? 'Yes' : 'No',
    panFileName: initialReceipt?.panFileName || '',
    aadhaarFileName: initialReceipt?.aadhaarFileName || '',
    panDoc: initialReceipt?.panDoc || '',
    aadhaarDoc: initialReceipt?.aadhaarDoc || ''
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Fetch donation heads & receipt data if needed
  useEffect(() => {
    fetch('/api/receipt-types?status=Active')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const names = data.data.map(t => t.name);
          setReceiptTypes(names);
        }
      })
      .catch(err => console.error('Error fetching receipt types:', err));

    const activeUser = user || (() => {
      try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch (e) { return {}; }
    })();
    const uEmail = (activeUser?.email || '').toLowerCase().trim();
    const tName = activeUser?.trustName || (activeUser?.name && !activeUser.name.toLowerCase().includes('super') ? activeUser.name : '');
    const isSuperAdmin =
      Boolean(user?.isSuperAdmin) ||
      (user?.role && user.role.toLowerCase().includes('super')) ||
      location.pathname.toLowerCase().startsWith('/superadmin');

    const headsQuery = isSuperAdmin
      ? '?limit=100&isSuperAdmin=true'
      : (uEmail
          ? `?limit=100&trustName=${encodeURIComponent(tName)}&trustEmail=${encodeURIComponent(uEmail)}`
          : (tName ? `?limit=100&trustName=${encodeURIComponent(tName)}` : '?limit=100'));

    const headsStorageKey = isSuperAdmin ? 'custom_donation_heads_superadmin' : `custom_donation_heads_${uEmail || 'trust'}`;

    fetch(`/api/donation-heads${headsQuery}`)
      .then(res => res.json())
      .then(data => {
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem(headsStorageKey) || '[]');
        } catch (e) {}

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setHeads(deduplicateHeads([...data.data, ...custom, ...DEFAULT_HEADS]));
        } else {
          setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
        }
      })
      .catch(err => {
        console.error(err);
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem(headsStorageKey) || '[]');
        } catch (e) {}
        setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
      });

    // If no initialReceipt from state, try fetching from backend
    if (!initialReceipt && rid) {
      fetch(`/api/receipts/${rid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const r = data.data;
            setReceiptId(r._id);
            setReceiptNo(r.receiptNo || '');
            setFormData(prev => ({
              ...prev,
              name: r.donorName || '',
              receiptDate: formatToISODate(r.receiptDate),
              address: r.address || '',
              mobile: r.phone || '',
              email: r.email || '',
              panNo: r.panNo || '',
              aadhaarNo: r.aadhaarNo || '',
              donationType: r.donationType || r.type || 'Voluntary',
              donationHead: r.donationHead || '',
              amount: r.amount || '',
              donationDate: formatToISODate(r.receiptDate || r.donationDate),
              paymentMode: r.paymentMode || 'Cheque',
              paymentDetails: r.paymentDetails || '',
              reference: r.reference || '',
              notes: r.notes || '',
              attach80g: r.attach80g ? 'Yes' : 'No',
              attachVerification: r.attachVerification !== false ? 'Yes' : 'No',
              panFileName: r.panFileName || '',
              aadhaarFileName: r.aadhaarFileName || '',
              panDoc: r.panDoc || '',
              aadhaarDoc: r.aadhaarDoc || ''
            }));
            if (r.panDoc) setPanPreview(r.panDoc);
            if (r.aadhaarDoc) setAadhaarPreview(r.aadhaarDoc);
          }
        })
        .catch(console.error);
    }
  }, [rid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearFieldError(name);

    if (name === 'address') {
      // Don't allow special characters in address
      const cleanAddress = value.replace(/[^a-zA-Z0-9\s]/g, '');
      setFormData(prev => ({ ...prev, address: cleanAddress }));
      return;
    }

    if (name === 'mobile') {
      // Don't allow special characters or letters, only numbers, max 10 digits, starts with 6,7,8,9
      let numericVal = value.replace(/\D/g, '').slice(0, 10);
      if (numericVal.length > 0 && !/^[6-9]/.test(numericVal)) {
        numericVal = numericVal.replace(/^[^6-9]+/, '');
      }
      setFormData(prev => ({ ...prev, mobile: numericVal }));
      return;
    }

    if (name === 'panNo') {
      // Don't allow special characters, uppercase alphanumeric only, max 10
      const cleanPan = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, panNo: cleanPan }));
      return;
    }

    if (name === 'aadhaarNo') {
      // Don't allow special characters or letters, only digits, max 12
      const cleanAadhaar = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, aadhaarNo: cleanAadhaar }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldType]: 'Only image files (.jpg, .jpeg, .png, .webp) are allowed.'
      }));
      if (fieldType === 'panFile' && panInputRef.current) panInputRef.current.value = '';
      if (fieldType === 'aadhaarFile' && aadhaarInputRef.current) aadhaarInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldType]: 'File size must not exceed 2MB.'
      }));
      if (fieldType === 'panFile' && panInputRef.current) panInputRef.current.value = '';
      if (fieldType === 'aadhaarFile' && aadhaarInputRef.current) aadhaarInputRef.current.value = '';
      return;
    }

    clearFieldError(fieldType);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (fieldType === 'panFile') {
        setPanPreview(ev.target.result);
        setFormData(prev => ({ ...prev, panFileName: file.name, panDoc: ev.target.result }));
      } else {
        setAadhaarPreview(ev.target.result);
        setFormData(prev => ({ ...prev, aadhaarFileName: file.name, aadhaarDoc: ev.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (fieldType) => {
    if (fieldType === 'panFile') {
      setPanPreview(null);
      setFormData(prev => ({ ...prev, panFileName: '', panDoc: '' }));
      clearFieldError('panFile');
      if (panInputRef.current) panInputRef.current.value = '';
    } else {
      setAadhaarPreview(null);
      setFormData(prev => ({ ...prev, aadhaarFileName: '', aadhaarDoc: '' }));
      clearFieldError('aadhaarFile');
      if (aadhaarInputRef.current) aadhaarInputRef.current.value = '';
    }
  };

  const amountInWords = convertNumberToWords(formData.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    if (!formData.reasonToEdit.trim()) {
      errors.reasonToEdit = 'Please enter the Reason to edit.';
    }

    if (formData.mobile) {
      if (formData.mobile.length !== 10) {
        errors.mobile = 'Mobile number must be exactly 10 digits.';
      } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
        errors.mobile = 'Mobile number must start with 6, 7, 8, or 9.';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. donor@example.com).';
    }

    if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.trim())) {
      errors.panNo = 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F).';
    }

    if (formData.aadhaarNo && formData.aadhaarNo.length !== 12) {
      errors.aadhaarNo = 'Aadhaar number must be exactly 12 digits.';
    }

    if (!formData.donationHead) {
      errors.donationHead = 'Please select a Donation Head.';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid donation Amount.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        donorName: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        panNo: formData.panNo.trim().toUpperCase(),
        aadhaarNo: formData.aadhaarNo.trim(),
        donationType: formData.donationType,
        donationHead: formData.donationHead,
        amount: Number(formData.amount),
        amountInWords: amountInWords ? `${amountInWords} Only` : '',
        receiptDate: formData.receiptDate,
        paymentMode: formData.paymentMode,
        paymentDetails: formData.paymentDetails.trim(),
        reference: formData.reference.trim(),
        notes: formData.notes.trim(),
        reasonToEdit: formData.reasonToEdit.trim(),
        attach80g: formData.attach80g === 'Yes',
        attachVerification: formData.attachVerification === 'Yes',
        panFileName: formData.panFileName || '',
        aadhaarFileName: formData.aadhaarFileName || '',
        panDoc: formData.panDoc || '',
        aadhaarDoc: formData.aadhaarDoc || ''
      };

      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Receipt Updated',
        message: `Receipt ${receiptNo} has been updated successfully.`,
        onConfirm: () => {
          setPopup(p => ({ ...p, isOpen: false }));
          navigate('/trust/donation-receipt');
        }
      });
    } catch (err) {
      console.error('Error updating receipt:', err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to update donation receipt. Please try again.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#212529',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    height: '36px',
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
    backgroundColor: '#eceff1',
    color: '#495057',
    cursor: 'not-allowed'
  };

  const getFieldStyle = (fieldName, extraStyle = {}) => {
    const hasErr = Boolean(fieldErrors[fieldName]);
    return {
      ...inputStyle,
      border: hasErr ? '1.5px solid #ef4444' : (inputStyle.border || '1px solid #ced4da'),
      backgroundColor: hasErr ? '#fef2f2' : (inputStyle.backgroundColor || '#ffffff'),
      boxShadow: hasErr ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
      transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      ...extraStyle
    };
  };

  const renderFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
    return (
      <div
        style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '500'
        }}
      >
        <AlertCircle size={13} style={{ flexShrink: 0 }} />
        <span>{fieldErrors[fieldName]}</span>
      </div>
    );
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>RECEIPT MODIFICATION</span>
          </div>
          <h1 className="mint-hero-title">Edit Receipt</h1>
          <p className="mint-hero-subtitle">
            Update donor details, donation allocations, and recalculate amount in words.
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

      <div className="mint-table-card-container">
        <form onSubmit={handleSubmit} noValidate>
          {/* ================= ROW 1: 5 Columns (Receipt No, Name, Receipt Date, Full Address, Mobile) ================= */}
          <div className="receipt-form-row-5col">
            {/* 1. Receipt No. */}
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

            {/* 2. Name */}
            <div>
              <label style={labelStyle}>
                Name <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={formData.name}
                style={readonlyInputStyle}
              />
            </div>

            {/* 3. Receipt Date */}
            <div>
              <label style={labelStyle}>
                Receipt Date <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="receiptDate"
                value={formData.receiptDate}
                onChange={handleChange}
                style={getFieldStyle('receiptDate')}
              />
              {renderFieldError('receiptDate')}
            </div>

            {/* 4. Full Address */}
            <div>
              <label style={labelStyle}>
                Full Address
              </label>
              <input
                type="text"
                name="address"
                maxLength={75}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter Full Address"
                style={getFieldStyle('address')}
              />
              {renderFieldError('address')}
            </div>

            {/* 5. Mobile */}
            <div>
              <label style={labelStyle}>
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                maxLength={10}
                inputMode="numeric"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                style={getFieldStyle('mobile')}
              />
              {renderFieldError('mobile')}
            </div>
          </div>

          {/* ================= ROW 2: 5 Columns (Email, PAN Number, Aadhaar No, Donation Type, Donation Head) ================= */}
          <div className="receipt-form-row-5col">
            {/* 1. Email */}
            <div>
              <label style={labelStyle}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                style={getFieldStyle('email')}
              />
              {renderFieldError('email')}
            </div>

            {/* 2. PAN Number */}
            <div>
              <label style={labelStyle}>
                PAN Number
              </label>
              <input
                type="text"
                name="panNo"
                maxLength={10}
                value={formData.panNo}
                onChange={handleChange}
                placeholder="Enter PAN"
                style={getFieldStyle('panNo', { textTransform: 'uppercase' })}
              />
              {renderFieldError('panNo')}
            </div>

            {/* 3. Aadhaar No. */}
            <div>
              <label style={labelStyle}>
                Aadhaar No.
              </label>
              <input
                type="text"
                name="aadhaarNo"
                maxLength={12}
                inputMode="numeric"
                value={formData.aadhaarNo}
                onChange={handleChange}
                placeholder="12-digit Aadhaar No."
                style={getFieldStyle('aadhaarNo')}
              />
              {renderFieldError('aadhaarNo')}
            </div>

            {/* 4. Donation Type */}
            <div>
              <label style={labelStyle}>
                Donation Type
              </label>
              <div className="radio-group-wrap" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                {receiptTypes.map(typeName => (
                  <label key={typeName} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer', color: '#212529', fontWeight: '500' }}>
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

            {/* 5. Donation Head */}
            <div>
              <label style={labelStyle}>
                Donation Head <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                name="donationHead"
                value={formData.donationHead}
                onChange={handleChange}
                style={getFieldStyle('donationHead', { cursor: 'pointer' })}
              >
                <option value="">Select Donation Head</option>
                {heads.map(h => (
                  <option key={h._id || h.name} value={h.name}>
                    {h.name}
                  </option>
                ))}
                {!heads.some(h => h.name === 'Kind') && <option value="Kind">Kind</option>}
              </select>
              {renderFieldError('donationHead')}
            </div>
          </div>

          {/* ================= ROW 3: 5 Columns (Amount, Donation Date, Payment Mode, Payment Details, Reference) ================= */}
          <div className="receipt-form-row-5col">
            {/* 1. Amount */}
            <div>
              <label style={labelStyle}>
                Amount <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                style={getFieldStyle('amount')}
              />
              {renderFieldError('amount')}
            </div>

            {/* 2. Donation Date */}
            <div>
              <label style={labelStyle}>
                Donation Date <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                name="donationDate"
                disabled
                readOnly
                value={formData.donationDate}
                style={readonlyInputStyle}
              />
            </div>

            {/* 3. Payment Mode */}
            <div>
              <label style={labelStyle}>
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                style={getFieldStyle('paymentMode', { cursor: 'pointer' })}
              >
                <option value="Cheque">Cheque</option>
                <option value="Online / UPI">Online / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 4. Payment Details */}
            <div>
              <label style={labelStyle}>
                Payment Details
              </label>
              <input
                type="text"
                name="paymentDetails"
                value={formData.paymentDetails}
                onChange={handleChange}
                placeholder="Enter Payment Details"
                style={getFieldStyle('paymentDetails')}
              />
            </div>

            {/* 5. Reference */}
            <div>
              <label style={labelStyle}>
                Reference
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Donor Reference"
                style={getFieldStyle('reference')}
              />
            </div>
          </div>

          {/* ================= ROW 4: Upload PAN, Upload Aadhaar, Reason to edit ================= */}
          <div className="receipt-form-row-4">
            {/* 1. Upload PAN */}
            <div>
              <label style={labelStyle}>
                Upload PAN <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>(.jpg, .png, Max 2MB)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="file"
                  ref={panInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => handleFileChange(e, 'panFile')}
                  style={getFieldStyle('panFile', {
                    padding: '5px 8px',
                    height: '36px',
                    cursor: 'pointer'
                  })}
                />
                {panPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={panPreview} alt="PAN preview" style={{ height: '24px', width: '24px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={formData.panFileName || 'PAN Image'}>
                        {formData.panFileName || 'PAN Image'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('panFile')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Remove PAN"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
              {renderFieldError('panFile')}
            </div>

            {/* 2. Upload Aadhaar */}
            <div>
              <label style={labelStyle}>
                Upload Aadhaar <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>(.jpg, .png, Max 2MB)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="file"
                  ref={aadhaarInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => handleFileChange(e, 'aadhaarFile')}
                  style={getFieldStyle('aadhaarFile', {
                    padding: '5px 8px',
                    height: '36px',
                    cursor: 'pointer'
                  })}
                />
                {aadhaarPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={aadhaarPreview} alt="Aadhaar preview" style={{ height: '24px', width: '24px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={formData.aadhaarFileName || 'Aadhaar Image'}>
                        {formData.aadhaarFileName || 'Aadhaar Image'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('aadhaarFile')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Remove Aadhaar"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
              {renderFieldError('aadhaarFile')}
            </div>

            {/* 3. Reason to edit (Required) */}
            <div>
              <label style={labelStyle}>
                Reason to edit <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="reasonToEdit"
                value={formData.reasonToEdit}
                onChange={handleChange}
                placeholder="Add reason to edit"
                style={getFieldStyle('reasonToEdit')}
              />
              {renderFieldError('reasonToEdit')}
            </div>
          </div>

          {/* ================= ROW 5: Amount (Words) ================= */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>
              Amount (Words)
            </label>
            <input
              type="text"
              disabled
              readOnly
              value={amountInWords}
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
              style={getFieldStyle('notes')}
            />
          </div>

          {/* ================= ROW 7: Attach 80G Certificate & Verification ================= */}
          <div className="receipt-form-row-attach">
            {/* Attach 80G Certificate */}
            <div>
              <label style={labelStyle}>
                Do you want to attach 80G Certificate?
              </label>
              <div className="radio-group-wrap">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attach80g"
                    value="Yes"
                    checked={formData.attach80g === 'Yes'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  Yes
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attach80g"
                    value="No"
                    checked={formData.attach80g === 'No'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  No
                </label>
              </div>
            </div>

            {/* Attach Verification with receipt */}
            <div>
              <label style={{ ...labelStyle, display: 'inline-flex', alignItems: 'center' }}>
                Attach Verification with receipt?
                <button
                  type="button"
                  onClick={() => setShowVerificationDemo(true)}
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    marginLeft: '8px',
                    lineHeight: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Click to view Verification Demo Preview"
                >
                  Demo
                </button>
              </label>
              <div className="radio-group-wrap">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attachVerification"
                    value="Yes"
                    checked={formData.attachVerification === 'Yes'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  Yes
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attachVerification"
                    value="No"
                    checked={formData.attachVerification === 'No'}
                    onChange={handleChange}
                    style={{ accentColor: '#007bff' }}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* ================= ROW 8: Centered Submit Button ================= */}
          <div className="receipt-submit-container">
            <button
              type="submit"
              disabled={isSubmitting}
              className="receipt-submit-btn"
              style={{
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Demo Modal */}
      <VerificationDemoModal
        isOpen={showVerificationDemo}
        onClose={() => setShowVerificationDemo(false)}
      />

      {/* Popup / Notifications */}
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
