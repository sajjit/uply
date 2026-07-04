import React from 'react';
import { Plus, Minus } from 'lucide-react';

export function PrimaryButton({ children, onClick, disabled, style, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#CBD3CB' : '#1FB9D6',
        color: disabled ? '#8A938A' : '#F7F9F7',
        border: 'none', borderRadius: 6, padding: '12px 18px', fontWeight: 600, fontSize: 14,
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** The "punch-counter" quantity stepper used throughout the catalog and cart. */
export function Stepper({ value, onChange, min = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #0D0F0D', borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ background: '#0D0F0D', color: '#F7F9F7', border: 'none', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Minus size={14} />
      </button>
      <div className="uply-mono" style={{ width: 38, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{value}</div>
      <button
        onClick={() => onChange(value + 1)}
        style={{ background: '#0D0F0D', color: '#F7F9F7', border: 'none', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
