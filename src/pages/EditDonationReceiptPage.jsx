import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List } from 'lucide-react';

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
          setHeads(deduplicateHeads([...data.data, ...custom, ...DEFAULT_HEADS]));
        } else {
          setHeads(deduplicateHeads([...custom, ...DEFAULT_HEADS]));
        }
      })
      .catch(err => {
        console.error(err);
        let custom = [];
        try {
          custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
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
              attachVerification: r.attachVerification !== false ? 'Yes' : 'No'
            }));
          }
        })
        .catch(console.error);
    }
  }, [rid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
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

    if (!formData.reasonToEdit.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Missing Required Field',
        message: 'Please enter the Reason to edit.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid donation Amount.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
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
        attachVerification: formData.attachVerification === 'Yes'
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
        <form onSubmit={handleSubmit}>
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
                required
                style={inputStyle}
              />
            </div>

            {/* 4. Full Address */}
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

            {/* 5. Mobile */}
            <div>
              <label style={labelStyle}>
                Mobile
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter Mobile"
                style={inputStyle}
              />
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
                style={inputStyle}
              />
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
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </div>

            {/* 3. Aadhaar No. */}
            <div>
              <label style={labelStyle}>
                Aadhaar No.
              </label>
              <input
                type="text"
                name="aadhaarNo"
                maxLength={14}
                value={formData.aadhaarNo}
                onChange={handleChange}
                placeholder="Enter Aadhaar N"
                style={inputStyle}
              />
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
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select Donation Head</option>
                {heads.map(h => (
                  <option key={h._id || h.name} value={h.name}>
                    {h.name}
                  </option>
                ))}
                {!heads.some(h => h.name === 'Kind') && <option value="Kind">Kind</option>}
              </select>
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
                required
                style={inputStyle}
              />
            </div>

            {/* 2. Donation Date (Readonly in Screenshot) */}
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
                style={{ ...inputStyle, cursor: 'pointer' }}
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
                style={inputStyle}
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
                style={inputStyle}
              />
            </div>
          </div>

          {/* ================= ROW 4: Upload PAN, Upload Aadhaar, Reason to edit (Spans 3 cols) ================= */}
          <div className="receipt-form-row-4">
            {/* 1. Upload PAN */}
            <div>
              <label style={labelStyle}>
                Upload PAN (jpg, png, Max 2MB)
              </label>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                {formData.panFileName || 'Image not found'}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'panFileName')}
                style={{ fontSize: '13px' }}
              />
            </div>

            {/* 2. Upload Aadhaar */}
            <div>
              <label style={labelStyle}>
                Upload Aadhaar (jpg, png, Max 2MB)
              </label>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                {formData.aadhaarFileName || 'Image not found'}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'aadhaarFileName')}
                style={{ fontSize: '13px' }}
              />
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
                required
                style={inputStyle}
              />
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
              style={inputStyle}
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
                  />
                  No
                </label>
              </div>
            </div>

            {/* Attach Verification with receipt */}
            <div>
              <label style={{ ...labelStyle, display: 'inline-flex', alignItems: 'center' }}>
                Attach Verification with receipt?
                <span
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    marginLeft: '8px',
                    lineHeight: '14px'
                  }}
                >
                  Demo
                </span>
              </label>
              <div className="radio-group-wrap">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="attachVerification"
                    value="Yes"
                    checked={formData.attachVerification === 'Yes'}
                    onChange={handleChange}
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

      {/* Popup / Notifications */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />
    </>
  );
}
