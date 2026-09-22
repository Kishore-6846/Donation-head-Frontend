import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import VerificationDemoModal from '../components/VerificationDemoModal';
import { Sparkles, List, AlertCircle, Trash2 } from 'lucide-react';
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

  const [showVerificationDemo, setShowVerificationDemo] = useState(false);

  // Field validation errors state for custom Red Border & Message Indicator UI
  const [fieldErrors, setFieldErrors] = useState({});

  // Donors state for Name autocomplete dropdown
  const [donors, setDonors] = useState([]);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const donorDropdownRef = useRef(null);

  // File Upload Refs & States
  const panInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const [panPreview, setPanPreview] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);

  // Form State
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
    aadhaarFileName: '',
    panDoc: '',
    aadhaarDoc: ''
  });

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  // Clear single field error on input change
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Fetch next receipt number preview, donation heads, and donors list
  useEffect(() => {
    const activeUser = isSuperAdmin ? (user || {}) : activeTrustUser;
    const uEmail = (activeUser?.email || '').toLowerCase().trim();
    let tName = (activeUser?.trustName && activeUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? activeUser.trustName : '') || (!isSuperUser(activeUser) ? activeUser?.name : '');
    let pPrefix = '';
    let pStart = '';
    try {
      if (uEmail) {
        const p = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
        if (p.name) tName = p.name;
        if (p.receiptPrefix) pPrefix = p.receiptPrefix;
        if (p.receiptStartNumber) pStart = p.receiptStartNumber;
      }
    } catch(e) {}
    const token = localStorage.getItem('token') || trustSession?.token || '';
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    if (uEmail) authHeaders['x-trust-email'] = uEmail;
    if (tName) authHeaders['x-trust-name'] = tName;

    const nextParams = [];
    if (pPrefix) nextParams.push(`prefix=${encodeURIComponent(pPrefix)}`);
    if (pStart) nextParams.push(`startNumber=${encodeURIComponent(pStart)}`);
    if (tName) nextParams.push(`trustName=${encodeURIComponent(tName)}`);
    if (uEmail) nextParams.push(`trustEmail=${encodeURIComponent(uEmail)}`);
    const query = nextParams.length > 0 ? `?${nextParams.join('&')}` : '';
    fetch(`/api/receipts/next-number${query}`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.receiptNo) {
          setReceiptNo(data.receiptNo);
        }
      })
      .catch(err => console.error('Error fetching receipt no:', err));

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
          custom = JSON.parse(localStorage.getItem(headsStorageKey) || '[]');
        } catch (e) {}
        setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
      });

    const donorsQuery = isSuperAdmin
      ? '?isSuperAdmin=true'
      : (uEmail
          ? `?trustEmail=${encodeURIComponent(uEmail)}&trustName=${encodeURIComponent(tName)}`
          : (tName ? `?trustName=${encodeURIComponent(tName)}` : ''));

    fetch(`/api/receipts/donors${donorsQuery}`, {
      headers: authHeaders
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          let list = data.data;
          // Client-side guard for strict trust isolation
          if (!isSuperAdmin && (uEmail || (tName && tName.toLowerCase() !== 'trust organization'))) {
            const eLower = uEmail.toLowerCase();
            const tLower = tName.toLowerCase();
            list = list.filter(d => {
              if (!d) return false;
              const dEmail = (d.trustEmail || '').toLowerCase();
              const dTrust = (d.trustName || '').toLowerCase();
              if (dEmail || dTrust) {
                const matchEmail = eLower && dEmail && dEmail === eLower;
                const matchTrust = tLower && tLower !== 'trust organization' && dTrust && dTrust === tLower;
                return matchEmail || matchTrust;
              }
              return true;
            });
          }
          setDonors(list);
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

  // Handle Name Input Change (Numbers and Special characters NOT allowed)
  const handleNameChange = (e) => {
    const { value } = e.target;
    // Don't allow numbers or special characters, only letters and spaces
    const cleanName = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, name: cleanName }));
    clearFieldError('name');
    setShowDonorDropdown(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearFieldError(name);

    if (name === 'address') {
      // Don't allow special characters in address (alphanumeric and spaces only)
      const cleanAddress = value.replace(/[^a-zA-Z0-9\s]/g, '');
      setFormData(prev => ({ ...prev, address: cleanAddress }));
      return;
    }

    if (name === 'mobile') {
      // Don't allow special characters or letters, exactly 10 digits max, starts with 6,7,8,9
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

  const handleSelectDonor = (donor) => {
    const cleanDonorName = (donor.name || '').replace(/[^a-zA-Z\s]/g, '');
    const cleanDonorAddress = (donor.address || '').replace(/[^a-zA-Z0-9\s]/g, '');
    let cleanMobile = (donor.phone || '').replace(/\D/g, '').slice(0, 10);
    if (cleanMobile.length > 0 && !/^[6-9]/.test(cleanMobile)) {
      cleanMobile = cleanMobile.replace(/^[^6-9]+/, '');
    }
    const cleanPan = (donor.panNo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const cleanAadhaar = (donor.aadhaarNo || '').replace(/\D/g, '').slice(0, 12);

    setFormData(prev => ({
      ...prev,
      name: cleanDonorName,
      address: cleanDonorAddress || prev.address,
      mobile: cleanMobile || prev.mobile,
      email: donor.email || prev.email,
      panNo: cleanPan || prev.panNo,
      aadhaarNo: cleanAadhaar || prev.aadhaarNo
    }));

    clearFieldError('name');
    if (cleanMobile) clearFieldError('mobile');
    if (donor.email) clearFieldError('email');
    if (cleanPan) clearFieldError('panNo');
    if (cleanAadhaar) clearFieldError('aadhaarNo');
    setShowDonorDropdown(false);
  };

  // Filter donors by matching name
  const filteredDonors = donors.filter(d =>
    !formData.name.trim() || d.name.toLowerCase().includes(formData.name.toLowerCase().trim())
  );

  // File change handler with strict image format verification (.jpg, .jpeg, .png, .webp, max 2MB)
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

  // Remove uploaded PAN / Aadhaar image
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

  // Form submission with custom Red Border & Message Indicator UI
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    // 1. Name is required
    if (!formData.name.trim()) {
      errors.name = 'Donor Name is required.';
    }

    // 2. Mobile validation (if entered)
    if (formData.mobile) {
      if (formData.mobile.length !== 10) {
        errors.mobile = 'Mobile number must be exactly 10 digits.';
      } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
        errors.mobile = 'Mobile number must start with 6, 7, 8, or 9.';
      }
    }

    // 3. Email validation (if entered)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. donor@example.com).';
    }

    // 4. PAN Number validation (if entered)
    if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.trim())) {
      errors.panNo = 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F).';
    }

    // 5. Aadhaar Number validation (if entered)
    if (formData.aadhaarNo && formData.aadhaarNo.length !== 12) {
      errors.aadhaarNo = 'Aadhaar number must be exactly 12 digits.';
    }

    // 6. Donation Head is required
    if (!formData.donationHead) {
      errors.donationHead = 'Please select a Donation Head.';
    }

    // 7. Amount is required and must be > 0
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid donation Amount.';
    }

    // 8. Donation Date is required
    if (!formData.donationDate) {
      errors.donationDate = 'Please select a Donation Date.';
    }

    // If validation fails, apply red borders and inline indicators
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // Pre-open window in user gesture context to avoid browser popup blockers
    let newTab = null;
    try {
      newTab = window.open('', '_blank');
    } catch (err) {}

    try {
      const activeUser = isSuperAdmin ? (user || {}) : activeTrustUser;
      const uEmail = (activeUser?.email || '').toLowerCase().trim();
      let profileData = {};
      try {
        if (uEmail) {
          profileData = JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
        }
      } catch (err) {}

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
        panFileName: formData.panFileName || '',
        aadhaarFileName: formData.aadhaarFileName || '',
        panDoc: formData.panDoc || '',
        aadhaarDoc: formData.aadhaarDoc || '',
        createdBy: isSuperAdmin ? 'Super Admin' : (finalActiveUser.email || user?.email || 'Admin'),
        isSuperAdminReceipt: isSuperAdmin,
        trustEmail: isSuperAdmin ? '' : (finalActiveUser.email || user?.email || ''),
        trustName: finalActiveUser.trustName || finalActiveUser.name || user?.trustName || '',
        trustAddress: finalActiveUser.address || user?.address || '',
        trustPhone: finalActiveUser.phone || finalActiveUser.mobile || user?.mobile || user?.phone || '',
        trustWebsite: finalActiveUser.website || user?.website || '',
        trustRegNo: finalActiveUser.registrationNo || user?.registrationNo || '',
        trustPan: finalActiveUser.panNo || user?.panNo || '',
        trust80G: finalActiveUser.reg12ANo || finalActiveUser.section80GRegNo || '',
        trust12A: finalActiveUser.reg12ANo || '',
        trustLogo: finalActiveUser.logo || '',
        trustSignature: finalActiveUser.signature || '',
        trustWatermarkText: finalActiveUser.receiptWatermarkText || '',
        receiptWatermarkText: finalActiveUser.receiptWatermarkText || '',
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

  const getFieldStyle = (fieldName, extraStyle = {}) => {
    const hasErr = Boolean(fieldErrors[fieldName]);
    return {
      ...inputStyle,
      border: hasErr ? '1.5px solid #ef4444' : '1px solid #ced4da',
      backgroundColor: hasErr ? '#fef2f2' : '#ffffff',
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
            onClick={() => navigate(isSuperAdmin ? '/superadmin/all-receipts' : '/trust/donation-receipt')}
            title="View All Receipts"
          >
            <List size={16} />
            <span>All Receipts</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container" style={{ flex: 1, boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit} noValidate>
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
                autoComplete="off"
                style={getFieldStyle('name')}
              />
              {renderFieldError('name')}

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
          </div>

          {/* ================= ROW 2: Mobile, Email, PAN Number, Aadhaar No, Donation Type ================= */}
          <div className="receipt-form-row-2">
            {/* Mobile */}
            <div>
              <label style={labelStyle}>Mobile</label>
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

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
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

            {/* PAN Number */}
            <div>
              <label style={labelStyle}>PAN Number</label>
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

            {/* Aadhaar No. */}
            <div>
              <label style={labelStyle}>Aadhaar No.</label>
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
                style={getFieldStyle('donationHead', { cursor: 'pointer' })}
              >
                <option value="">-- Select --</option>
                {heads.map(h => (
                  <option key={h._id || h.name} value={h.name}>{h.name}</option>
                ))}
              </select>
              {renderFieldError('donationHead')}
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
                style={getFieldStyle('amount')}
              />
              {renderFieldError('amount')}
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
                style={getFieldStyle('donationDate')}
              />
              {renderFieldError('donationDate')}
            </div>

            {/* Payment Mode */}
            <div>
              <label style={labelStyle}>Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                style={getFieldStyle('paymentMode', { cursor: 'pointer' })}
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
                style={getFieldStyle('paymentDetails')}
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
                style={getFieldStyle('reference')}
              />
            </div>

            {/* Upload PAN */}
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
                    height: '38px',
                    cursor: 'pointer'
                  })}
                />
                {panPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={panPreview} alt="PAN preview" style={{ height: '26px', width: '26px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }} title={formData.panFileName}>
                        {formData.panFileName}
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

            {/* Upload Aadhaar */}
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
                    height: '38px',
                    cursor: 'pointer'
                  })}
                />
                {aadhaarPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={aadhaarPreview} alt="Aadhaar preview" style={{ height: '26px', width: '26px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }} title={formData.aadhaarFileName}>
                        {formData.aadhaarFileName}
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
              style={getFieldStyle('notes')}
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
                <button
                  type="button"
                  onClick={() => setShowVerificationDemo(true)}
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Click to view Verification Demo Preview"
                >
                  Demo
                </button>
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

          {/* ================= Centered Submit Button ================= */}
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

      {/* Verification Demo Modal */}
      <VerificationDemoModal
        isOpen={showVerificationDemo}
        onClose={() => setShowVerificationDemo(false)}
      />

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
