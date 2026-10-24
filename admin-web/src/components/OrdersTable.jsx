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

function formatINR(val) {
  return '₹' + (Number(val) || 0).toLocaleString('en-IN');
}

export default function OrdersTable({ orders, onUpdateStatus, isUpdating }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchStatus =
        statusFilter === 'All' ||
        (order.orderStatus || '').toLowerCase() === statusFilter.toLowerCase();

      const matchSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        (order.customerEmail || '').toLowerCase().includes(q) ||
        (order.customerName || '').toLowerCase().includes(q) ||
        (order.customerPhone || '').toLowerCase().includes(q) ||
        (order.deliveryAddress || '').toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="content-card">
      <div className="card-header-bar">
        <div className="card-title">
          <span>📦 Customer Orders</span>
          <span className="brand-badge">{filteredOrders.length} of {orders.length}</span>
        </div>

        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🔎</div>
          <div className="state-title">No orders found</div>
          <div className="state-desc">
            {search || statusFilter !== 'All'
              ? 'Try resetting your search query or filter options to see orders.'
              : 'No customer orders have been placed in the database yet.'}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isExpanded = expandedId === order.id;
                const status = (order.orderStatus || 'placed').toLowerCase();

                return (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>
                        <span className="id-badge" title={order.id}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                        {formatTimestamp(order.createdAt)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {order.customerName || order.customerEmail?.split('@')[0] || 'Customer'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          📞 {order.customerPhone || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          ✉️ {order.customerEmail || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0284c7' }}>
                          {formatINR(order.totalAmount)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {order.totalItems || order.items?.length || 1} items
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: order.paymentStatus === 'paid' ? '#16a34a' : '#b45309',
                            backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${order.paymentStatus === 'paid' ? '#bbf7d0' : '#fef08a'}`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          COD • {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${status}`}>
                          ● {status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            className="status-select"
                            value={order.orderStatus || 'placed'}
                            disabled={isUpdating}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                            title="Update Order Status in Firestore"
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => toggleExpand(order.id)}
                            title="Toggle Full Order Details"
                          >
                            {isExpanded ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Order Details Drawer */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan="7" style={{ padding: '16px 20px', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {/* Items List */}
                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Ordered Items ({order.items?.length || 0})
                              </div>
                              {Array.isArray(order.items) && order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < order.items.length - 1 ? '1px dashed #e2e8f0' : 'none', fontSize: '12px' }}>
                                  <div>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</span>
                                    <span style={{ color: '#64748b', marginLeft: '6px' }}>× {item.quantity}</span>
                                  </div>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                    {formatINR(item.itemSubtotal || (item.unitPrice * item.quantity))}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Delivery & Metadata */}
                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Shipping & Contact
                              </div>
                              <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '6px', lineHeight: '1.4' }}>
                                <strong>Delivery Address:</strong> {order.deliveryAddress || 'No address specified'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>
                                <strong>Customer UID:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>{order.userId}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#1e293b' }}>
                                <strong>Firestore Document ID:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>{order.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
