import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

export default function SimplePopup({
  isOpen,
  type = 'success',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false
}) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm' || showCancel;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onCancel || onConfirm}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '26px 28px 22px 28px',
          width: '100%',
          maxWidth: '360px',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close 'X' Button at Top Right */}
        <button
          type="button"
          onClick={onCancel || onConfirm}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background-color 0.15s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Top Icon Badge */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          {type === 'confirm' ? (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#fff3cd',
                border: '2px solid #ffeeba',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#856404'
              }}
            >
              <AlertTriangle size={28} strokeWidth={2.2} />
            </div>
          ) : type === 'error' ? (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#f8d7da',
                border: '2px solid #f5c6cb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#721c24'
              }}
            >
              <X size={28} strokeWidth={2.5} />
            </div>
          ) : (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#e7f7eb',
                border: '2px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <Check size={30} strokeWidth={3} color="#10b981" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#0f172a'
          }}
        >
          {title || (type === 'confirm' ? 'Confirm Action' : type === 'error' ? 'Notice' : 'Success!')}
        </h3>

        {/* Message */}
        <p
          style={{
            margin: '0 0 22px 0',
            fontSize: '13.5px',
            color: '#475569',
            lineHeight: 1.5
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {isConfirm && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            style={{
              backgroundColor: type === 'confirm' ? '#dc2626' : '#10b981',
              border: 'none',
              color: '#ffffff',
              padding: '8px 28px',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: isConfirm ? '80px' : '96px',
              boxShadow: type === 'confirm'
                ? '0 2px 5px rgba(220, 38, 38, 0.3)'
                : '0 2px 8px rgba(16, 185, 129, 0.35)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = type === 'confirm' ? '#b91c1c' : '#059669';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = type === 'confirm' ? '#dc2626' : '#10b981';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
