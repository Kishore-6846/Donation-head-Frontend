import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SimplePopup from '../components/SimplePopup';
import { Eye, EyeOff, Sparkles, KeyRound, User } from 'lucide-react';

export default function NewPasswordPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Input Required',
        message: 'Please enter your new password.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
      return;
    }

    if (newPassword.trim().length < 6) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
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
        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Password Updated!',
          message: data.message || 'Your password has been changed successfully and updated in your account.',
          onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
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
            Keep your administrative account secure by configuring a strong, modern password.
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
            maxWidth: '520px',
            margin: '20px auto',
            textAlign: 'center'
          }}
        >

          <form onSubmit={handleSubmit}>
            {/* Input with eye toggle matching Screenshot 1 */}
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '340px',
                maxWidth: '100%'
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                required
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 36px 6px 12px',
                  fontSize: '13.5px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#495057',
                  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#80bdff';
                  e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#ced4da';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#495057',
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

            {/* Centered Submit Button matching Screenshot 1 */}
            <div style={{ marginTop: '22px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 42px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.38)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
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
