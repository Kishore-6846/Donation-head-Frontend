import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import SimplePopup from '../components/SimplePopup';
import { Eye, EyeOff, Lock, AlertCircle, Shield, ArrowRight, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { setSuperAdminSession } from '../utils/authStorage';

export default function SuperAdminLoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [showForgotConfirmPwd, setShowForgotConfirmPwd] = useState(false);
  const [forgotFieldErrors, setForgotFieldErrors] = useState({});
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotGlobalError, setForgotGlobalError] = useState('');

  const clearForgotFieldError = (fieldName) => {
    if (forgotFieldErrors[fieldName]) {
      setForgotFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const getForgotFieldStyle = (fieldName, extraStyle = {}) => {
    const hasErr = Boolean(forgotFieldErrors[fieldName]);
    return {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      border: hasErr ? '1.5px solid #ef4444' : '1px solid #ced4da',
      borderRadius: '4px',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: hasErr ? '#fef2f2' : '#ffffff',
      boxShadow: hasErr ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
      transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      ...extraStyle
    };
  };

  const renderForgotFieldError = (fieldName) => {
    if (!forgotFieldErrors[fieldName]) return null;
    return (
      <div
        style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '500',
          textAlign: 'left'
        }}
      >
        <AlertCircle size={13} style={{ flexShrink: 0 }} />
        <span>{forgotFieldErrors[fieldName]}</span>
      </div>
    );
  };

  const handleOpenForgotModal = (e) => {
    e.preventDefault();
    setForgotEmail(username || 'admin@donationreceipt.in');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotFieldErrors({});
    setForgotGlobalError('');
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotGlobalError('');
    const errors = {};

    if (!forgotEmail.trim()) {
      errors.email = 'Super Admin email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    const pwd = forgotNewPassword || '';
    if (!pwd.trim()) {
      errors.password = 'New password is required.';
    } else if (pwd.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(pwd)) {
      errors.password = 'Password must include at least one uppercase letter (A-Z).';
    } else if (!/[a-z]/.test(pwd)) {
      errors.password = 'Password must include at least one lowercase letter (a-z).';
    } else if (!/[0-9]/.test(pwd)) {
      errors.password = 'Password must include at least one number (0-9).';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) {
      errors.password = 'Password must include at least one special character (!@#$%...).';
    }

    if (!forgotConfirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (forgotConfirmPassword !== pwd) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setForgotFieldErrors(errors);
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          newPassword: forgotNewPassword.trim(),
          isSuperAdmin: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowForgotModal(false);
        setUsername(forgotEmail.trim().toLowerCase());
        setPassword('');
        setError('');
        setSuccessBanner('Super Admin password reset successfully! You can now log in.');
      } else {
        setForgotGlobalError(data.message || 'Failed to update password. Please check credentials.');
      }
    } catch (err) {
      setForgotGlobalError('Unable to connect to server. Please try again later.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessBanner('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          isSuperAdmin: true,
          role: 'Super Admin'
        })
      });
      const data = await res.json();

      if (data.success) {
        const superAdminUser = {
          ...data.user,
          role: 'Super Admin',
          trustName: data.user?.trustName || 'DONATION RECEIPT SUPER ADMIN',
          name: data.user?.name || 'Super Administrator'
        };
        setSuperAdminSession(superAdminUser, data.token);
        if (onLoginSuccess) onLoginSuccess(superAdminUser);
        navigate('/superadmin');
      } else {
        setError(data.message || 'Super Admin login failed. Please verify credentials.');
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
      <div style={{ height: '4px', backgroundColor: '#00a651', width: '100%' }} />

      {/* Main Header */}
      <header style={{ borderBottom: '1px solid #eef2f5', padding: '10px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/superadmin/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={navLogo} alt="Super Admin Console" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
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
              SUPER ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/trust/login"
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
              Admin Portal
            </Link>
            <Link
              to="/superadmin/login"
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
      <div style={{ backgroundColor: '#00a651', height: '5px', width: '100%' }} />

      {/* Login Card Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 15px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {/* Green Header */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', textAlign: 'center', padding: '26px 20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }}>
                <Shield size={22} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '23px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Super Admin Console
              </h2>
              <p style={{ fontSize: '13.5px', margin: 0, opacity: 0.95 }}>
                Sign in to manage global platform, trusts, plans &amp; reports
              </p>
            </div>

            {/* Card Content Form */}
            <div style={{ padding: '30px 28px' }}>
              {/* Success Notification Banner */}
              {successBanner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{successBanner}</span>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Email Address */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#333333', marginBottom: '6px' }}>
                    Super Admin Email Address
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
                    placeholder="admin@donationreceipt.in"
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
                      placeholder="Enter super admin password"
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

                {/* Forgot password button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '22px' }}>
                  <a
                    href="#forgot"
                    onClick={handleOpenForgotModal}
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
                  {loading ? 'Authenticating Super Admin...' : 'Super Admin Login'}
                </button>
              </form>
            </div>

            {/* Footer inside card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', borderTop: '1px solid #eef2f6', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Lock size={14} color="#00a651" />
              <Link
                to="/trust/login"
                style={{
                  color: '#00a651',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Admin Login</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Support Contacts */}
          <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#6c757d', lineHeight: '1.7' }}>
            Super Admin Help Desk:{' '}
            <a href="mailto:admin@donationreceipt.in" style={{ color: '#00a651', fontWeight: '600' }}>
              admin@donationreceipt.in
            </a>
          </div>
        </div>
      </div>

      {/* Website Footer Area */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #eef2f5', padding: '20px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '13px', color: '#6c757d' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/cancellation-refund-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in Super Admin Console.
          </div>
        </div>
      </footer>

      {/* ================= SUPER ADMIN FORGOT / RESET PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{ backgroundColor: '#00a651', color: '#ffffff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={20} />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
                  Reset Super Admin Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 22px' }}>
              {forgotGlobalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{forgotGlobalError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} noValidate>
                {/* Super Admin Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Super Admin Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@donationreceipt.in"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      clearForgotFieldError('email');
                    }}
                    style={getForgotFieldStyle('email')}
                  />
                  {renderForgotFieldError('email')}
                </div>

                {/* New Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    New Password <span style={{ color: '#ef4444' }}>*</span>{' '}
                    <span style={{ fontSize: '11.5px', fontWeight: '400', color: '#64748b' }}>(Min. 8 characters)</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showForgotPwd ? 'text' : 'password'}
                      placeholder="e.g. Pass@123 (Upper, Lower, Number, Special)"
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        clearForgotFieldError('password');
                      }}
                      style={getForgotFieldStyle('password', { paddingRight: '40px' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPwd(!showForgotPwd)}
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
                      {showForgotPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {renderForgotFieldError('password')}

                  {/* Password Strength Checklist */}
                  {forgotNewPassword.length > 0 && (() => {
                    const p = forgotNewPassword;
                    const hasLen = p.length >= 8;
                    const hasUp = /[A-Z]/.test(p);
                    const hasLo = /[a-z]/.test(p);
                    const hasNu = /[0-9]/.test(p);
                    const hasSp = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p);
                    const isStrong = hasLen && hasUp && hasLo && hasNu && hasSp;

                    return (
                      <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: isStrong ? '#f0fdf4' : '#f8fafc', borderRadius: '6px', border: `1px solid ${isStrong ? '#bbf7d0' : '#e2e8f0'}`, fontSize: '11.5px' }}>
                        <div style={{ fontWeight: '600', color: isStrong ? '#16a34a' : '#475569', marginBottom: '4px' }}>
                          {isStrong ? '✓ Strong Password Ready' : 'Password Checklist:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
                          <span style={{ color: hasLen ? '#16a34a' : '#94a3b8' }}>{hasLen ? '✓' : '○'} Min. 8 characters</span>
                          <span style={{ color: hasUp ? '#16a34a' : '#94a3b8' }}>{hasUp ? '✓' : '○'} 1 Uppercase (A-Z)</span>
                          <span style={{ color: hasLo ? '#16a34a' : '#94a3b8' }}>{hasLo ? '✓' : '○'} 1 Lowercase (a-z)</span>
                          <span style={{ color: hasNu ? '#16a34a' : '#94a3b8' }}>{hasNu ? '✓' : '○'} 1 Number (0-9)</span>
                          <span style={{ color: hasSp ? '#16a34a' : '#94a3b8', gridColumn: '1 / -1' }}>{hasSp ? '✓' : '○'} 1 Special character (!@#$%...)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showForgotConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        clearForgotFieldError('confirmPassword');
                      }}
                      style={getForgotFieldStyle('confirmPassword', { paddingRight: '40px' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPwd(!showForgotConfirmPwd)}
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
                      {showForgotConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {renderForgotFieldError('confirmPassword')}
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#00a651',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: forgotSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 166, 81, 0.3)'
                    }}
                  >
                    {forgotSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
