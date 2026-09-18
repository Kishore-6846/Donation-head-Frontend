import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import SimplePopup from '../components/SimplePopup';
import { Eye, EyeOff, Lock, AlertCircle, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPopup, setForgotPopup] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.removeItem('profile_data');
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        if (data.user?.email) {
          localStorage.setItem(`profile_data_${data.user.email.toLowerCase()}`, JSON.stringify(data.user));
        }
        if (onLoginSuccess) onLoginSuccess(data.user);
        const isSuper = data.user?.role?.toLowerCase() === 'superadmin' || username.toLowerCase().includes('superadmin');
        navigate(isSuper ? '/superadmin' : '/trust/');
      } else {
        setError(data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Top green accent strip */}
      <div style={{ height: '4px', backgroundColor: '#00a651', width: '100%' }}></div>

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #eef2f5', padding: '10px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/trust/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={navLogo} alt="Donation Receipt" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.4px'
              }}
            >
              ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/trust/register"
              style={{
                border: '1px solid #ced4da',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333333',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              Registration
            </Link>
            <Link
              to="/trust/login"
              style={{
                backgroundColor: '#00a651',
                color: '#ffffff',
                padding: '7px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Green Divider Strip */}
      <div style={{ backgroundColor: '#00a651', height: '5px', width: '100%' }}></div>

      {/* Login Card Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 15px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {/* Green Header */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', textAlign: 'center', padding: '26px 20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: '13.5px', margin: 0, opacity: 0.95 }}>
                Login to continue managing your Donation Receipts
              </p>
            </div>

            {/* Card Content Form */}
            <div style={{ padding: '30px 28px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={16} flexShrink={0} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Email Address */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter your registered email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 14px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '22px' }}>
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); setForgotPopup(true); }}
                    style={{ fontSize: '13px', color: '#00a651', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#00a651',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    fontSize: '15.5px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0, 166, 81, 0.3)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              {/* Create Account Section */}
              <div style={{ textAlign: 'center', fontSize: '14px', color: '#495057' }}>
                <span>Don't have an account? </span>
                <Link
                  to="/trust/register"
                  style={{
                    color: '#00a651',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Footer inside card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', borderTop: '1px solid #eef2f6', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Shield size={14} color="#00a651" />
              <Link
                to="/superadmin/login"
                style={{
                  color: '#00a651',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>SuperAdmin Login</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Support Contacts */}
          <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#6c757d', lineHeight: '1.7' }}>
            Need help?{' '}
            <a href="mailto:support@donationreceipt.in" style={{ color: '#00a651', fontWeight: '600' }}>
              support@donationreceipt.in
            </a>
            <br />
            Call us:{' '}
            <a href="tel:+919082151500" style={{ color: '#00a651', fontWeight: '600' }}>
              +91 90821 51500
            </a>
          </div>
        </div>
      </div>

      {/* Website Footer Area */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #eef2f5', padding: '20px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '13px', color: '#6c757d' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/trust/terms-and-conditions" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/trust/cancellation-refund-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/trust/privacy-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in. All Rights Reserved.
          </div>
        </div>
      </footer>

      <SimplePopup
        isOpen={forgotPopup}
        type="success"
        title="Reset Link Sent"
        message="Password reset link has been sent to your registered email address."
        confirmText="OK"
        onConfirm={() => setForgotPopup(false)}
        onCancel={() => setForgotPopup(false)}
      />
    </div>
  );
}
