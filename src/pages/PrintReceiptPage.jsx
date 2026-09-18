import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PrintReceiptPage() {
  const [searchParams] = useSearchParams();
  const rid = searchParams.get('rid') || searchParams.get('id') || searchParams.get('pr_id');
  const receiptNo = searchParams.get('receiptNo') || searchParams.get('no');
  const trustEmail = searchParams.get('trustEmail') || searchParams.get('email');
  const trustName = searchParams.get('trustName');

  let pdfUrl = receiptNo
    ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(receiptNo)}`
    : (rid ? `/api/receipts/pdf?id=${encodeURIComponent(rid)}` : '/api/receipts/pdf');

  if (trustEmail) pdfUrl += `&trustEmail=${encodeURIComponent(trustEmail)}`;
  if (trustName) pdfUrl += `&trustName=${encodeURIComponent(trustName)}`;

  useEffect(() => {
    window.location.replace(pdfUrl);
  }, [pdfUrl]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#323639', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <p>Opening Official PDF...</p>
    </div>
  );
}
