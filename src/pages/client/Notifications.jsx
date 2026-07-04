import React from 'react';
import { Bell } from 'lucide-react';
import { TopBar, EmptyState, fmtDate } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Notifications({ notifications, onBack, onRead }) {
  const { t } = useLanguage();
  return (
    <div>
      <TopBar title={t('notifications')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {notifications.length === 0 ? (
          <EmptyState icon={<Bell size={32} />} title={t('noNotifications')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && onRead(n.id)}
                style={{
                  textAlign: 'left', background: n.read ? '#fff' : '#EFFBE3', border: '1px solid ' + (n.read ? '#E1E6E1' : '#C9A227'),
                  borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                  <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A', marginTop: 4 }}>{fmtDate(n.created_at)}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1FB9D6', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
