import React from 'react';
import { ArrowLeft, LogOut, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImage from '../../assets/logo.jpeg';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, color: '#0D0F0D',
        padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700,
        boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      <span>{lang === 'fr' ? 'FR' : 'EN'}</span>
    </button>
  );
}

export default function TopBar({ title, subtitle, onBack, onLogout, showLanguageToggle = true, extra }) {
  const { t } = useLanguage();
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10, background: '#0D0F0D', color: '#F7F9F7',
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 0 #1FB9D6', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#F7F9F7', padding: 4, flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <img src={logoImage} alt="" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div className="uply-display" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          {subtitle && <div className="uply-mono" style={{ fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {extra}
        {showLanguageToggle && <LanguageToggle />}
        {onLogout && (
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid #243024', borderRadius: 6, color: '#F7F9F7', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <LogOut size={14} /> {t('logout')}
          </button>
        )}
      </div>
    </div>
  );
}
