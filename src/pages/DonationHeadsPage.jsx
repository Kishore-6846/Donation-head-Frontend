import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Plus, Pencil, Trash2, Shield, Sparkles } from 'lucide-react';

const DEFAULT_HEADS = [
  {
    _id: 'dh_1',
    name: 'Anna Chathiram',
    formattedDate: '08-07-2026 10:46am',
    createdAt: '2026-07-08T10:46:00.000Z'
  },
  {
    _id: 'dh_2',
    name: '365 Drive',
    formattedDate: '26-06-2025 11:03am',
    createdAt: '2025-06-26T11:03:00.000Z'
  },
  {
    _id: 'dh_3',
    name: 'Food Drive',
    formattedDate: '26-06-2025 11:03am',
    createdAt: '2025-06-26T11:03:00.000Z'
  },
  {
    _id: 'dh_4',
    name: 'Fengal Cyclone',
    formattedDate: '06-01-2025 02:43pm',
    createdAt: '2025-01-06T14:43:00.000Z'
  },
  {
    _id: 'dh_5',
    name: 'Kind',
    formattedDate: '26-10-2024 12:22pm',
    createdAt: '2024-10-26T12:22:00.000Z'
  },
  {
    _id: 'dh_6',
    name: 'General',
    formattedDate: '16-04-2023 10:18am',
    createdAt: '2023-04-16T10:18:00.000Z'
  }
];

const deduplicateHeadsList = (list) => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenBases = new Set();
  const result = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item._id || item.id || '').trim();
    const raw = String(item.rawName || item.name || '').trim();
    if (!raw && !id) continue;
    const base = raw.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();

    if (id && seenIds.has(id)) continue;
    if (base && seenBases.has(base)) continue;

    if (id) seenIds.add(id);
    if (base) seenBases.add(base);
    result.push({
      ...item,
      _id: id || `dh_${Math.random()}`,
      name: String(item.name || item.rawName || raw || 'Donation Head').trim(),
      rawName: raw || String(item.name || 'Donation Head').trim()
    });
  }
  return result;
};

const getInitialHeads = () => {
  try {
    const custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
    const safeCustom = Array.isArray(custom) ? custom : [];
    return deduplicateHeadsList([...safeCustom, ...DEFAULT_HEADS]);
  } catch (e) {
    return DEFAULT_HEADS;
  }
};

