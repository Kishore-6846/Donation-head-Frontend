import React, { useState } from 'react';
import { Mail, Send, Download, Check, AlertCircle, X, FileText } from 'lucide-react';

export default function ShareReceiptModal({
  isOpen,
  onClose,
  receipt,
  initialMode = 'whatsapp', // 'whatsapp' or 'email'
  trustEmail = '',
  trustName = ''
}) {
  if (!isOpen || !receipt) return null;

  const [mode, setMode] = useState(initialMode);
  const [recipientEmail, setRecipientEmail] = useState(receipt.email || '');
  const [recipientPhone, setRecipientPhone] = useState(receipt.phone || receipt.mobile || '');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  const effectiveTrustName = trustName || receipt.trustName || 'Trust Organization';
  const safeReceiptNo = String(receipt.receiptNo || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfFilename = `Donation_Receipt_${safeReceiptNo}.pdf`;

  const pdfUrl = `${window.location.origin}/api/receipts/pdf?receiptNo=${encodeURIComponent(receipt.receiptNo || '')}${trustEmail ? `&trustEmail=${encodeURIComponent(trustEmail)}` : ''}${trustName ? `&trustName=${encodeURIComponent(trustName)}` : ''}`;

  // Manual download function (triggered only when user clicks the Download button at top)
  const downloadPdf = async () => {
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 5000);
    } catch (e) {
      console.warn('Error downloading PDF:', e);
      setStatusMsg({ type: 'error', text: 'Failed to download PDF. Please try again.' });
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSending(true);
    setStatusMsg(null);

    try {
      const resp = await fetch('/api/receipts/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: receipt._id,
          receiptNo: receipt.receiptNo,
          email: recipientEmail.trim(),
          trustEmail,
          trustName: effectiveTrustName,
          receipt
        })
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: `Official 80G Receipt PDF (${pdfFilename}) successfully attached and sent to ${recipientEmail}!`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: data.message || 'Failed to send email. Please check your email configuration or use the Mail App button.'
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Error sending email: ' + (err.message || 'Network error')
      });
    } finally {
      setSending(false);
    }
  };

  const openMailClient = () => {
    const subject = encodeURIComponent(`Official 80G Donation Receipt - ${receipt.receiptNo} | ${effectiveTrustName}`);
    const body = encodeURIComponent(
      `Dear ${receipt.donorName},\n\nThank you for your generous donation of ₹${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${effectiveTrustName} under head "${receipt.donationHead || 'General'}".\n\nReceipt Details:\n• Receipt Number: ${receipt.receiptNo}\n• Receipt Date: ${receipt.receiptDate}\n• Donation Head: ${receipt.donationHead || 'General'}\n• Amount: ₹${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nYou can view and download your official 80G Donation Receipt PDF directly here:\n${pdfUrl}\n\n📎 Attached Document: ${pdfFilename}\n\nThank you for supporting our noble mission!\n\nWarm regards,\n${effectiveTrustName}`
    );
    window.location.href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${body}`;
  };

  const handleSendWhatsApp = () => {
    if (!recipientPhone.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid mobile number.' });
      return;
    }

    const digitsOnly = recipientPhone.replace(/\D/g, '');
    if (!digitsOnly) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid phone number with digits.' });
      return;
    }

    const phone = digitsOnly.startsWith('91') && digitsOnly.length > 10
      ? digitsOnly
      : (digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly);

    const messageText =
      `🙏 *Official 80G Donation Receipt - ${effectiveTrustName}*\n\n` +
      `Dear *${receipt.donorName || 'Donor'}*,\n\n` +
      `Thank you for your generous contribution of *₹${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}* to *${effectiveTrustName}* under head "*${receipt.donationHead || 'General'}*".\n\n` +
      `📋 *Receipt Details:*\n` +
      `• *Receipt No:* ${receipt.receiptNo}\n` +
      `• *Receipt Date:* ${receipt.receiptDate}\n` +
      `• *Donation Head:* ${receipt.donationHead || 'General'}\n` +
      `• *Amount:* ₹${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\n` +
      `📄 *Direct 80G Tax Exemption Receipt PDF Link:* \n${pdfUrl}\n\n` +
      `Thank you for supporting our noble mission! ✨\n` +
      `— *${effectiveTrustName}*`;

    const text = encodeURIComponent(messageText);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;

    // Directly open WhatsApp window so browser popup blocker does not block it
    const win = window.open(waUrl, '_blank');
    if (win) {
      win.focus();
    } else {
      window.location.href = waUrl;
    }

    setStatusMsg({
      type: 'success',
      text: `WhatsApp chat opened for ${recipientPhone} with official 80G receipt details and direct PDF link!`
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: '#15803d', padding: '18px 22px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.01em' }}>
              Share 80G Receipt with Attachment
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
              Receipt: <strong>{receipt.receiptNo}</strong> ({receipt.donorName})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => { setMode('whatsapp'); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'whatsapp' ? '#ffffff' : 'transparent',
              color: mode === 'whatsapp' ? '#15803d' : '#64748b',
              fontWeight: mode === 'whatsapp' ? '700' : '500',
              borderBottom: mode === 'whatsapp' ? '3px solid #15803d' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            WhatsApp (with PDF)
          </button>
          <button
            type="button"
            onClick={() => { setMode('email'); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'email' ? '#ffffff' : 'transparent',
              color: mode === 'email' ? '#15803d' : '#64748b',
              fontWeight: mode === 'email' ? '700' : '500',
              borderBottom: mode === 'email' ? '3px solid #15803d' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <Mail size={16} />
            Email (with PDF Attached)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px' }}>
          {/* PDF Attachment Preview Card with Manual Download Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#15803d" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                  {pdfFilename}
                </div>
                <div style={{ fontSize: '11.5px', color: '#4b7a58' }}>
                  Official 80G Tax Exemption Receipt PDF
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadPdf}
              style={{
                background: '#ffffff',
                border: '1px solid #86efac',
                color: '#15803d',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Download PDF to your computer/phone"
            >
              <Download size={13} /> Download
            </button>
          </div>

          {/* Mode Form Content */}
          {mode === 'whatsapp' ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Donor Mobile / WhatsApp Number:
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 9840423998"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '18px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Instant WhatsApp Receipt Dispatch:</div>
                <div>Clicking below will open WhatsApp with <strong>{receipt.donorName || 'Donor'}</strong> ({recipientPhone || 'Phone'}) to deliver the official 80G Receipt message and direct PDF link.</div>
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.25)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Open WhatsApp & Share Receipt
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '7px 12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📧 <strong>Sender Identity:</strong> {effectiveTrustName} ({trustEmail || receipt.trustEmail || 'Trust Admin'})</span>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>Dynamic</span>
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Donor Email Address:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. donor@example.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '18px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Official Email Dispatch:</div>
                <div>The server generates the official 80G Receipt PDF buffer and <strong>attaches it directly to the email</strong> (<code>{pdfFilename}</code>) for the donor's tax records.</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sending}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: sending ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: sending ? 0.7 : 1,
                    boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  <Send size={16} />
                  {sending ? 'Attaching & Sending Email...' : 'Send Email with PDF Attached'}
                </button>

                <button
                  type="button"
                  onClick={openMailClient}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title="Open in your default email client (Outlook/Gmail)"
                >
                  <Mail size={14} /> Mail App
                </button>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {statusMsg && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                lineHeight: '1.45'
              }}
            >
              {statusMsg.type === 'success' ? <Check size={16} style={{ marginTop: '2px', flexShrink: 0 }} /> : <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />}
              <div>{statusMsg.text}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
