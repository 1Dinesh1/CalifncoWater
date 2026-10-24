import React from 'react';

export default function Navbar({ currentUser, onSignOut, onRefresh, isRefreshing }) {
  const emailPrefix = currentUser?.email ? currentUser.email.split('@')[0] : 'Admin';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-group">
          <div className="brand-icon-box">💧</div>
          <div>
            <div className="brand-title">
              Califnco Water
              <span className="brand-badge">Admin Console</span>
            </div>
            <div className="brand-tagline">Pure & Safe Hydration Operations</div>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className="btn-secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Orders & Service Requests"
          >
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}>
              🔄
            </span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="user-badge" title={`UID: ${currentUser?.uid}`}>
            <div className="user-avatar">
              {(currentUser?.email || 'A')[0].toUpperCase()}
            </div>
            <span>{currentUser?.email || emailPrefix}</span>
          </div>

          <button
            className="btn-secondary"
            onClick={onSignOut}
            title="Sign out of Admin Console"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
