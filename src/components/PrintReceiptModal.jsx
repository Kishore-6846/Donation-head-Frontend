import React from 'react';
import Logo from './Logo';
import { Printer, Download, X } from 'lucide-react';

// Number to Words converter helper for Indian Rupees
function numberToWords(num) {
  if (!num) return 'Zero';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    let nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += nArr[1] != 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += nArr[2] != 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += nArr[3] != 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += nArr[4] != 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += nArr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  }

  const intPart = Math.floor(num);
  return `${inWords(intPart)} Rupees Only`;
}

export default function PrintReceiptModal({ receipt, onClose, user }) {
  if (!receipt) return null;

  const activeUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch (e) { return {}; }
  })();
  const uEmail = (activeUser?.email || '').toLowerCase().trim();
  const profile = (() => {
    if (!uEmail) return {};
    try {
      return JSON.parse(localStorage.getItem(`profile_data_${uEmail}`) || '{}');
    } catch (e) {
      return {};
    }
  })();

  const trustName = receipt.trustName || activeUser?.trustName || profile.name || (activeUser?.name && !activeUser.name.toLowerCase().includes('super') ? activeUser.name : 'Trust Organization');
  const regNo = receipt.trustRegNo || receipt.regNo || activeUser?.registrationNo || profile.registrationNo || '';
  const panNo = receipt.trustPan || receipt.panNo || activeUser?.panNo || profile.panNo || '';
  const fcraNo = receipt.trustFcra || profile.fcraNo || activeUser?.fcraNo || '';
  const address = receipt.trustAddress || receipt.address || activeUser?.address || profile.address || '';
  const reg80G = receipt.trust80G || activeUser?.reg12ANo || activeUser?.section80GRegNo || profile.reg12ANo || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: '800px' }}>
        {/* Modal Header */}
        <div className="modal-header-green no-print">
          <h3>Official 80G Donation Receipt - {receipt.receiptNo}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 24px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={handlePrint} className="btn-primary-green">
            <Printer size={16} /> Print Receipt / Save as PDF
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="modal-body printable-receipt-area" style={{ padding: '30px', background: '#ffffff' }}>
          <div style={{ border: '2px solid #2e7d32', padding: '24px', borderRadius: '6px', position: 'relative', background: '#fff' }}>
            {/* Header / Trust Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2e7d32', paddingBottom: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Logo size="large" />
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1b5e20', margin: 0 }}>
                    {trustName}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#555', margin: '2px 0 0 0' }}>
                    Reg. No: {regNo} | PAN: {panNo} {fcraNo ? `| FCRA: ${fcraNo}` : ''}
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: '1px 0 0 0' }}>
                    {address}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', background: '#f4fbf0', padding: '8px 12px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2e7d32', display: 'block' }}>
                  DONATION RECEIPT
                </span>
                <span style={{ fontSize: '11px', color: '#444' }}>
                  (Under Section 80G)
                </span>
              </div>
            </div>

            {/* Receipt Meta Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#fafbfc', padding: '12px 16px', borderRadius: '4px', border: '1px solid #eee' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                  Receipt Number: <strong style={{ color: '#111' }}>{receipt.receiptNo}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                  Receipt Date: <strong style={{ color: '#111' }}>{receipt.receiptDate}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                  80G Reg. No: <strong style={{ color: '#111' }}>AABTA1234FE20214</strong>
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                  Payment Mode: <strong style={{ color: '#111' }}>{receipt.paymentMode}</strong>
                </p>
              </div>
            </div>

            {/* Donor & Donation Details */}
            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#222', marginBottom: '22px' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Received with thanks from: <strong style={{ fontSize: '15px', color: '#000', textDecoration: 'underline' }}>{receipt.donorName}</strong>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '6px 0 12px 0' }}>
                <div>
                  PAN Number: <strong>{receipt.panNo || 'N/A'}</strong>
                </div>
                <div>
                  Mobile Number: <strong>{receipt.phone || 'N/A'}</strong>
                </div>
              </div>
              {receipt.address && (
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>
                  Address: {receipt.address}
                </p>
              )}
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0', margin: '14px 0' }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  Amount in Figures: <strong style={{ fontSize: '18px', color: '#2e7d32' }}>₹ {Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Amount in Words: <em>{numberToWords(receipt.amount)}</em>
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  Donation Head: <strong>{receipt.donationHead}</strong>
                </div>
                <div>
                  Donation Type: <strong>{receipt.type}</strong>
                </div>
              </div>
              {receipt.reference && (
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                  Transaction / Ref Number: <strong>{receipt.reference}</strong>
                </p>
              )}
            </div>

            {/* 80G Statutory Exemption Note */}
            <div style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '10px 14px', fontSize: '11.5px', color: '#1e293b', lineHeight: '1.45', marginBottom: '26px', borderRadius: '0 6px 6px 0' }}>
              <strong>Tax Exemption Note:</strong> Donations to {trustName} are exempt under Section 80G of the Income Tax Act, 1961 vide Unique Registration Number <strong>{reg80G}</strong>. This receipt is eligible for donor deduction in Form No. 10BD filing.
            </div>

            {/* Signatures & Seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#777' }}>
                <p style={{ margin: '0 0 2px 0' }}>Generated by: {receipt.createdBy || 'Admin'}</p>
                <p style={{ margin: 0 }}>This is a computer-generated digital receipt.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '18px', color: '#1b5e20', transform: 'rotate(-5deg)' }}>
                    Authorized Signatory
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #333', width: '180px', paddingTop: '4px', fontSize: '12px', fontWeight: '700' }}>
                  For {trustName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
