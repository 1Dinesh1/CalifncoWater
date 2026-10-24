import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import StatCards from './components/StatCards';
import OrdersTable from './components/OrdersTable';
import BookingsTable from './components/BookingsTable';
import AdminSetupNotice from './components/AdminSetupNotice';
import LoginView from './components/LoginView';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'bookings' | 'security'
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Track Auth state and verify administrator role before granting dashboard access
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAdminVerified(false);
        setHasAdminAccess(false);
        setAuthLoading(false);
        return;
      }

      // User is authenticated in Firebase Auth.
      // Must strictly verify the presence of an authorized document at /admins/{user.uid}
      // before mounting the operational dashboard or admin navigation.
      setAuthLoading(true);
      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
          // Document exists at /admins/{uid} -> Verified Administrator
          setCurrentUser(user);
          setIsAdminVerified(true);
          setHasAdminAccess(true);
          setAccessDeniedMessage('');
          setAuthLoading(false);
        } else {
          // Document does not exist in /admins/{uid} -> Unauthorized / Customer
          // Immediately sign out the session and block access
          await signOut(auth);
          setCurrentUser(null);
          setIsAdminVerified(false);
          setHasAdminAccess(false);
          setAccessDeniedMessage(
            `Access Denied: Your account (${user.email || user.uid}) does not have administrative privileges. This console is strictly restricted to authorized Califnco Water operational staff.`
          );
          setAuthLoading(false);
        }
      } catch (err) {
        // Verification failed (permission-denied or network error)
        // Safety guard: Never grant access if verification fails
        await signOut(auth);
        setCurrentUser(null);
        setIsAdminVerified(false);
        setHasAdminAccess(false);
        setAccessDeniedMessage(
          `Access Denied: Administrative credential verification failed (${err.message || 'Permission denied'}). Access to console is blocked.`
        );
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch Firestore Data (executed only for verified administrators)
  const fetchData = useCallback(async (user) => {
    if (!user) return;
    setIsDataLoading(true);
    setPermissionError(null);

    // 1. Fetch Orders collection
    try {
      const ordersRef = collection(db, 'orders');
      const ordersSnap = await getDocs(ordersRef);
      const ordersList = [];
      ordersSnap.forEach((d) => {
        ordersList.push({ id: d.id, ...d.data() });
      });

      // Sort client-side descending by createdAt so newest appear first
      ordersList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : 0;
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : 0;
        return timeB - timeA;
      });

      setOrders(ordersList);
    } catch (err) {
      setPermissionError(err.message || 'Permission denied when reading orders collection.');
    }

    // 2. Fetch Service Bookings collection
    try {
      const bookingsRef = collection(db, 'serviceBookings');
      const bookingsSnap = await getDocs(bookingsRef);
      const bookingsList = [];
      bookingsSnap.forEach((d) => {
        bookingsList.push({ id: d.id, ...d.data() });
      });

      // Sort client-side descending by createdAt
      bookingsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : 0;
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : 0;
        return timeB - timeA;
      });

      setBookings(bookingsList);
    } catch (err) {
      setPermissionError((prev) => prev || err.message || 'Permission denied when reading service bookings.');
    }

    setIsDataLoading(false);
    setIsRefreshing(false);
  }, []);

  // Fetch when verified administrator session is established
  useEffect(() => {
    if (currentUser && isAdminVerified) {
      fetchData(currentUser);
    } else {
      setOrders([]);
      setBookings([]);
      setPermissionError(null);
    }
  }, [currentUser, isAdminVerified, fetchData]);

  const handleRefresh = () => {
    if (currentUser) {
      setIsRefreshing(true);
      fetchData(currentUser);
      showToast('Refreshing orders and bookings...');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      alert(`Sign out error: ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      showToast(`Order #${orderId.slice(0, 8)} updated to "${newStatus}"!`);
    } catch (err) {
      alert(
        `Order status update rejected by Firestore: ${err.message}\n\nReason: Current firestore.rules strictly deny client updates (allow update, delete: if false). Update will work once the proposed admin security rule is deployed.`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setIsUpdating(true);
    try {
      const bookingRef = doc(db, 'serviceBookings', bookingId);
      await updateDoc(bookingRef, { bookingStatus: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: newStatus } : b))
      );
      showToast(`Booking #${bookingId.slice(0, 8)} updated to "${newStatus}"!`);
    } catch (err) {
      alert(
        `Booking status update rejected by Firestore: ${err.message}\n\nReason: Current firestore.rules strictly deny client updates (allow update, delete: if false). Update will work once the proposed admin security rule is deployed.`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>💧</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
            Verifying Administrator Credentials...
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Checking role authorization in Cloud Firestore
          </div>
        </div>
      </div>
    );
  }

  // If user is not signed in or not verified as an administrator,
  // render the LoginView with access-denied messaging if rejected
  if (!currentUser || !isAdminVerified) {
    return (
      <LoginView
        accessDeniedMessage={accessDeniedMessage}
        onClearAccessDenied={() => setAccessDeniedMessage('')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="main-content">
        {/* KPI Overview Cards */}
        <StatCards orders={orders} bookings={bookings} />

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>📦 Orders Desk</span>
            <span className="tab-count">{orders.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>🛠️ Service Desk</span>
            <span className="tab-count">{bookings.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span>🔐 Admin Authorization & Setup</span>
            {!hasAdminAccess && <span className="tab-count" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>Pending</span>}
          </button>
        </div>

        {/* Content based on Active Tab */}
        {isDataLoading && !isRefreshing ? (
          <div className="content-card" style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Querying Cloud Firestore...
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Retrieving orders and service bookings for Califnco Water
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <>
                {permissionError && (
                  <div className="notice-banner danger">
                    <div className="notice-icon">⚠️</div>
                    <div>
                      <div className="notice-title">Firestore Access Notice</div>
                      <div className="notice-text">
                        {permissionError}. The current root <code>firestore.rules</code> restrict reading orders strictly to each customer's own UID (<code>userId == request.auth.uid</code>).
                        To enable multi-customer administrative access, follow the steps in the <strong>Admin Authorization & Setup</strong> tab.
                      </div>
                    </div>
                  </div>
                )}
                <OrdersTable
                  orders={orders}
                  onUpdateStatus={handleUpdateOrderStatus}
                  isUpdating={isUpdating}
                />
              </>
            )}

            {activeTab === 'bookings' && (
              <>
                {permissionError && (
                  <div className="notice-banner danger">
                    <div className="notice-icon">⚠️</div>
                    <div>
                      <div className="notice-title">Firestore Access Notice</div>
                      <div className="notice-text">
                        {permissionError}. The current root <code>firestore.rules</code> restrict reading bookings strictly to each customer's own UID (<code>userId == request.auth.uid</code>).
                        To enable multi-customer administrative access, follow the steps in the <strong>Admin Authorization & Setup</strong> tab.
                      </div>
                    </div>
                  </div>
                )}
                <BookingsTable
                  bookings={bookings}
                  onUpdateStatus={handleUpdateBookingStatus}
                  isUpdating={isUpdating}
                />
              </>
            )}

            {activeTab === 'security' && (
              <AdminSetupNotice
                currentUser={currentUser}
                hasAdminAccess={hasAdminAccess}
                permissionError={permissionError}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
