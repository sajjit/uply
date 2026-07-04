import React from 'react';

export const inputStyle = { padding: '9px 10px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 13 };

export function TextField({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="uply-mono" style={{ fontSize: 11, marginBottom: 5, color: '#576257', letterSpacing: '0.02em' }}>
        {label}
      </div>
      <input
        {...props}
        style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 14, background: '#fff', ...(props.style || {}) }}
      />
    </label>
  );
}

export function EmptyState({ icon, title, body }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8A938A' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div className="uply-display" style={{ fontWeight: 700, fontSize: 15, color: '#0D0F0D' }}>{title}</div>
      {body && <div style={{ fontSize: 13, marginTop: 6 }}>{body}</div>}
    </div>
  );
}

export function SectionHeader({ title }) {
  return <div className="uply-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{title}</div>;
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
