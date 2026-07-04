import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export const STATUS_FR_VALUES = ['En attente', 'En préparation', 'Livrée'];

const STATUS_COLOR = {
  'En attente': { bg: '#C9A227', fg: '#0D0F0D' },
  'En préparation': { bg: '#1FB9D6', fg: '#F7F9F7' },
  'Livrée': { bg: '#5A9C3E', fg: '#F7F9F7' },
};

const STATUS_KEY = {
  'En attente': 'statusPending',
  'En préparation': 'statusPreparing',
  'Livrée': 'statusDelivered',
};

export default function StatusTab({ status }) {
  const { t } = useLanguage();
  const c = STATUS_COLOR[status] || STATUS_COLOR['En attente'];
  return (
    <span className="uply-mono" style={{
      background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: '4px 9px',
      borderRadius: 3, letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {t(STATUS_KEY[status] || 'statusPending')}
    </span>
  );
}
