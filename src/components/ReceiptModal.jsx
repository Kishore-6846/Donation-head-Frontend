import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import SimplePopup from './SimplePopup';

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

export default function ReceiptModal({ isOpen, onClose, onSave, heads = [], editingReceipt = null }) {
  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('en-GB');

  const effectiveHeads = deduplicateHeads([
    ...(Array.isArray(heads) && heads.length > 0 ? heads : []),
    ...(() => {
      try { return JSON.parse(localStorage.getItem('custom_donation_heads') || '[]'); } catch(e) { return []; }
    })(),
    ...DEFAULT_HEADS
  ]);

  const [errorPopup, setErrorPopup] = useState(null);

  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    email: '',
    panNo: '',
    address: '',
    type: 'Voluntary Donation',
    donationHead: editingReceipt?.donationHead || effectiveHeads[0]?.name || 'General',
    amount: '',
    paymentMode: 'Online / UPI',
    receiptDate: todayStr,
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (editingReceipt) {
      setFormData({
        donorName: editingReceipt.donorName || '',
        phone: editingReceipt.phone || '',
        email: editingReceipt.email || '',
        panNo: editingReceipt.panNo || '',
        address: editingReceipt.address || '',
        type: editingReceipt.type || 'Voluntary Donation',
        donationHead: editingReceipt.donationHead || effectiveHeads[0]?.name || 'General',
        amount: editingReceipt.amount || '',
        paymentMode: editingReceipt.paymentMode || 'Online / UPI',
        receiptDate: editingReceipt.receiptDate || todayStr,
        reference: editingReceipt.reference || '',
        notes: editingReceipt.notes || ''
      });
    } else {
      setFormData({
        donorName: '',
        phone: '',
        email: '',
        panNo: '',
        address: '',
        type: 'Voluntary Donation',
        donationHead: effectiveHeads[0]?.name || 'General',
        amount: '',
        paymentMode: 'Online / UPI',
        receiptDate: todayStr,
        reference: '',
        notes: ''
      });
    }
  }, [editingReceipt, heads]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'mobile') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericVal }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.donorName.trim() || !formData.amount) {
      setErrorPopup('Please fill in Donor Name and Amount.');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setErrorPopup('Mobile number must be exactly 10 digits.');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorPopup('Please enter a valid email address.');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box">
        <div className="modal-header-green">
          <h3>{editingReceipt ? 'Edit Donation Receipt' : '+ Create New Donation Receipt'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              {/* Donor Name */}
              <div className="form-group">
                <label className="form-label">
                  Donor Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="donorName"
                  className="form-control"
                  placeholder="Enter donor full name"
                  value={formData.donorName}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  Donation Amount (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  placeholder="e.g. 500.00"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="e.g. donor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* PAN No */}
              <div className="form-group">
                <label className="form-label">PAN Number (for 80G Form 10BD)</label>
                <input
                  type="text"
                  name="panNo"
                  className="form-control"
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                  value={formData.panNo}
                  onChange={handleChange}
                />
              </div>

              {/* Donation Head */}
              <div className="form-group">
                <label className="form-label">Donation Head</label>
                <select
                  name="donationHead"
                  className="form-control"
                  value={formData.donationHead}
                  onChange={handleChange}
                >
                  {effectiveHeads.map(h => (
                    <option key={h._id || h.name} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donation Type */}
              <div className="form-group">
                <label className="form-label">Donation Type</label>
                <select
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Voluntary Donation">Voluntary Donation</option>
                  <option value="Corpus Fund">Corpus Fund</option>
                  <option value="Specific Project">Specific Project</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  name="paymentMode"
                  className="form-control"
                  value={formData.paymentMode}
                  onChange={handleChange}
                >
                  <option value="Online / UPI">Online / UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Demand Draft">Demand Draft</option>
                </select>
              </div>

              {/* Receipt Date */}
              <div className="form-group">
                <label className="form-label">Receipt Date</label>
                <input
                  type="text"
                  name="receiptDate"
                  className="form-control"
                  placeholder="DD/MM/YYYY"
                  value={formData.receiptDate}
                  onChange={handleChange}
                />
              </div>

              {/* Reference */}
              <div className="form-group">
                <label className="form-label">Reference / UTR / Cheque No.</label>
                <input
                  type="text"
                  name="reference"
                  className="form-control"
                  placeholder="e.g. 488.00 or UPI/34212"
                  value={formData.reference}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Donor Address</label>
              <textarea
                name="address"
                className="form-control"
                rows="2"
                placeholder="Full residential or organization address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-green">
              <Save size={16} /> {editingReceipt ? 'Update Receipt' : 'Generate Receipt'}
            </button>
          </div>
        </form>
      </div>

      <SimplePopup
        isOpen={Boolean(errorPopup)}
        type="error"
        title="Required Fields"
        message={errorPopup}
        confirmText="OK"
        onConfirm={() => setErrorPopup(null)}
        onCancel={() => setErrorPopup(null)}
      />
    </div>
  );
}
