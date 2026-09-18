import React from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Download, Info, Sparkles, CreditCard } from 'lucide-react';

const SUBSCRIPTION_DATA = [
  {
    id: 1,
    invoiceNo: 'SP/DR/26-27/0031',
    plan: 'DonationReceipt.in Subscription - Base Plan',
    startDate: '08-08-2026',
    endDate: '07-08-2027',
    amount: '₹ 1,416.00',
    status: 'Active',
    payment: 'Paid',
    canDownload: true
  },
  {
    id: 2,
    invoiceNo: '',
    plan: 'DonationReceipt.in Subscription - Base Plan',
    startDate: '08-08-2025',
    endDate: '07-08-2026',
    amount: '₹ 1,416.00',
    status: 'Expired',
    payment: 'Paid',
    canDownload: false
  },
  {
    id: 3,
    invoiceNo: '2024-25SP174',
    plan: 'DonationReceipt.in Subscription - Base Plan',
    startDate: '08-08-2024',
    endDate: '07-08-2025',
    amount: '₹ 1,416.00',
    status: 'Expired',
    payment: 'Paid',
    canDownload: false
  },
  {
    id: 4,
    invoiceNo: '2023-24SP153',
    plan: 'DonationReceipt.in Subscription - Base Plan',
    startDate: '08-08-2023',
    endDate: '07-08-2024',
    amount: '₹ 1,416.00',
    status: 'Expired',
    payment: 'Paid',
    canDownload: false
  },
  {
    id: 5,
    invoiceNo: '2022-23SP136',
    plan: 'DonationReceipt.in Subscription - Base Plan',
    startDate: '08-08-2022',
    endDate: '07-08-2023',
    amount: '₹ 1,416.00',
    status: 'Expired',
    payment: 'Paid',
    canDownload: false
  }
];

export default function MySubscriptionsPage() {
  const handleDownload = async (invoiceNo) => {
    const formatted = (invoiceNo || 'SP-DR-26-27-0031').replace(/[\/\\]/g, '-');
    try {
      const response = await fetch(`/api/subscriptions/invoice/${encodeURIComponent(formatted)}/pdf`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${formatted}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const link = document.createElement('a');
      link.href = `/api/subscriptions/invoice/${encodeURIComponent(formatted)}/pdf`;
      link.setAttribute('download', `${formatted}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>ACCOUNT & BILLING</span>
          </div>
          <h1 className="mint-hero-title">My Subscriptions</h1>
          <p className="mint-hero-subtitle">
            View your active, upcoming, and expired subscription plans, history, and official invoices.
          </p>
        </div>
      </div>

      <div className="mint-table-card-container">

        {/* Blue Info Alert Banner matching Screenshot 3 */}
        <div
          style={{
            backgroundColor: '#d9edf7',
            border: '1px solid #bce8f1',
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#31708f',
            fontSize: '13px',
            lineHeight: 1.5
          }}
        >
          <Info size={16} color="#31708f" style={{ flexShrink: 0 }} />
          <span>
            Invoice download is available only for subscriptions purchased on or after{' '}
            <strong>1st June 2026</strong>. For older invoices, please contact our support team at{' '}
            <a href="mailto:support@donationreceipt.in" style={{ color: '#31708f', textDecoration: 'none' }}>
              support@donationreceipt.in
            </a>
          </span>
        </div>

        {/* 3 Summary Stat Cards matching Screenshot 3 */}
        <div className="subscriptions-summary-grid">
          {/* Active Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #28a745',
              borderRadius: '4px',
              padding: '24px 15px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#28a745',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '10px'
              }}
            >
              Active
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#212529',
                lineHeight: 1
              }}
            >
              1
            </div>
          </div>

          {/* Upcoming Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #f0ad4e',
              borderRadius: '4px',
              padding: '24px 15px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#f0ad4e',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '10px'
              }}
            >
              Upcoming
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#212529',
                lineHeight: 1
              }}
            >
              0
            </div>
          </div>

          {/* Expired Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              padding: '24px 15px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#6c757d',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '10px'
              }}
            >
              Expired
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#212529',
                lineHeight: 1
              }}
            >
              4
            </div>
          </div>
        </div>

        {/* Subscriptions Table matching Screenshot 3 */}
        <div className="table-responsive">
          <table className="donation-head-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eafaf1' }}>
                <th style={{ width: '45px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  #
                </th>
                <th style={{ width: '150px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Invoice No.
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Plan
                </th>
                <th style={{ width: '115px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Start Date
                </th>
                <th style={{ width: '115px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  End Date
                </th>
                <th style={{ width: '105px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Amount
                </th>
                <th style={{ width: '85px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Status
                </th>
                <th style={{ width: '85px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Payment
                </th>
                <th style={{ width: '70px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_DATA.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9'
                  }}
                >
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.id}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.invoiceNo}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.plan}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.startDate}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.endDate}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                    {row.amount}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px' }}>
                    {row.status === 'Active' ? (
                      <span
                        style={{
                          backgroundColor: '#28a745',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: '#6c757d',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}
                      >
                        Expired
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px' }}>
                    <span
                      style={{
                        backgroundColor: '#28a745',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}
                    >
                      Paid
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px' }}>
                    {row.canDownload ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(row.invoiceNo)}
                        title="Download Invoice PDF"
                        style={{
                          backgroundColor: '#007bff',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          width: '28px',
                          height: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                      >
                        <Download size={14} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
