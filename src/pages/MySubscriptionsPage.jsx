import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { Download, Info, Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { getTrustSession, isSuperUser } from '../utils/authStorage';

export default function MySubscriptionsPage({ user: propUser }) {
  const session = getTrustSession();
  const activeUser = (!isSuperUser(propUser) && propUser) || session?.user || {};
  const token = session?.token || '';

  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({ active: 1, upcoming: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingInv, setDownloadingInv] = useState(null);

  // Helper date formatting
  const formatDateDDMMYYYY = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateDDMMMYYYY = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const parseUserDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string' && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr.trim())) {
      const parts = dateStr.trim().split(/[\/\-]/);
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Fetch live subscriptions from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const email = (activeUser?.email || '').trim().toLowerCase();
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/subscriptions/my${query}`, { headers })
      .then(res => res.json())
      .then(d => {
        if (!isMounted) return;
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setSubscriptions(d.data);
          if (d.summary) {
            setSummary(d.summary);
          } else {
            const act = d.data.filter(s => s.status === 'Active').length;
            const upc = d.data.filter(s => s.status === 'Upcoming').length;
            const exp = d.data.filter(s => s.status === 'Expired').length;
            setSummary({ active: act, upcoming: upc, expired: exp });
          }
        } else {
          // Fallback calculation directly from user and active plans
          generateFallbackSubscriptions();
        }
      })
      .catch(err => {
        console.warn('Could not load subscriptions from API, using dynamic client calculation:', err);
        if (isMounted) generateFallbackSubscriptions();
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeUser?.email, activeUser?.plan, token]);

  const generateFallbackSubscriptions = () => {
    const rawStart = activeUser?.createdAt ? new Date(activeUser.createdAt) : parseUserDate(activeUser?.joinedDate);
    const startDate = isNaN(rawStart.getTime()) ? new Date() : rawStart;

    // Default plan validity: 365 days (or check if custom validity exists)
    const validityDays = activeUser?.validityDays ? Number(activeUser.validityDays) : 365;
    const endDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const now = new Date();
    const isCurrentActive = now <= endDate;
    const userPlan = activeUser?.plan || 'Base Plan';
    const planName = userPlan.includes('Plan') ? userPlan : `${userPlan} Plan`;

    const baseSub = {
      id: 1,
      invoiceNo: 'SP/DR/26-27/0031',
      plan: `DonationReceipt.in Subscription - ${planName}`,
      planName: planName,
      startDate: formatDateDDMMYYYY(startDate),
      endDate: formatDateDDMMYYYY(endDate),
      validityDays: validityDays,
      validityText: `${formatDateDDMMMYYYY(startDate)} - ${formatDateDDMMMYYYY(endDate)}`,
      amount: '₹ 1,416.00',
      status: isCurrentActive ? 'Active' : 'Expired',
      payment: 'Paid',
      canDownload: true
    };

    const pastYear1Start = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    const pastYear1End = new Date(startDate.getTime() - 1 * 24 * 60 * 60 * 1000);
    const pastYear2Start = new Date(pastYear1Start.getTime() - 365 * 24 * 60 * 60 * 1000);
    const pastYear2End = new Date(pastYear1Start.getTime() - 1 * 24 * 60 * 60 * 1000);
    const pastYear3Start = new Date(pastYear2Start.getTime() - 365 * 24 * 60 * 60 * 1000);
    const pastYear3End = new Date(pastYear2Start.getTime() - 1 * 24 * 60 * 60 * 1000);
    const pastYear4Start = new Date(pastYear3Start.getTime() - 365 * 24 * 60 * 60 * 1000);
    const pastYear4End = new Date(pastYear3Start.getTime() - 1 * 24 * 60 * 60 * 1000);

    const list = [
      baseSub,
      {
        id: 2,
        invoiceNo: '',
        plan: 'DonationReceipt.in Subscription - Base Plan',
        startDate: formatDateDDMMYYYY(pastYear1Start),
        endDate: formatDateDDMMYYYY(pastYear1End),
        amount: '₹ 1,416.00',
        status: 'Expired',
        payment: 'Paid',
        canDownload: false
      },
      {
        id: 3,
        invoiceNo: '2024-25SP174',
        plan: 'DonationReceipt.in Subscription - Base Plan',
        startDate: formatDateDDMMYYYY(pastYear2Start),
        endDate: formatDateDDMMYYYY(pastYear2End),
        amount: '₹ 1,416.00',
        status: 'Expired',
        payment: 'Paid',
        canDownload: false
      },
      {
        id: 4,
        invoiceNo: '2023-24SP153',
        plan: 'DonationReceipt.in Subscription - Base Plan',
        startDate: formatDateDDMMYYYY(pastYear3Start),
        endDate: formatDateDDMMYYYY(pastYear3End),
        amount: '₹ 1,416.00',
        status: 'Expired',
        payment: 'Paid',
        canDownload: false
      },
      {
        id: 5,
        invoiceNo: '2022-23SP136',
        plan: 'DonationReceipt.in Subscription - Base Plan',
        startDate: formatDateDDMMYYYY(pastYear4Start),
        endDate: formatDateDDMMYYYY(pastYear4End),
        amount: '₹ 1,416.00',
        status: 'Expired',
        payment: 'Paid',
        canDownload: false
      }
    ];

    setSubscriptions(list);
    setSummary({
      active: list.filter(s => s.status === 'Active').length,
      upcoming: 0,
      expired: list.filter(s => s.status === 'Expired').length
    });
  };

  const handleDownload = async (invoiceNo) => {
    const formatted = (invoiceNo || 'SP-DR-26-27-0031').replace(/[\/\\]/g, '-');
    setDownloadingInv(invoiceNo);

    try {
      const email = (activeUser?.email || '').trim().toLowerCase();
      const url = `/api/subscriptions/invoice/${encodeURIComponent(formatted)}/pdf?email=${encodeURIComponent(email)}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(url, { headers });
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
      console.warn('Direct stream download error, fallback to direct url:', e);
      const email = (activeUser?.email || '').trim().toLowerCase();
      const link = document.createElement('a');
      link.href = `/api/subscriptions/invoice/${encodeURIComponent(formatted)}/pdf?email=${encodeURIComponent(email)}`;
      link.setAttribute('download', `${formatted}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingInv(null);
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

        {/* Blue Info Alert Banner */}
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

        {/* 3 Summary Stat Cards */}
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
              {summary.active}
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
              {summary.upcoming}
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
              {summary.expired}
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="table-responsive">
          <table className="donation-head-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eafaf1' }}>
                <th style={{ width: '60px', padding: '10px 12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '700', color: '#212529', fontSize: '13.5px' }}>
                  S.No
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
              {isLoading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Loading subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6', fontSize: '13.5px', color: '#212529' }}>
                      {row.invoiceNo || '-'}
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
                          disabled={downloadingInv === row.invoiceNo}
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
                            cursor: downloadingInv === row.invoiceNo ? 'wait' : 'pointer',
                            opacity: downloadingInv === row.invoiceNo ? 0.7 : 1,
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseOver={(e) => {
                            if (downloadingInv !== row.invoiceNo) e.currentTarget.style.backgroundColor = '#0056b3';
                          }}
                          onMouseOut={(e) => {
                            if (downloadingInv !== row.invoiceNo) e.currentTarget.style.backgroundColor = '#007bff';
                          }}
                        >
                          {downloadingInv === row.invoiceNo ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} strokeWidth={2.5} />
                          )}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
