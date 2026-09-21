import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import VerificationDemoModal from '../components/VerificationDemoModal';
import { ChevronUp, AlertTriangle, AlertCircle, CheckCircle2, Sparkles, User, Trash2 } from 'lucide-react';
import { getCurrentUser, isSuperUser, getSuperAdminSession, getTrustSession, setSuperAdminSession, setTrustSession } from '../utils/authStorage';

export default function EditProfilePage({ user, onUpdateUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.toLowerCase().startsWith('/superadmin');

  const [showVerificationDemo, setShowVerificationDemo] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null });

  const triggerDelete = (target) => {
    setDeleteConfirm({ isOpen: true, target });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, target: null });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.target === 'logo') {
      setFormData(prev => ({ ...prev, logo: '' }));
      setHasLogo(false);
      setLogoError('');
      if (logoInputRef.current) logoInputRef.current.value = '';
      setToastMessage('Trust logo removed successfully!');
    } else if (deleteConfirm.target === 'signature') {
      setFormData(prev => ({ ...prev, signature: '' }));
      setHasSignature(false);
      setSignatureError('');
      if (signatureInputRef.current) signatureInputRef.current.value = '';
      setToastMessage('Signature photo removed successfully!');
    }
    setDeleteConfirm({ isOpen: false, target: null });
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getInitialFormData = () => {
    let savedUser = null;
    if (isSuperAdmin) {
      const superSess = getSuperAdminSession()?.user;
      savedUser = (superSess && isSuperUser(superSess)) ? superSess : ((user && isSuperUser(user)) ? user : {
        _id: 'usr_superadmin',
        name: 'DONATION RECEIPT SUPER ADMIN',
        trustName: 'DONATION RECEIPT SUPER ADMIN',
        contactPerson: 'Super Administrator',
        email: 'admin@donationreceipt.in',
        role: 'SuperAdmin',
        isSuperAdmin: true,
        status: 'Active'
      });
    } else {
      const trustSess = getTrustSession()?.user;
      savedUser = (trustSess && !isSuperUser(trustSess)) ? trustSess : ((user && !isSuperUser(user)) ? user : {});
    }

    const tName = isSuperAdmin
      ? (savedUser?.trustName || savedUser?.name || 'DONATION RECEIPT SUPER ADMIN')
      : ((savedUser?.trustName && savedUser?.trustName !== 'DONATION RECEIPT SUPER ADMIN' ? savedUser.trustName : '') || (savedUser?.name && !isSuperUser(savedUser) ? savedUser.name : '') || '');
    const rawPrefix = tName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'REC';
    const cPerson = isSuperAdmin
      ? (savedUser?.contactPerson || savedUser?.name || 'Super Administrator')
      : (savedUser?.contactPerson || (savedUser?.name && !isSuperUser(savedUser) ? savedUser.name : '') || '');
    const parts = cPerson ? cPerson.split(' ') : [];

    const baseData = {
      name: tName,
      email: savedUser?.email || (isSuperAdmin ? 'admin@donationreceipt.in' : ''),
      phone: savedUser?.mobile || savedUser?.phone || '',
      address: savedUser?.address || '',
      state: savedUser?.state || '',
      registrationNo: savedUser?.registrationNo || '',
      panNo: savedUser?.panNo || '',
      fcraNo: savedUser?.fcraNo || '',
      website: savedUser?.website || '',
      contactPerson: cPerson,
      contactPersonEmail: savedUser?.contactPersonEmail || savedUser?.email || '',
      contactPersonMobile: savedUser?.contactPersonMobile || savedUser?.mobile || savedUser?.phone || '',

      registrationType: savedUser?.registrationType || '12A',
      reg12ANo: savedUser?.reg12ANo || savedUser?.section80GRegNo || savedUser?.registrationNo || '',
      reg12ADate: savedUser?.reg12ADate || new Date().toISOString().split('T')[0],

      firstName: parts[0] || '',
      middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
      surname: parts.length > 1 ? parts[parts.length - 1] : '',
      signatoryPan: savedUser?.signatoryPan || savedUser?.panNo || '',
      designation: savedUser?.designation || 'Authorized Signatory',

      emailSubject: savedUser?.emailSubject || `Thank You & Stay Connected! - ${tName || 'Our Organization'}`,
      emailBody: savedUser?.emailBody || `Thank you for your generous support! Your kindness fuels our mission. Grateful for you!\n${savedUser?.website || ''} | ${savedUser?.mobile || savedUser?.phone || ''} | ${savedUser?.email || ''}`,

      receiptPrefix: savedUser?.receiptPrefix || `${rawPrefix}/2026-27/`,
      receiptStartNumber: savedUser?.receiptStartNumber || '1',
      receiptWatermarkText: savedUser?.receiptWatermarkText || rawPrefix,
      logo: savedUser?.logo || '',
      signature: savedUser?.signature || ''
    };

    const userEmail = (savedUser?.email || '').toLowerCase().trim();
    if (userEmail) {
      try {
        const userCache = JSON.parse(localStorage.getItem(`profile_data_${userEmail}`) || '{}');
        if (userCache && (userCache.email?.toLowerCase() === userEmail || userCache.name)) {
          if (isSuperAdmin && !isSuperUser(userCache)) {
            // Do not use non-super cache for SuperAdmin
          } else if (!isSuperAdmin && isSuperUser(userCache)) {
            // Do not use super cache for Trust
          } else {
            return { ...baseData, ...userCache };
          }
        }
      } catch (e) {}
    }

    return baseData;
  };

  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    const initial = getInitialFormData();
    setFormData(initial);
    setHasLogo(Boolean(initial.logo));
    setHasSignature(Boolean(initial.signature));

    // Fetch live backend user details to ensure complete and authentic profile fields only for Trust Admin
    if (!isSuperAdmin) {
      const trustSess = getTrustSession()?.user;
      const activeUser = (trustSess && !isSuperUser(trustSess)) ? trustSess : ((user && !isSuperUser(user)) ? user : {});
      const targetId = activeUser._id || activeUser.id || activeUser.email || initial.email;
      if (targetId) {
        fetch(`/api/users/${encodeURIComponent(targetId)}`)
          .then(r => r.json())
          .then(data => {
            const u = data?.data || data?.user || (data?.email ? data : null);
            if (u && (u.email || u.name || u.trustName)) {
              if (isSuperUser(u)) return; // Strictly ignore superadmin data for Trust

              const tName = u.trustName || (u.name && !u.name.toLowerCase().includes('super') ? u.name : '') || '';
              const rawPrefix = tName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'REC';
              const cPerson = u.contactPerson || (u.name && !u.name.toLowerCase().includes('super') ? u.name : '') || '';
              const parts = cPerson ? cPerson.split(' ') : [];

              setFormData(prev => ({
                ...prev,
                name: tName || prev.name,
                email: u.email || prev.email,
                phone: u.mobile || u.phone || prev.phone,
                address: u.address || prev.address,
                state: u.state || prev.state,
                registrationNo: u.registrationNo || prev.registrationNo,
                panNo: u.panNo || prev.panNo,
                fcraNo: u.fcraNo || prev.fcraNo,
                website: u.website || prev.website,
                contactPerson: cPerson || prev.contactPerson,
                contactPersonEmail: u.contactPersonEmail || prev.contactPersonEmail,
                contactPersonMobile: u.contactPersonMobile || prev.contactPersonMobile,
                registrationType: u.registrationType || prev.registrationType || '12A',
                reg12ANo: u.reg12ANo || u.section80GRegNo || prev.reg12ANo || '',
                reg12ADate: u.reg12ADate || prev.reg12ADate,
                firstName: parts[0] || prev.firstName,
                middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : prev.middleName,
                surname: parts.length > 1 ? parts[parts.length - 1] : prev.surname,
                signatoryPan: u.signatoryPan || u.panNo || prev.signatoryPan,
                logo: u.logo || prev.logo || '',
                signature: u.signature || prev.signature || ''
              }));
              if (u.logo) setHasLogo(true);
              if (u.signature) setHasSignature(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [user, location.pathname, isSuperAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'contactPersonMobile') {
      let numericVal = value.replace(/\D/g, '').slice(0, 10);
      if (numericVal.length > 0 && !/^[6-9]/.test(numericVal)) {
        numericVal = numericVal.replace(/^[^6-9]+/, '');
      }
      setFormData(prev => ({ ...prev, [name]: numericVal }));
      return;
    }
    if (name === 'panNo' || name === 'signatoryPan') {
      const cleanPan = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleanPan }));
      return;
    }
    if (name === 'contactPerson' || name === 'firstName' || name === 'surname') {
      const cleanName = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanName }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to compress and resize images on canvas to prevent LocalStorage QuotaExceededError
  const compressImage = (file, maxWidth = 400, maxHeight = 200, quality = 0.9) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          if (h > maxHeight) {
            w = Math.round((width * maxHeight) / h);
            h = maxHeight;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setLogoError('Only image files (.jpg, .jpeg, .png, .webp) are allowed.');
      setToastMessage('Only image files (.jpg, .jpeg, .png, .webp) are allowed.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo file exceeds maximum 5MB size limit.');
      setToastMessage('Logo file exceeds maximum 5MB size limit.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    setLogoError('');
    try {
      const base64 = await compressImage(file, 400, 400, 0.9);
      if (base64) {
        setFormData(prev => ({ ...prev, logo: base64 }));
        setHasLogo(true);
        setToastMessage('Logo selected! Click Submit to apply.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Logo compression error:', err);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setSignatureError('Only image files (.jpg, .jpeg, .png, .webp) are allowed.');
      setToastMessage('Only image files (.jpg, .jpeg, .png, .webp) are allowed.');
      if (signatureInputRef.current) signatureInputRef.current.value = '';
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSignatureError('Signature file exceeds maximum 5MB size limit.');
      setToastMessage('Signature file exceeds maximum 5MB size limit.');
      if (signatureInputRef.current) signatureInputRef.current.value = '';
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    setSignatureError('');
    try {
      const base64 = await compressImage(file, 400, 180, 0.9);
      if (base64) {
        setFormData(prev => ({ ...prev, signature: base64 }));
        setHasSignature(true);
        setToastMessage('Signature selected! Click Submit to apply.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Signature compression error:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      setToastMessage('Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (formData.contactPersonMobile && !/^[6-9]\d{9}$/.test(formData.contactPersonMobile.replace(/\D/g, ''))) {
      setToastMessage('Contact Person Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (formData.contactPerson && !/^[a-zA-Z\s.'-]+$/.test(formData.contactPerson.trim())) {
      setToastMessage('Contact Person name must contain only letters, dots, hyphens, and spaces.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const cleanPan = (formData.panNo || '').trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setToastMessage('Please enter a valid 10-character PAN number without special characters (e.g. ABCDE1234F).');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const cleanSignatoryPan = (formData.signatoryPan || '').trim().toUpperCase();
    if (cleanSignatoryPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanSignatoryPan)) {
      setToastMessage('Signatory PAN must be a valid 10-character PAN number without special characters (e.g. ABCDE1234F).');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (formData.contactPersonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail.trim())) {
      setToastMessage('Please enter a valid Contact Person Email address.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    // Persist changes safely with try-catch to prevent storage quota crash
    try {
      localStorage.removeItem('profile_data');
      if (formData.email) {
        localStorage.setItem(`profile_data_${formData.email.toLowerCase()}`, JSON.stringify(formData));
      }
    } catch (storageErr) {
      console.warn('LocalStorage save warning:', storageErr);
    }

    const existingUser = (isSuperAdmin ? (getSuperAdminSession()?.user || {}) : (getTrustSession()?.user || {})) || {};
    const updatedUser = {
      ...existingUser,
      trustName: formData.name,
      name: formData.contactPerson || formData.name,
      email: formData.email,
      mobile: formData.phone,
      address: formData.address,
      state: formData.state,
      registrationNo: formData.registrationNo,
      panNo: cleanPan || formData.panNo,
      section80GRegNo: formData.reg12ANo || existingUser.section80GRegNo || '',
      reg12ANo: formData.reg12ANo || '',
      reg12ADate: formData.reg12ADate || '',
      website: formData.website,
      contactPerson: formData.contactPerson,
      contactPersonEmail: formData.contactPersonEmail,
      contactPersonMobile: formData.contactPersonMobile,
      logo: formData.logo || '',
      signature: formData.signature || '',
      signatoryName: formData.contactPerson || `${formData.firstName || ''} ${formData.surname || ''}`.trim() || '',
      signatoryPan: cleanSignatoryPan || formData.signatoryPan || formData.panNo || '',
      isSuperAdmin: isSuperAdmin,
      role: isSuperAdmin ? 'SuperAdmin' : (existingUser.role || 'Admin')
    };

    try {
      if (isSuperAdmin) {
        setSuperAdminSession(updatedUser);
      } else {
        setTrustSession(updatedUser);
      }
    } catch (sessionErr) {
      console.warn('Session save warning:', sessionErr);
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    // Sync to backend user profile
    try {
      const targetId = existingUser._id || existingUser.id || existingUser.email || formData.email;
      if (targetId) {
        fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        }).catch((err) => console.warn('Backend profile update failed:', err));
      }
    } catch (e) {}

    setToastMessage('Profile updated successfully!');
    setTimeout(() => {
      setToastMessage('');
      navigate(isSuperAdmin ? '/superadmin/my-profile' : '/trust/my-profile');
    }, 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>PROFILE CONFIGURATION</span>
          </div>
          <h1 className="mint-hero-title">Edit Profile</h1>
          <p className="mint-hero-subtitle">
            Update trust contact details, 12A/80G credentials, authorized signatory, and email templates.
          </p>
        </div>
        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate(isSuperAdmin ? '/superadmin/my-profile' : '/trust/my-profile')}
            title="View Profile"
          >
            <User size={16} />
            <span>View Profile</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container" style={{ paddingBottom: '70px' }}>
        <form onSubmit={handleSubmit}>
          {/* ================= SECTION 1: TWO COLUMNS ================= */}
          <div className="edit-profile-row-2col">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Name:</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly
                  style={{ backgroundColor: '#e9ecef', color: '#495057', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Address:</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>State:</label>
                <select
                  name="state"
                  className="form-control"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Registration No.:</label>
                <input
                  type="text"
                  name="registrationNo"
                  className="form-control"
                  value={formData.registrationNo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>PAN No:</label>
                <input
                  type="text"
                  name="panNo"
                  className="form-control"
                  value={formData.panNo}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>FCRA Registration No.:</label>
                <input
                  type="text"
                  name="fcraNo"
                  className="form-control"
                  placeholder="FCRA Registration Number"
                  value={formData.fcraNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Website:</label>
                <input
                  type="text"
                  name="website"
                  className="form-control"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Contact Person:</label>
                <input
                  type="text"
                  name="contactPerson"
                  className="form-control"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Contact Person Email:</label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  className="form-control"
                  placeholder="e.g. contact@example.com"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Contact Person Mobile No.:</label>
                <input
                  type="tel"
                  name="contactPersonMobile"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="form-control"
                  value={formData.contactPersonMobile}
                  onChange={handleChange}
                />
              </div>

              {/* Upload Logo */}
              <div>
                <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
                  Upload Logo (Image files only: .png, .jpg, .jpeg, .webp, Max 2MB)
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleLogoUpload}
                    style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      border: logoError ? '1.5px solid #ef4444' : '1px solid #ced4da',
                      backgroundColor: logoError ? '#fef2f2' : '#ffffff',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      outline: 'none',
                      boxShadow: logoError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>
                {logoError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{logoError}</span>
                  </div>
                )}

                {Boolean(hasLogo && formData.logo) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#333' }}>Preview:</span>
                    <div
                      style={{
                        minWidth: '110px',
                        maxWidth: '180px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '44px', marginBottom: '4px' }}>
                        <img
                          src={formData.logo}
                          alt="Trust Logo"
                          style={{ maxHeight: '48px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#222', wordBreak: 'break-word' }}>
                        {formData.name || 'Organization'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerDelete('logo')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Remove logo"
                    >
                      <Trash2 size={13} />
                      <span>Remove Logo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: 12A REGISTRATION DETAILS ================= */}
          <div style={{ marginBottom: '26px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', textDecoration: 'underline', color: '#111', marginBottom: '12px' }}>
              12A Registration Details:
            </h3>

            <div className="edit-profile-row-3col">
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  Registration Type {`{12A Or 10(23C)}`}
                </label>
                <select
                  name="registrationType"
                  className="form-control"
                  value={formData.registrationType}
                  onChange={handleChange}
                >
                  <option value="12A">12A</option>
                  <option value="10(23C)">10(23C)</option>
                  <option value="80G">80G</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  12A Or 10(23C) Registration No.:
                </label>
                <input
                  type="text"
                  name="reg12ANo"
                  className="form-control"
                  value={formData.reg12ANo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  12A Or 10(23C) Registration Date:
                </label>
                <input
                  type="text"
                  name="reg12ADate"
                  className="form-control"
                  value={formData.reg12ADate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ================= SECTION 3: AUTHORIZED PERSON DETAILS ================= */}
          <div style={{ marginBottom: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', textDecoration: 'underline', color: '#111', margin: 0 }}>
                Authorized Person Details: (This will be shown in Verification part of receipt)
              </h3>
              <button
                type="button"
                onClick={() => setShowVerificationDemo(true)}
                style={{
                  backgroundColor: '#0d6efd',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Click to view Verification Demo Preview"
              >
                Demo
              </button>
            </div>

            {/* Row 1: 4 columns */}
            <div className="edit-profile-row-4col">
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Middle Name:</label>
                <input
                  type="text"
                  name="middleName"
                  className="form-control"
                  placeholder="Middle Name"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Surname:</label>
                <input
                  type="text"
                  name="surname"
                  className="form-control"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>PAN Number:</label>
                <input
                  type="text"
                  name="signatoryPan"
                  className="form-control"
                  value={formData.signatoryPan}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            {/* Row 2: Designation and Signature upload */}
            <div className="edit-profile-row-sig">
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Designation</label>
                <select
                  name="designation"
                  className="form-control"
                  value={formData.designation}
                  onChange={handleChange}
                >
                  <option value="Authorized Signatory">Authorized Signatory</option>
                  <option value="Managing Trustee">Managing Trustee</option>
                  <option value="President">President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  Upload Signature photo: Size: 192X86px (.jpg, .jpeg, .png, .webp, Max 2MB)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={signatureInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleSignatureUpload}
                    style={{
                      fontSize: '12px',
                      border: signatureError ? '1.5px solid #ef4444' : '1px solid #ced4da',
                      backgroundColor: signatureError ? '#fef2f2' : '#ffffff',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      outline: 'none',
                      boxShadow: signatureError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />

                  {Boolean(hasSignature && formData.signature) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#333' }}>Preview:</span>
                      <div style={{ border: '1px solid #ccc', background: '#fafafa', padding: '4px 12px', borderRadius: '4px', minHeight: '34px', display: 'flex', alignItems: 'center' }}>
                        <img
                          src={formData.signature}
                          alt="Signature"
                          style={{ maxHeight: '38px', maxWidth: '160px', objectFit: 'contain' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerDelete('signature')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          padding: '5px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        title="Remove signature"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
                {signatureError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{signatureError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= SECTION 4: EMAIL FORMAT ================= */}
          <div style={{ marginBottom: '26px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', textDecoration: 'underline', color: '#111', marginBottom: '12px' }}>
              Email Format:
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12.5px' }}>Email Subject:</label>
              <input
                type="text"
                name="emailSubject"
                className="form-control"
                value={formData.emailSubject}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12.5px' }}>Email Body: (Max. 450 Characters)</label>
              <textarea
                name="emailBody"
                className="form-control"
                rows="4"
                maxLength={450}
                value={formData.emailBody}
                onChange={handleChange}
                style={{ fontSize: '13px', lineHeight: '1.5' }}
              />
            </div>
          </div>

          {/* ================= SECTION 5: RECEIPT SETTINGS ================= */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', textDecoration: 'underline', color: '#111', marginBottom: '12px' }}>
              Receipt Settings:
            </h3>

            <div className="edit-profile-row-3col">
              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Receipt Number Prefix:</label>
                <input
                  type="text"
                  name="receiptPrefix"
                  className="form-control"
                  value={formData.receiptPrefix}
                  onChange={handleChange}
                />
                <span style={{ fontSize: '11px', color: '#666', marginTop: '3px', display: 'block' }}>
                  (for eg: 2026-2027/)
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Receipt Start Number:</label>
                <input
                  type="number"
                  name="receiptStartNumber"
                  className="form-control"
                  value={formData.receiptStartNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px' }}>Receipt Watermark Text:</label>
                <input
                  type="text"
                  name="receiptWatermarkText"
                  className="form-control"
                  value={formData.receiptWatermarkText}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ================= SUBMIT BUTTON ================= */}
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <button
              type="submit"
              className="edit-profile-submit-btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 48px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      {/* Themed Confirmation Modal */}
      <SimplePopup
        isOpen={deleteConfirm.isOpen}
        type="confirm"
        title="Remove Photo?"
        message={`Are you sure you want to remove your ${deleteConfirm.target === 'logo' ? 'trust logo' : 'signature photo'}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Verification Demo Modal */}
      <VerificationDemoModal
        isOpen={showVerificationDemo}
        onClose={() => setShowVerificationDemo(false)}
      />

      {/* Top-Right Success Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: '600'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
