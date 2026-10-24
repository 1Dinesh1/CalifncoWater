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

export default function BookingsTable({ bookings, onUpdateStatus, isUpdating }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchType =
        typeFilter === 'All' ||
        (booking.serviceType || '').toLowerCase() === typeFilter.toLowerCase();

      const matchStatus =
        statusFilter === 'All' ||
        (booking.bookingStatus || '').toLowerCase() === statusFilter.toLowerCase();

      const matchSearch =
        !q ||
        booking.id.toLowerCase().includes(q) ||
        (booking.customerEmail || '').toLowerCase().includes(q) ||
        (booking.customerName || '').toLowerCase().includes(q) ||
        (booking.customerPhone || '').toLowerCase().includes(q) ||
        (booking.address || '').toLowerCase().includes(q) ||
        (booking.notes || '').toLowerCase().includes(q);

      return matchType && matchStatus && matchSearch;
    });
  }, [bookings, search, typeFilter, statusFilter]);

  return (
    <div className="content-card">
      <div className="card-header-bar">
        <div className="card-title">
          <span>🛠️ Service Bookings Desk</span>
          <span className="brand-badge">{filteredBookings.length} of {bookings.length}</span>
        </div>

        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, customer, address, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Service Types</option>
            <option value="Installation">Installation</option>
            <option value="Repair">Repair</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🔎</div>
          <div className="state-title">No service bookings found</div>
          <div className="state-desc">
            {search || typeFilter !== 'All' || statusFilter !== 'All'
              ? 'Try resetting your search query or filter options to see service requests.'
              : 'No service bookings have been submitted by customers yet.'}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Request Date</th>
                <th>Service Type</th>
                <th>Preferred Slot</th>
                <th>Customer Contact</th>
                <th>Service Address</th>
                <th>Notes / Issue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const status = (b.bookingStatus || 'requested').toLowerCase();

                return (
                  <tr key={b.id}>
                    <td>
                      <span className="id-badge" title={b.id}>
                        #{b.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                      {formatTimestamp(b.createdAt)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: b.serviceType === 'Installation' ? '#0284c7' : b.serviceType === 'Repair' ? '#d97706' : '#16a34a'
                        }}
                      >
                        {b.serviceType === 'Installation' ? '🛠️' : b.serviceType === 'Repair' ? '🔧' : '🧰'} {b.serviceType}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        📅 {b.preferredDate || 'Not specified'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        ⏰ {b.preferredSlot || 'Anytime'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {b.customerName || b.customerEmail?.split('@')[0] || 'Customer'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        📞 {b.customerPhone || 'N/A'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        ✉️ {b.customerEmail || 'N/A'}
                      </div>
                    </td>
                    <td style={{ maxWidth: '220px', lineHeight: '1.4', fontSize: '12px', color: '#334155' }}>
                      {b.address || 'N/A'}
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '12px', color: '#64748b', fontStyle: b.notes ? 'normal' : 'italic' }}>
                      {b.notes || 'None'}
                    </td>
                    <td>
                      <span className={`status-pill status-${status}`}>
                        ● {status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <select
                        className="status-select"
                        value={b.bookingStatus || 'requested'}
                        disabled={isUpdating}
                        onChange={(e) => onUpdateStatus(b.id, e.target.value)}
                        title="Update Booking Status in Firestore"
                      >
                        <option value="requested">Requested</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
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
