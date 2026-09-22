import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import {
  FileText,
  Search,
  Printer,
  Calendar,
  Building,
  RefreshCw,
  ExternalLink,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function AllReceiptsAdminPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trustFilter, setTrustFilter] = useState('All');
  const [headFilter, setHeadFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [trustsList, setTrustsList] = useState([]);
  const [headsList, setHeadsList] = useState(['General', 'Kind', 'Anna Chathiram', 'Food Drive', '365 Drive']);
  const [modesList, setModesList] = useState(['Online / UPI', 'Bank Transfer', 'Cheque', 'NEFT / RTGS', 'Cash']);

  const fetchAllReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [receiptsRes, usersRes] = await Promise.allSettled([
        fetch('/api/receipts?isSuperAdmin=true&status=Active&limit=1000', { headers: authHeaders }),
        fetch('/api/users', { headers: authHeaders })
      ]);

      let fetchedReceipts = [];
      if (receiptsRes.status === 'fulfilled') {
        const data = await receiptsRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          fetchedReceipts = data.data.filter(r => (r.status || 'Active') !== 'Inactive');
        }
      }

      // Build User Lookups for active trusts
      let usersList = [];
      if (usersRes.status === 'fulfilled') {
        const uData = await usersRes.value.json();
        if (uData.success && Array.isArray(uData.data)) {
          usersList = uData.data.filter(u => !u.isSuperAdmin && !/super/i.test(u.role || ''));
        }
      }

      const emailToTrust = new Map();
      const idToTrust = new Map();
      const distinctTrustNames = new Set();

      usersList.forEach(u => {
        const currentName = (u.trustName || u.name || '').trim();
        if (currentName && currentName.toLowerCase() !== 'trust organization') {
          distinctTrustNames.add(currentName);

          if (u.email) {
            emailToTrust.set(u.email.trim().toLowerCase(), currentName);
          }
          if (u.contactPersonEmail) {
            emailToTrust.set(u.contactPersonEmail.trim().toLowerCase(), currentName);
          }
          if (u._id) {
            idToTrust.set(String(u._id), currentName);
          }
          if (u.id) {
            idToTrust.set(String(u.id), currentName);
          }
        }
      });

      // Normalize receipts so each receipt gets the current/latest trust name
      const processedReceipts = fetchedReceipts.map(r => {
        const rTrustId = (r.trustId || '').toString();
        const rTrustEmail = (r.trustEmail || '').trim().toLowerCase();
        const rCreatedBy = (r.createdBy || '').trim().toLowerCase();

        let resolvedTrustName = '';
        if (rTrustId && idToTrust.has(rTrustId)) {
          resolvedTrustName = idToTrust.get(rTrustId);
        } else if (rTrustEmail && emailToTrust.has(rTrustEmail)) {
          resolvedTrustName = emailToTrust.get(rTrustEmail);
        } else if (rCreatedBy && emailToTrust.has(rCreatedBy)) {
          resolvedTrustName = emailToTrust.get(rCreatedBy);
        } else if (r.trustName && r.trustName.trim()) {
          resolvedTrustName = r.trustName.trim();
        } else {
          resolvedTrustName = 'Trust Organization';
        }

        // Only add orphan trust names if not already managed
        if (resolvedTrustName && resolvedTrustName.toLowerCase() !== 'trust organization' && !distinctTrustNames.has(resolvedTrustName)) {
          // If neither email nor id matched a registered user, keep it in distinctTrustNames
          if (!emailToTrust.has(rTrustEmail) && !emailToTrust.has(rCreatedBy) && !idToTrust.has(rTrustId)) {
            distinctTrustNames.add(resolvedTrustName);
          }
        }

        return {
          ...r,
          currentTrustName: resolvedTrustName,
          trustName: resolvedTrustName
        };
      });

      setReceipts(processedReceipts);
      setTrustsList(Array.from(distinctTrustNames).sort((a, b) => a.localeCompare(b)));

      // Collect heads & modes dynamically
      const headsSet = new Set(['General', 'Kind', 'Anna Chathiram', 'Food Drive', '365 Drive']);
      const modesSet = new Set(['Online / UPI', 'Bank Transfer', 'Cheque', 'NEFT / RTGS', 'Cash']);
      processedReceipts.forEach(r => {
        if (r.donationHead) headsSet.add(r.donationHead);
        if (r.paymentMode) modesSet.add(r.paymentMode);
      });
      setHeadsList(Array.from(headsSet));
      setModesList(Array.from(modesSet));
    } catch (e) {
      console.error('Error fetching receipts or trusts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReceipts();
  }, []);

  const filtered = receipts.filter(r => {
    if ((r.status || 'Active') === 'Inactive') return false;
    const q = search.trim().toLowerCase();
    const searchMatch = !q ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
      (r.donorName && r.donorName.toLowerCase().includes(q)) ||
      (r.trustName && r.trustName.toLowerCase().includes(q)) ||
      (r.currentTrustName && r.currentTrustName.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q));

    const trustMatch = trustFilter === 'All' ||
      (r.currentTrustName && r.currentTrustName.toLowerCase() === trustFilter.toLowerCase()) ||
      (r.trustName && r.trustName.toLowerCase() === trustFilter.toLowerCase());

    const headMatch = headFilter === 'All' || (r.donationHead && r.donationHead.toLowerCase() === headFilter.toLowerCase());
    const modeMatch = modeFilter === 'All' || (r.paymentMode && r.paymentMode.toLowerCase() === modeFilter.toLowerCase());

    return searchMatch && trustMatch && headMatch && modeMatch;
  });

  const totalAmount = filtered.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const handlePrintReceipt = (r) => {
    const url = r.receiptNo
      ? `/api/receipts/pdf?receiptNo=${encodeURIComponent(r.receiptNo)}`
      : `/api/receipts/pdf?id=${encodeURIComponent(r._id)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="dashboard-container-modern">
      <Breadcrumb items={[{ label: 'Super Admin', link: '/superadmin' }, { label: 'Donation Receipts' }]} />

      {/* Hero Banner */}
      <div className="mint-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <FileText size={14} />
            <span>DONATION RECEIPTS DIRECTORY</span>
          </div>
          <h1 className="mint-hero-title">Donation Receipts</h1>
          <p className="mint-hero-subtitle">
            Inspect all digital donation receipts generated across all registered trusts and NGOs on the platform.
          </p>
        </div>
        <div className="mint-hero-right">
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Filtered Total Raised</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="trust-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          {/* Reduced width search bar */}
          <div className="trust-search-wrapper" style={{ flex: '1 1 180px', minWidth: '160px', maxWidth: '260px' }}>
            <Search size={16} className="trust-search-icon" />
            <input
              type="text"
              placeholder="Search receipts, donors, phone..."
              className="trust-input trust-search-input"
              style={{ width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Trust / Organization Dropdown */}
          <select
            className="trust-select"
            style={{ width: '165px', height: '40px' }}
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value)}
            title="Filter by Trust / Organization"
          >
            <option value="All">All Trusts / Orgs</option>
            {trustsList.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Donation Head Dropdown */}
          <select
            className="trust-select"
            style={{ width: '150px', height: '40px' }}
            value={headFilter}
            onChange={(e) => setHeadFilter(e.target.value)}
            title="Filter by Donation Head"
          >
            <option value="All">All Heads</option>
            {headsList.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {/* Payment Mode Dropdown */}
          <select
            className="trust-select"
            style={{ width: '155px', height: '40px' }}
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            title="Filter by Payment Mode"
          >
            <option value="All">All Payment Modes</option>
            {modesList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-trust-secondary"
          style={{ padding: '8px 12px', height: '40px' }}
          onClick={fetchAllReceipts}
          title="Refresh Receipts"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Receipts Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Loading donation receipts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="trust-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No Receipts Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            No receipts matched your search or filters.
          </p>
        </div>
      ) : (
        <div className="trust-table-wrapper trust-card">
          <table className="trust-data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th>Receipt No</th>
                <th>Donor Name</th>
                <th>Trust / Organization</th>
                <th>Donation Head</th>
                <th>Amount (₹)</th>
                <th>Payment Mode</th>
                <th>Receipt Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Print / View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                      {r.receiptNo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.donorName}</div>
                    {r.phone && <span style={{ fontSize: '12px', color: '#64748b' }}>{r.phone}</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                      {r.trustName || 'Trust'}
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill badge-info">
                      {r.donationHead || 'General'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ fontSize: '13px', color: '#475569' }}>
                    {r.paymentMode || 'Online / UPI'}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {r.receiptDate}
                  </td>
                  <td>
                    <span className="badge-pill badge-success">
                      {r.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-trust-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handlePrintReceipt(r)}
                      title="View / Print Official Receipt PDF"
                    >
                      <Printer size={13} />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
