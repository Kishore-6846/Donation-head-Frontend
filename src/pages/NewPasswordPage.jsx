import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Eye, EyeOff, Sparkles, KeyRound, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewPasswordPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user_info') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const activeUser = user || localUser;
  const targetEmail = (activeUser?.email || (isSuperAdmin ? 'admin@donationreceipt.in' : '')).trim();

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const getFieldStyle = (fieldName, extraStyle = {}) => {
    const hasErr = Boolean(fieldErrors[fieldName]);
    return {
      width: '100%',
      height: '38px',
      padding: '6px 38px 6px 12px',
      fontSize: '13.5px',
      border: hasErr ? '1.5px solid #ef4444' : '1px solid #ced4da',
      borderRadius: '4px',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#495057',
      backgroundColor: hasErr ? '#fef2f2' : '#ffffff',
      boxShadow: hasErr ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
      transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      ...extraStyle
    };
  };

  const renderFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
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
        <span>{fieldErrors[fieldName]}</span>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const pwd = newPassword || '';
    if (!pwd.trim()) {
      errors.password = 'Password is required.';
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

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (confirmPassword !== pwd) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: targetEmail,
          newPassword: newPassword.trim(),
          isSuperAdmin: isSuperAdmin
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewPassword('');
        setConfirmPassword('');
        setFieldErrors({});
        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Password Updated!',
          message: data.message || 'Your password has been changed successfully.',
          onConfirm: () => {
            setPopup(p => ({ ...p, isOpen: false }));
            navigate(isSuperAdmin ? '/superadmin/my-profile' : '/trust/my-profile');
          }
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Could not update password. Please try again.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
        });
      }
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'An unexpected error occurred.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>CREDENTIAL SECURITY</span>
          </div>
          <h1 className="mint-hero-title">Reset Password</h1>
          <p className="mint-hero-subtitle">
            Keep your administrative account secure by configuring a strong, modern password (min. 8 characters).
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate(isSuperAdmin ? '/superadmin/my-profile' : '/trust/my-profile')}
            title="My Profile"
          >
            <User size={16} />
            <span>My Profile</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        <div
          style={{
            maxWidth: '460px',
            margin: '30px auto',
            backgroundColor: '#ffffff',
            padding: '28px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '10px', borderBottom: '2px solid #eafaf1' }}>
            <KeyRound size={20} color="#00a651" />
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Change Account Password
            </h3>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* New Password Input */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                New Password <span style={{ color: '#ef4444' }}>*</span>{' '}
                <span style={{ fontSize: '11.5px', fontWeight: '400', color: '#64748b' }}>(Min. 8 characters)</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. Pass@123 (Upper, Lower, Number, Special)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  autoFocus
                  style={getFieldStyle('password')}
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
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {renderFieldError('password')}

              {/* Password Strength Checklist */}
              {newPassword.length > 0 && (() => {
                const p = newPassword;
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

            {/* Confirm Password Input */}
            <div style={{ marginBottom: '22px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  style={getFieldStyle('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {renderFieldError('confirmPassword')}
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: '#00a651',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 24px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 166, 81, 0.28)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Themed Simple Popup */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText="OK"
        onConfirm={popup.onConfirm}
      />
    </>
  );
}
