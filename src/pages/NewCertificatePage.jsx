import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SimplePopup from '../components/SimplePopup';
import { Sparkles, List, AlertCircle, Trash2 } from 'lucide-react';

export default function NewCertificatePage({ user }) {
  const navigate = useNavigate();

  const isDemoAdmin = !user?.email || user?.email === 'admin@donationreceipt.in';
  const storageKey = isDemoAdmin ? 'certificates_data' : `certificates_data_${user?.email}`;

  const [formData, setFormData] = useState({
    regNo: '',
    validFrom: '',
    validUpto: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [page1File, setPage1File] = useState(null);
  const [page1Preview, setPage1Preview] = useState('');
  const [page1FileName, setPage1FileName] = useState('');

  const [page2File, setPage2File] = useState(null);
  const [page2Preview, setPage2Preview] = useState('');
  const [page2FileName, setPage2FileName] = useState('');

  const page1InputRef = useRef(null);
  const page2InputRef = useRef(null);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });

  const validateField = (name, value) => {
    let err = '';
    if (name === 'regNo') {
      if (!value || !value.trim()) {
        err = '80G Registration Number is mandatory';
      }
    }
    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleFileChange = (e, pageIndex) => {
    const file = e.target.files[0];
    const fieldKey = pageIndex === 1 ? 'page1' : 'page2';

    if (!file) return;

    // Validate that it's strictly an image format
    const isImage = file.type ? file.type.startsWith('image/') : /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
    if (!isImage) {
      setErrors(prev => ({ ...prev, [fieldKey]: 'Only image files (.jpg, .jpeg, .png, .webp) are allowed' }));
      e.target.value = '';
      if (pageIndex === 1) {
        setPage1File(null);
        setPage1Preview('');
        setPage1FileName('');
      } else {
        setPage2File(null);
        setPage2Preview('');
        setPage2FileName('');
      }
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [fieldKey]: 'File size must be less than 2MB' }));
      e.target.value = '';
      return;
    }

    setErrors(prev => ({ ...prev, [fieldKey]: '' }));

    const reader = new FileReader();
    reader.onload = () => {
      if (pageIndex === 1) {
        setPage1File(file);
        setPage1Preview(reader.result);
        setPage1FileName(file.name);
      } else {
        setPage2File(file);
        setPage2Preview(reader.result);
        setPage2FileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (pageIndex) => {
    const fieldKey = pageIndex === 1 ? 'page1' : 'page2';
    setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    if (pageIndex === 1) {
      setPage1File(null);
      setPage1Preview('');
      setPage1FileName('');
      if (page1InputRef.current) page1InputRef.current.value = '';
    } else {
      setPage2File(null);
      setPage2Preview('');
      setPage2FileName('');
      if (page2InputRef.current) page2InputRef.current.value = '';
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;

    const regErr = validateField('regNo', formData.regNo);
    if (regErr) {
      setTouched(prev => ({ ...prev, regNo: true }));
      setErrors(prev => ({ ...prev, regNo: regErr }));
      return;
    }

    setSubmitting(true);
    try {
      const page1Base64 = page1File ? (page1Preview || await readFileAsDataURL(page1File)) : '';
      const page2Base64 = page2File ? (page2Preview || await readFileAsDataURL(page2File)) : '';

      const newCert = {
        id: Date.now(),
        regNo: formData.regNo.trim(),
        validFrom: formData.validFrom || '',
        validUpto: formData.validUpto || '',
        page1: page1Base64,
        page2: page2Base64,
        trustEmail: user?.email || '',
        trustName: user?.trustName || user?.name || '',
        createdBy: user?.email || 'admin'
      };

      try {
        const response = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCert)
        });
        const resData = await response.json();
        if (resData && resData.data && resData.data._id) {
          newCert._id = resData.data._id;
        }
      } catch (err) {
        console.warn('API save certificate error:', err);
      }

      // Safe localStorage save with quota protection
      try {
        const saved = localStorage.getItem(storageKey);
        let list = [];
        if (saved) {
          try { list = JSON.parse(saved); } catch (err) { }
        }
        list.unshift(newCert);
        try {
          localStorage.setItem(storageKey, JSON.stringify(list));
        } catch (quotaErr) {
          // If storage quota exceeded, store without heavy base64 strings in localStorage
          const lightweightList = list.map(c => ({
            ...c,
            page1: c.page1 ? 'uploaded_page1' : '',
            page2: c.page2 ? 'uploaded_page2' : ''
          }));
          localStorage.setItem(storageKey, JSON.stringify(lightweightList));
        }
      } catch (lsErr) {
        console.warn('LocalStorage error:', lsErr);
      }

      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Certificate Added!',
        message: '80G Certificate successfully added to your vault.',
        confirmText: 'OK',
        onConfirm: () => {
          setPopup(p => ({ ...p, isOpen: false }));
          navigate('/trust/all-certificate');
        }
      });
    } catch (submitErr) {
      console.error('Error submitting certificate:', submitErr);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Submission Error',
        message: submitErr.message || 'An error occurred while adding the certificate.',
        confirmText: 'OK',
        onConfirm: () => setPopup(p => ({ ...p, isOpen: false }))
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldStyle = (fieldName, extraStyle = {}) => {
    const isError = Boolean(errors[fieldName]);
    return {
      width: '100%',
      height: '38px',
      padding: '6px 12px',
      fontSize: '13.5px',
      border: isError ? '1.5px solid #dc3545' : '1px solid #ced4da',
      borderRadius: '6px',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#495057',
      backgroundColor: isError ? '#fff8f8' : '#ffffff',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      ...extraStyle
    };
  };

  return (
    <>
      {/* Mint Hero Banner */}
      <div className="mint-hero-banner">
        <div className="mint-hero-left">
          <div className="mint-hero-badge">
            <Sparkles size={12} />
            <span>TAX EXEMPTION VAULT</span>
          </div>
          <h1 className="mint-hero-title">Add 80G Certificate</h1>
          <p className="mint-hero-subtitle">
            Register and upload official 80G tax exemption certificates to attach to donation receipts.
          </p>
        </div>

        <div className="mint-hero-right">
          <button
            type="button"
            className="mint-btn-add mint-btn-primary"
            onClick={() => navigate('/trust/all-certificate')}
            title="View All Certificates"
          >
            <List size={16} />
            <span>All Certificates</span>
          </button>
        </div>
      </div>

      <div className="mint-table-card-container">
        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: 3 Columns matching Screenshot 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '22px'
            }}
          >
            {/* 80G Registration No. (Mandatory) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration No.: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="regNo"
                placeholder="80G Registration No."
                value={formData.regNo}
                onChange={handleChange}
                onBlur={handleBlur}
                style={getFieldStyle('regNo')}
              />
              {errors.regNo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                  <AlertCircle size={13} />
                  <span>{errors.regNo}</span>
                </div>
              )}
            </div>

            {/* 80G Registration Valid From (Date picker) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration Valid From:
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={getFieldStyle('validFrom', { cursor: 'pointer' })}
              />
            </div>

            {/* 80G Registration Valid Upto (Date picker) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                80G Registration Valid Upto:
              </label>
              <input
                type="date"
                name="validUpto"
                value={formData.validUpto}
                onChange={handleChange}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={getFieldStyle('validUpto', { cursor: 'pointer' })}
              />
            </div>
          </div>

          {/* Row 2: 3 Columns (Upload Page 1, Upload Page 2, Empty 3rd Column) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '36px'
            }}
          >
            {/* Upload Page 1 */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                Upload 80G Certificate photo Page-1 <span style={{ fontSize: '11.5px', fontWeight: '400', color: '#64748b' }}>(.jpg, .png, Max 2MB)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    border: errors.page1 ? '1.5px solid #dc3545' : '1px solid #ced4da',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    backgroundColor: errors.page1 ? '#fff8f8' : '#ffffff'
                  }}
                >
                  <input
                    type="file"
                    ref={page1InputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => handleFileChange(e, 1)}
                    style={{
                      width: '100%',
                      fontSize: '13px',
                      color: '#495057',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                {page1Preview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={page1Preview} alt="Page 1 preview" style={{ height: '28px', width: '28px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={page1FileName}>
                        {page1FileName || 'Page-1 Selected'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(1)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Remove Page 1"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
                {errors.page1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc3545', fontSize: '11.5px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.page1}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Page 2 */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#212529',
                  marginBottom: '8px'
                }}
              >
                Upload 80G Certificate photo Page-2 <span style={{ fontSize: '11.5px', fontWeight: '400', color: '#64748b' }}>(.jpg, .png, Max 2MB)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    border: errors.page2 ? '1.5px solid #dc3545' : '1px solid #ced4da',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    backgroundColor: errors.page2 ? '#fff8f8' : '#ffffff'
                  }}
                >
                  <input
                    type="file"
                    ref={page2InputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => handleFileChange(e, 2)}
                    style={{
                      width: '100%',
                      fontSize: '13px',
                      color: '#495057',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                {page2Preview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <img src={page2Preview} alt="Page 2 preview" style={{ height: '28px', width: '28px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={page2FileName}>
                        {page2FileName || 'Page-2 Selected'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(2)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Remove Page 2"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
                {errors.page2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc3545', fontSize: '11.5px' }}>
                    <AlertCircle size={12} />
                    <span>{errors.page2}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty 3rd column for alignment */}
            <div></div>
          </div>

          {/* Centered Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '11px 48px',
                fontSize: '14.5px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.42)';
                }
              }}
              onMouseOut={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.35)';
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Themed Popup instead of native browser alert */}
      <SimplePopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText || 'OK'}
        onConfirm={popup.onConfirm}
        onCancel={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
