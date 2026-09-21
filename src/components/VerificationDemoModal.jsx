import React from 'react';
import { X, Eye } from 'lucide-react';

export default function VerificationDemoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (White Background) */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px 20px',
            color: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="#15803d" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Verification Demo Preview (PDF Format)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Close"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - PDF Verification Sheet Simulation */}
        <div style={{ padding: '24px', background: '#f8fafc', maxHeight: '82vh', overflowY: 'auto' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              color: '#000000',
              fontFamily: 'Helvetica, Arial, sans-serif'
            }}
          >
            {/* Box 1: Verification Box */}
            <div
              style={{
                border: '1.2px solid #000000',
                padding: '18px 20px',
                marginBottom: '16px',
                background: '#ffffff'
              }}
            >
              {/* Title */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'underline',
                  marginBottom: '14px',
                  color: '#000000',
                  letterSpacing: '0.5px'
                }}
              >
                VERIFICATION
              </div>

              {/* Paragraph Text */}
              <p
                style={{
                  fontSize: '11.5px',
                  lineHeight: '1.7',
                  textAlign: 'justify',
                  margin: '0 0 28px 0',
                  color: '#000000'
                }}
              >
                I, <strong style={{ color: '#0f172a', fontWeight: '700' }}>[Authorized Signatory Name]</strong> son/daughter/wife of{' '}
                <strong style={{ color: '#0f172a', fontWeight: '700' }}>[Father&apos;s Name]</strong>, solemnly declare that to the best of my knowledge and
                belief, the information given in the certificate is correct and complete and is in accordance with the provisions
                of the Income-Tax Act, 1961. I further declare that I am making this certificate in my capacity as Authorized Signatory
                and I am also competent to issue this certificate. I am holding PAN{' '}
                <strong style={{ color: '#0f172a', fontWeight: '700' }}>[Signatory PAN]</strong>.
              </p>

              {/* Date & Signature Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  fontSize: '11.5px',
                  color: '#000000'
                }}
              >
                <div>
                  Date: <strong style={{ fontWeight: '700', color: '#0f172a' }}>[DD/MM/YYYY]</strong>
                </div>

                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>Signature:</span>
                    <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>
                      [Signature / Name]
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', fontWeight: '400', color: '#000000', marginTop: '4px' }}>
                    (Authorized Signatory)
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Statutory Exemption Box */}
            <div
              style={{
                border: '1.2px solid #000000',
                padding: '14px 18px',
                background: '#ffffff',
                fontSize: '10.5px',
                color: '#000000'
              }}
            >
              {/* Row 1: PAN, 12A, Dated */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.3fr 1fr',
                  gap: '8px',
                  marginBottom: '10px'
                }}
              >
                <div>
                  PAN: <strong style={{ color: '#0f172a', fontWeight: '700' }}>[Trust PAN]</strong>
                </div>
                <div>
                  12A Regn No.: <strong style={{ color: '#0f172a', fontWeight: '700' }}>[12A Regn No]</strong>
                </div>
                <div>
                  Dated: <strong style={{ color: '#0f172a', fontWeight: '700' }}>[DD/MM/YYYY]</strong>
                </div>
              </div>

              {/* Row 2: 80G, Dated */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2.3fr',
                  gap: '8px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  80G Regn No.: <strong style={{ color: '#0f172a', fontWeight: '700' }}>[80G Regn No]</strong>
                </div>
                <div>
                  Dated: <strong style={{ color: '#0f172a', fontWeight: '700' }}>[DD/MM/YYYY]</strong>
                </div>
              </div>

              {/* Row 3: Statutory Exemption Note */}
              <div style={{ fontSize: '10px', lineHeight: '1.45', color: '#000000' }}>
                Charitable Institutions are not required to affix revenue stamp on receipt under schedule | ART - 53 exemption(b) of the Indian Stamp Act.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
