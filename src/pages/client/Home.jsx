import React from 'react';
import { ChefHat, ClipboardList, Bell, FileText, Heart, Zap } from 'lucide-react';
import { TopBar } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ClientHome({ restaurant, onNewOrder, onOrders, onInvoices, onFavorites, onQuickOrder, onLogout, ordersCount, notifications, onOpenNotifications }) {
  const { t } = useLanguage();
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <div>
      <TopBar title={restaurant?.name || 'Restaurant'} subtitle={t('clientSpace')} onLogout={onLogout} />
      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div className="uply-display" style={{ fontSize: 22, fontWeight: 700 }}>{t('hello')}</div>
          <button onClick={onOpenNotifications} style={{ position: 'relative', background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 8 }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#1FB9D6', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <div style={{ color: '#576257', fontSize: 14, marginBottom: 24 }}>{t('whatToDo')}</div>

        <button onClick={onNewOrder} style={{ width: '100%', textAlign: 'left', background: '#0D0F0D', color: '#F7F9F7', border: 'none', borderRadius: 10, padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <ChefHat size={28} />
          <div>
            <div className="uply-display" style={{ fontWeight: 700, fontSize: 16 }}>{t('newOrder')}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{t('newOrderDesc')}</div>
          </div>
        </button>

        <button onClick={onQuickOrder} style={{ width: '100%', textAlign: 'left', background: 'linear-gradient(135deg, #1FB9D6 0%, #9ADB3C 100%)', color: '#0D0F0D', border: 'none', borderRadius: 10, padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Zap size={28} />
          <div>
            <div className="uply-display" style={{ fontWeight: 700, fontSize: 16 }}>{t('quickOrder')}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{t('quickOrderHomeDesc')}</div>
          </div>
        </button>

        <button onClick={onOrders} style={{ width: '100%', textAlign: 'left', background: '#fff', color: '#0D0F0D', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <ClipboardList size={28} />
          <div>
            <div className="uply-display" style={{ fontWeight: 700, fontSize: 16 }}>{t('myOrders')}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{ordersCount} {t('totalOrders')}</div>
          </div>
        </button>

        <button onClick={onFavorites} style={{ width: '100%', textAlign: 'left', background: '#fff', color: '#0D0F0D', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Heart size={28} />
          <div>
            <div className="uply-display" style={{ fontWeight: 700, fontSize: 16 }}>{t('myFavorites')}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{t('myFavoritesDesc')}</div>
          </div>
        </button>

        <button onClick={onInvoices} style={{ width: '100%', textAlign: 'left', background: '#fff', color: '#0D0F0D', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <FileText size={28} />
          <div>
            <div className="uply-display" style={{ fontWeight: 700, fontSize: 16 }}>Mes factures</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Télécharger vos factures PDF</div>
          </div>
        </button>
      </div>
    </div>
  );
}