export default function DonationHeadsPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; }
  })();
  const isSuperAdmin =
    location.pathname.toLowerCase().startsWith('/superadmin') ||
    Boolean(activeUser?.role && activeUser.role.toLowerCase().includes('super')) ||
    Boolean(activeUser?.isSuperAdmin);
  const activeTrustName = activeUser?.trustName || activeUser?.name || '';

  const [heads, setHeads] = useState(getInitialHeads);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Themed popup state
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null,
    onCancel: null
  });

  const fetchHeads = async () => {
    try {
      let custom = [];
      try {
        const stored = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        custom = Array.isArray(stored) ? stored : [];
      } catch (e) {}

      let url = `/api/donation-heads?search=${encodeURIComponent(searchTerm || '')}&limit=100`;
      if (isSuperAdmin) {
        url += '&isSuperAdmin=true';
      } else if (activeTrustName) {
        url += `&trustName=${encodeURIComponent(activeTrustName)}&trustEmail=${encodeURIComponent(activeUser?.email || '')}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        try {
          const backendBases = new Set(
            data.data
              .map(d => String(d?.rawName || d?.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase())
              .filter(Boolean)
          );
          const cleanedCustom = custom.filter(c => {
            if (!c) return false;
            const cBase = String(c.rawName || c.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
            return cBase && !backendBases.has(cBase);
          });
          localStorage.setItem('custom_donation_heads', JSON.stringify(cleanedCustom));
        } catch (e) {}

        const merged = deduplicateHeadsList([...data.data, ...custom]);
        setHeads(merged);
      } else {
        const merged = deduplicateHeadsList([...custom, ...DEFAULT_HEADS]);
        setHeads(merged);
      }
    } catch (e) {
      console.error(e);
      let custom = [];
      try {
        const stored = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
        custom = Array.isArray(stored) ? stored : [];
      } catch (err) {}
      setHeads(deduplicateHeadsList([...custom, ...DEFAULT_HEADS]));
    }
  };

  useEffect(() => {
    fetchHeads();
  }, [searchTerm, activeTrustName, isSuperAdmin]);

  const handleDeleteClick = (id, name) => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: isSuperAdmin
        ? `Are you sure you want to permanently delete "${name}"? It will be deleted from all admin panels also.`
        : `Are you sure you want to delete the donation head "${name}" from your panel?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        let deleteUrl = `/api/donation-heads/${id}`;
        if (isSuperAdmin) {
          deleteUrl += '?isSuperAdmin=true';
        } else if (activeTrustName) {
          deleteUrl += `?trustName=${encodeURIComponent(activeTrustName)}&trustEmail=${encodeURIComponent(activeUser?.email || '')}`;
        }

        try {
          await fetch(deleteUrl, { method: 'DELETE' });
        } catch (e) {
          console.error(e);
        }

        // Also remove from localStorage if present
        try {
          const custom = JSON.parse(localStorage.getItem('custom_donation_heads') || '[]');
          const baseName = name.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
          const updated = custom.filter(c => {
            const cBase = (c.rawName || c.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
            return c._id !== id && cBase !== baseName;
          });
          localStorage.setItem('custom_donation_heads', JSON.stringify(updated));
        } catch (e) {}

        setHeads(prev => prev.filter(h => {
          const hBase = (h.rawName || h.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
          const targetBase = name.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
          return h._id !== id && hBase !== targetBase;
        }));

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Deleted!',
          message: isSuperAdmin
            ? `Donation head "${name}" was permanently deleted across all panels.`
            : `Donation head "${name}" was removed from your admin panel.`,
          confirmText: 'OK',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      },
      onCancel: () => setPopup(p => ({ ...p, isOpen: false }))
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter and sort logic with safety fallbacks
  let processedHeads = (heads || []).filter(h => {
    if (!h) return false;
    const hName = String(h.name || h.rawName || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase().trim();
    return !term || hName.includes(term);
  });

  if (sortField === 'name') {
    processedHeads.sort((a, b) => {
      const nameA = String(a?.name || a?.rawName || '');
      const nameB = String(b?.name || b?.rawName || '');
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  } else if (sortField === 'date') {
    processedHeads.sort((a, b) => {
      const dA = new Date(a?.createdAt || 0);
      const dB = new Date(b?.createdAt || 0);
      return sortAsc ? dA - dB : dB - dA;
    });
  }

  const totalEntries = processedHeads.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = processedHeads.slice(startIndex, startIndex + entriesPerPage);

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>{isSuperAdmin ? 'SUPER ADMIN • GLOBAL DONATION CATEGORIES' : 'DONATION CATEGORIES'}</span>
          </div>
          <h1 className="mint-hero-title">{isSuperAdmin ? 'Global Donation Heads' : 'Manage Donation Heads'}</h1>
          <p className="mint-hero-subtitle">
            {isSuperAdmin
              ? 'Create and manage unified donation heads that automatically propagate to all registered trust accounts.'
              : 'Create and organize your cause categories for seamless tracking and transparent donor receipts.'}
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add"
            onClick={() => navigate(isSuperAdmin ? '/superadmin/new-donation-head' : '/trust/new-donation-head')}
            title="Add New Donation Head"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="mint-table-card-container">
        {/* Controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '13.5px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
            <label htmlFor="donation-heads-search" style={{ fontWeight: '500' }}>Search:</label>
            <input
              id="donation-heads-search"
              type="text"
              placeholder="Search donation heads..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                width: '220px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00a651')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="donation-head-table table-mint">
            <thead>
              <tr>
                <th style={{ width: '60px' }} onClick={() => handleSort('index')}>
  #
  <span className="datatable-sort-arrows">
    <span>▲</span>
    <span>▼</span>
  </span>
</th>

<th style={{ width: '40%' }} onClick={() => handleSort('name')}>
  Name
  <span className="datatable-sort-arrows">
    <span>▲</span>
    <span>▼</span>
  </span>
</th>

<th style={{ width: '30%' }} onClick={() => handleSort('date')}>
  Created At
  <span className="datatable-sort-arrows">
    <span>▲</span>
    <span>▼</span>
  </span>
</th>

<th style={{ width: '20%' }}>
  Actions
  <span className="datatable-sort-arrows">
    <span>▲</span>
    <span>▼</span>
  </span>
</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((head, idx) => (
                <tr key={head._id || idx}>
                  <td style={{ fontWeight: '600', color: '#475569' }}>
                    {startIndex + idx + 1}
                  </td>
                  <td style={{ fontWeight: '500', color: '#1e293b' }}>{head.name || head.rawName || 'Donation Head'}</td>
                  <td style={{ color: '#475569' }}>{head.formattedDate || '16-04-2023 10:18am'}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="action-btn"
                        title="Edit"
                        onClick={() => navigate(isSuperAdmin ? `/superadmin/new-donation-head?id=${head._id}` : `/trust/new-donation-head?id=${head._id}`)}
                      >
                        <Pencil size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        className="action-btn green-del"
                        title="Delete"
                        onClick={() => handleDeleteClick(head._id, head.name || head.rawName || '')}
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentEntries.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                    {loading ? 'Loading heads...' : 'No donation heads found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination matching Screenshot 1 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13.5px', color: '#333', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === 1 ? '#6c757d' : '#007bff',
                cursor: currentPage === 1 ? 'default' : 'pointer',
                fontSize: '13.5px',
                padding: '4px 8px',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  backgroundColor: currentPage === pageNum ? '#f8f9fa' : '#ffffff',
                  border: '1px solid #dee2e6',
                  color: currentPage === pageNum ? '#333333' : '#007bff',
                  fontWeight: currentPage === pageNum ? '600' : '400',
                  padding: '4px 11px',
                  borderRadius: '2px',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === totalPages || totalPages === 0 ? '#6c757d' : '#007bff',
                cursor: currentPage === totalPages || totalPages === 0 ? 'default' : 'pointer',
                fontSize: '13.5px',
                padding: '4px 8px',
                opacity: currentPage === totalPages || totalPages === 0 ? 0.6 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Themed Simple Popup for Delete Confirmation & Alerts */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onCancel={popup.onCancel}
      />
    </>
  );
}
