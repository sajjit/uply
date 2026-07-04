import React from 'react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

/**
 * Injects Uply's global design tokens (fonts, base resets) once.
 * Mount this at the root of the app, not inside individual pages.
 */
export default function GlobalStyle() {
  return (
    <style>{fontImport}{`
      * { box-sizing: border-box; }
      body { margin: 0; }
      .uply-root { font-family: 'Inter', sans-serif; background: #F7F9F7; color: #0D0F0D; min-height: 100vh; }
      .uply-display { font-family: 'Space Grotesk', sans-serif; }
      .uply-mono { font-family: 'JetBrains Mono', monospace; }
      input, button, select, textarea { font-family: inherit; }
      button { cursor: pointer; }
      button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #1FB9D6; outline-offset: 2px; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: #CBD3CB; border-radius: 4px; }
    `}</style>
  );
}

/**
 * Uply brand tokens, matching the client's logo (teal → lime gradient on
 * near-black). Import these instead of hardcoding hex values in components,
 * so future palette tweaks only require editing this one file.
 */
export const colors = {
  ink: '#0D0F0D',        // near-black from the logo background
  paper: '#F7F9F7',      // light, slightly cool background for daily use
  teal: '#1FB9D6',       // logo gradient start
  lime: '#9ADB3C',       // logo gradient end
  accent: '#1FB9D6',     // primary interactive accent (teal)
  accentAlt: '#9ADB3C',  // secondary accent (lime), used sparingly for success/positive states
  success: '#5A9C3E',
  warning: '#C9A227',
  danger: '#C0392B',
  border: '#E1E6E1',
  borderStrong: '#CBD3CB',
  muted: '#8A938A',
  textMuted: '#576257',
};

/** CSS gradient string matching the logo, for hero/brand moments (login, splash). */
export const brandGradient = 'linear-gradient(135deg, #1FB9D6 0%, #9ADB3C 100%)';
