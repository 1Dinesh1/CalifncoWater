import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginView({ accessDeniedMessage = '', onClearAccessDenied }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (accessDeniedMessage && onClearAccessDenied) onClearAccessDenied();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
    if (accessDeniedMessage && onClearAccessDenied) onClearAccessDenied();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (onClearAccessDenied) onClearAccessDenied();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your administrator email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // Note: Admin document verification is performed immediately by App.jsx
      // before mounting the dashboard. If not verified, App.jsx signs out and displays
      // an access-denied message.
    } catch (err) {
      let friendlyMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMsg = 'Access temporarily locked due to multiple failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMsg = 'Network connection error. Please check your internet connectivity.';
      } else if (err.message) {
        friendlyMsg = err.message;
      }
      setError(friendlyMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">💧</div>
          <h1 className="login-title">Califnco Water</h1>
          <p className="login-subtitle">Operational Admin Console</p>
        </div>

        {/* Access Denied Warning Banner */}
        {accessDeniedMessage && (
          <div className="notice-banner danger" style={{ marginBottom: '16px', padding: '12px 14px' }}>
            <span style={{ fontSize: '18px' }}>🚫</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: 800, marginBottom: '2px' }}>
                Access Denied
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c', lineHeight: '1.4' }}>
                {accessDeniedMessage}
              </div>
            </div>
          </div>
        )}

        {/* Regular Auth Error Banner */}
        {error && (
          <div className="notice-banner danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Staff Email Address</label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              placeholder="e.g. admin@califnco.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating & Verifying Admin Role...' : 'Sign In to Console'}
          </button>
        </form>

        <p className="login-help-text">
          🔒 Protected internal portal. Authorized Califnco Water operational personnel only. All access attempts are verified against Cloud Firestore admin registry.
        </p>
      </div>
    </div>
  );
}
