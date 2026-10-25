import React from 'react';

export default function StatCards({ orders, bookings, dealers = [] }) {
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (Number(order.totalAmount) || 0);
  }, 0);

  const pendingOrders = orders.filter(
    (o) => (o.orderStatus || '').toLowerCase() === 'placed' || (o.orderStatus || '').toLowerCase() === 'confirmed'
  ).length;

  const totalBookings = bookings.length;

  const requestedBookings = bookings.filter(
    (b) => (b.bookingStatus || '').toLowerCase() === 'requested'
  ).length;

  const activeDealers = dealers.filter(
    (d) => (d.status || '').toLowerCase() === 'approved'
  ).length;

  const pendingDealers = dealers.filter(
    (d) => (d.status || '').toLowerCase() === 'pending'
  ).length;

  const formatINR = (val) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{totalOrders}</span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
          📦
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Gross Revenue</span>
          <span className="stat-value">{formatINR(totalRevenue)}</span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
          💰
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Orders In Progress</span>
          <span className="stat-value">{pendingOrders}</span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
          ⏳
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Service Requests</span>
          <span className="stat-value">{totalBookings}</span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
          🛠️
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Pending Service</span>
          <span className="stat-value">{requestedBookings}</span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
          🔔
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Authorized Dealers</span>
          <span className="stat-value">
            {activeDealers}
            {pendingDealers > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', marginLeft: '6px' }}>
                ({pendingDealers} req)
              </span>
            )}
          </span>
        </div>
        <div className="stat-icon-circle" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
          🏢
        </div>
      </div>
    </div>
  );
}
