import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import navLogo from '../assets/Receipt-Nav-Logo.png';
import SimplePopup from '../components/SimplePopup';
import { Eye, EyeOff, Lock, AlertCircle, Shield, ArrowRight } from 'lucide-react';

export default function SuperAdminLoginPage({ onLoginSuccess }) {
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
        body: JSON.stringify({
          username,
          password,
          isSuperAdmin: true,
          role: 'Super Admin'
        })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.removeItem('profile_data');
        const superAdminUser = {
          ...data.user,
          role: 'Super Admin',
          trustName: data.user?.trustName || 'DONATION RECEIPT SUPER ADMIN',
          name: data.user?.name || 'Super Administrator'
        };
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(superAdminUser));
        if (superAdminUser.email) {
          localStorage.setItem(`profile_data_${superAdminUser.email.toLowerCase()}`, JSON.stringify(superAdminUser));
        }
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
              to="/superadmin/register"
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
                  {loading ? 'Authenticating Super Admin...' : 'Super Admin Login'}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              {/* Create Account Section */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#495057', marginBottom: '10px' }}>
                  Need a Super Admin Account?
                </p>
                <Link
                  to="/superadmin/register"
                  style={{
                    display: 'inline-block',
                    background: 'transparent',
                    border: '1.5px solid #00a651',
                    color: '#00a651',
                    padding: '8px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Super Admin SignUp
                </Link>
              </div>
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
            <Link to="/terms-and-conditions" style={{ color: '#475569', textDecoration: 'none' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/cancellation-refund-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Cancellation &amp; Refunds Policy
            </Link>
            <span>|</span>
            <Link to="/privacy-policy" style={{ color: '#475569', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
          <div>
            &copy; 2026 DonationReceipt.in Super Admin Console.
          </div>
        </div>
      </footer>

      <SimplePopup
        isOpen={forgotPopup}
        type="success"
        title="Reset Link Sent"
        message="Super Admin password recovery link has been dispatched to your email."
        confirmText="OK"
        onConfirm={() => setForgotPopup(false)}
        onCancel={() => setForgotPopup(false)}
      />
    </div>
  );
}
