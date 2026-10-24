import React, { useState } from 'react';

export default function AdminSetupNotice({ currentUser, hasAdminAccess, permissionError }) {
  const [copied, setCopied] = useState(false);

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Dynamic Authorization Status Banner */}
      {!hasAdminAccess && (
        <div className="notice-banner danger">
          <div className="notice-icon">🔒</div>
          <div style={{ flex: 1 }}>
            <div className="notice-title">
              Admin Authorization Required — Live Access Currently Restricted
            </div>
            <div className="notice-text">
              {permissionError ? (
                <span>
                  <strong>Firestore Notice:</strong> {permissionError}. The current root <code>firestore.rules</code> file strictly enforces customer ownership (<code>userId == request.auth.uid</code>) and denies updates.
                </span>
              ) : (
                <span>
                  Your account is authenticated via Firebase Auth, but has not yet been granted administrator privileges in Cloud Firestore.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {hasAdminAccess && (
        <div className="notice-banner info">
          <div className="notice-icon">🛡️</div>
          <div style={{ flex: 1 }}>
            <div className="notice-title">Verified Administrator Session Active</div>
            <div className="notice-text">
              Your account UID is verified in the Firestore <code>admins</code> collection. You have authorized read/write access to live orders and service requests.
            </div>
          </div>
        </div>
      )}

      {/* Guide Card */}
      <div className="content-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          🔐 Secure Admin Authorization Design & Configuration
        </h3>
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
          To maintain zero-trust security without paid cloud functions or external servers, admin authorization is designed around a dedicated, protected Firestore collection: <code>admins/{'{adminUid}'}</code>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Step 1 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Step 1: Your Admin UID
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
              Copy your Firebase Auth UID below to add to the Firestore database:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={currentUser?.uid || 'Not signed in'}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
              <button className="btn-primary" onClick={handleCopyUid} style={{ fontSize: '12px', padding: '6px 12px' }}>
                {copied ? '✓ Copied' : 'Copy UID'}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Step 2: Firebase Console Configuration
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              1. Open <strong>Firebase Console</strong> → Project <code>califnco-water</code>.<br />
              2. Go to <strong>Firestore Database</strong> → <strong>Start collection</strong>: <code>admins</code>.<br />
              3. Set <strong>Document ID</strong> = your copied <strong>UID</strong>.<br />
              4. Add field: <code>role: "admin"</code> (string), <code>email: "{currentUser?.email || 'admin@califnco.com'}"</code>.
            </p>
          </div>
        </div>

        {/* Step 3: Proposed Security Rules */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            Step 3: Update <code>firestore.rules</code> with Role-Based Guard:
          </div>
          <div className="code-snippet">
{`// 1. Role-based admin helper function (Free tier, zero compute cost)
function isAdmin() {
  return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// 2. Protect the admins collection from client manipulation
match /admins/{adminId} {
  allow read: if isAuthenticated() && request.auth.uid == adminId;
  allow write: if false; // Only manageable directly via Firebase Console
}

// 3. Allow admins to read all customer orders, and update ONLY orderStatus to valid values
match /orders/{orderId} {
  allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && /* existing strict validation */;
  allow update: if isAdmin()
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['orderStatus'])
    && request.resource.data.orderStatus in ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled']
    && request.resource.data.userId == resource.data.userId
    && request.resource.data.totalAmount == resource.data.totalAmount
    && request.resource.data.items == resource.data.items;
  allow delete: if false;
}

// 4. Allow admins to read all service bookings, and update ONLY bookingStatus to valid values
match /serviceBookings/{bookingId} {
  allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && /* existing strict validation */;
  allow update: if isAdmin()
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['bookingStatus'])
    && request.resource.data.bookingStatus in ['requested', 'confirmed', 'completed', 'cancelled']
    && request.resource.data.userId == resource.data.userId;
  allow delete: if false;
}`}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
            🔒 <strong>Security Guarantee:</strong> Ordinary customers cannot read any document in <code>orders</code> or <code>serviceBookings</code> that does not belong to their specific <code>userId</code>. Status manipulation is strictly blocked for non-admin accounts.
          </p>
        </div>
      </div>
    </div>
  );
}
