import React from 'react';
import navLogo from '../assets/Receipt-Nav-Logo.png';

export default function Logo({ size = 'normal', style = {} }) {
  const height = size === 'large' ? '56px' : size === 'small' ? '32px' : '44px';
  return (
    <img
      src={navLogo}
      alt="Donation Receipt Logo"
      style={{
        height,
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block',
        ...style
      }}
    />
  );
}
