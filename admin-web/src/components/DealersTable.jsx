import React, { useState, useMemo } from 'react';

function formatTimestamp(ts) {
  if (!ts) return 'Recent';
  try {
    const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

export default function DealersTable({ dealers, onUpdateStatus, isUpdating }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredDealers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dealers.filter((dealer) => {
      const matchStatus =
        statusFilter === 'All' ||
        (dealer.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchSearch =
        !q ||
        (dealer.id || '').toLowerCase().includes(q) ||
        (dealer.businessName || '').toLowerCase().includes(q) ||
        (dealer.email || '').toLowerCase().includes(q) ||
        (dealer.phone || '').toLowerCase().includes(q) ||
        (dealer.city || '').toLowerCase().includes(q) ||
        (dealer.gstNumber || '').toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [dealers, search, statusFilter]);

  const pendingCount = dealers.filter(
    (d) => (d.status || '').toLowerCase() === 'pending'
  ).length;

  return (
    <div className="content-card">
      <div className="card-header-bar">
        <div className="card-title">
          <span>👥 Dealer Applications</span>
          <span className="brand-badge">
            {filteredDealers.length} of {dealers.length}
          </span>
          {pendingCount > 0 && (
            <span
              className="status-pill status-pending"
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              {pendingCount} Pending Review
            </span>
          )}
        </div>

        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by business, city, phone, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {dealers.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🏢</div>
          <div className="state-title">No dealer applications yet</div>
          <div className="state-desc">
            When users apply to become authorized dealers from the mobile app, their applications will appear here for review.
          </div>
        </div>
      ) : filteredDealers.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🔎</div>
          <div className="state-title">No matching applications</div>
          <div className="state-desc">
            No dealer applications match your search query "{search}" or status filter "{statusFilter}".
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dealership / Business</th>
                <th>Contact Info</th>
                <th>GSTIN</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDealers.map((dealer) => {
                const status = (dealer.status || 'pending').toLowerCase();

                return (
                  <tr key={dealer.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                        {dealer.businessName || 'Unnamed Business'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        📍 {dealer.city || 'Location unassigned'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        📞 +91 {dealer.phone || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        ✉️ {dealer.email || '—'}
                      </div>
                    </td>

                    <td>
                      {dealer.gstNumber ? (
                        <span className="id-badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                          {dealer.gstNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Not Provided</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {formatTimestamp(dealer.createdAt)}
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill status-${status}`}>
                        {status === 'approved'
                          ? '✓ Approved'
                          : status === 'rejected'
                          ? '✕ Rejected'
                          : '⏳ Pending'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {status !== 'approved' && (
                          <button
                            className="btn-approve"
                            onClick={() => onUpdateStatus(dealer.id, 'approved')}
                            disabled={isUpdating}
                            title="Approve this dealer application"
                          >
                            ✓ Approve
                          </button>
                        )}

                        {status !== 'rejected' && (
                          <button
                            className="btn-reject"
                            onClick={() => onUpdateStatus(dealer.id, 'rejected')}
                            disabled={isUpdating}
                            title="Reject this dealer application"
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
