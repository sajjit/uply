import React, { useState, useEffect } from 'react';
import { Store, Package, Inbox, ClipboardList, Users, BarChart3, Truck, Bell, ShoppingCart, Archive } from 'lucide-react';
import * as api from '../../lib/api';
import { GlobalStyle, TopBar } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';
import Notifications from '../client/Notifications';
import AdminHome from './Home';
import AdminRestaurants from './Restaurants';
import AdminProducts from './Products';
import AdminSuppliers from './Suppliers';
import AdminRequests from './Requests';
import AdminOrders from './Orders';
import AdminPlaceOrder from './PlaceOrder';
import AdminUsers from './Users';
import AdminStats from './Stats';

export default function AdminApp({ profile, onLogout }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  // silent=true for refreshes triggered by an action within a tab (e.g. after
  // creating/editing something) — otherwise every action flashes the
  // full-page loading screen and unmounts the current tab, wiping out any
  // local state (like a just-shown success message).
  async function loadAll(silent = false) {
    if (!silent) setLoading(true);
    const [r, p, s, o, req, u, n] = await Promise.all([
      api.fetchRestaurants(),
      api.fetchProducts(),
      api.fetchSuppliers(),
      api.fetchOrders(),
      api.fetchProductRequests(),
      api.fetchUsers(),
      api.fetchNotifications(profile.id),
    ]);
    setRestaurants(r.data);
    setProducts(p.data);
    setSuppliers(s.data);
    setOrders(o.data);
    setRequests(req.data);
    setUsers(u.data);
    setNotifications(n.data);
    setLoading(false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { id: 'home', label: t('tabHome'), icon: Store },
    { id: 'restaurants', label: t('tabRestaurants'), icon: Store },
    { id: 'products', label: t('tabProducts'), icon: Package },
    { id: 'suppliers', label: t('tabSuppliers'), icon: Truck },
    { id: 'requests', label: t('tabRequests'), icon: Inbox },
    { id: 'orders', label: t('tabOrders'), icon: ClipboardList },
    { id: 'archive', label: t('tabArchive'), icon: Archive },
    { id: 'placeOrder', label: t('tabPlaceOrder'), icon: ShoppingCart },
    { id: 'users', label: t('tabUsers'), icon: Users },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="uply-root">
        <GlobalStyle />
        <div style={{ padding: 40, textAlign: 'center', color: '#8A938A' }} className="uply-mono">{t('loading')}</div>
      </div>
    );
  }

  if (showNotifications) {
    return (
      <div className="uply-root">
        <GlobalStyle />
        <Notifications
          notifications={notifications}
          onBack={() => setShowNotifications(false)}
          onRead={async (id) => {
            await api.markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
          }}
        />
      </div>
    );
  }

  return (
    <div className="uply-root">
      <GlobalStyle />
      <TopBar
        title={t('adminSpace')}
        subtitle={profile.email}
        onLogout={onLogout}
        extra={
          <button onClick={() => setShowNotifications(true)} style={{ position: 'relative', background: 'none', border: '1px solid #243024', borderRadius: 6, color: '#F7F9F7', padding: 7, display: 'flex', alignItems: 'center' }}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#1FB9D6', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </button>
        }
      />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px', background: '#fff', borderBottom: '1.5px solid #E1E6E1' }}>
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, border: '1.5px solid ' + (tab === tb.id ? '#0D0F0D' : '#E1E6E1'),
              background: tab === tb.id ? '#0D0F0D' : '#fff', color: tab === tb.id ? '#F7F9F7' : '#0D0F0D',
            }}
          >
            <tb.icon size={14} /> {tb.label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, paddingBottom: 60 }}>
        {tab === 'home' && <AdminHome restaurants={restaurants} products={products} orders={orders} requests={requests} />}
        {tab === 'restaurants' && <AdminRestaurants restaurants={restaurants} products={products} users={users} onChange={() => loadAll(true)} />}
        {tab === 'products' && <AdminProducts restaurants={restaurants} products={products} suppliers={suppliers} onChange={() => loadAll(true)} />}
        {tab === 'suppliers' && <AdminSuppliers restaurants={restaurants} suppliers={suppliers} onChange={() => loadAll(true)} />}
        {tab === 'requests' && <AdminRequests requests={requests} restaurants={restaurants} onChange={() => loadAll(true)} />}
        {tab === 'orders' && <AdminOrders orders={orders} restaurants={restaurants} onChange={() => loadAll(true)} />}
        {tab === 'archive' && <AdminOrders orders={orders} restaurants={restaurants} onChange={() => loadAll(true)} archived />}
        {tab === 'placeOrder' && <AdminPlaceOrder restaurants={restaurants} products={products} profile={profile} onChange={() => loadAll(true)} />}
        {tab === 'users' && <AdminUsers restaurants={restaurants} users={users} onChange={() => loadAll(true)} />}
        {tab === 'stats' && <AdminStats />}
      </div>
    </div>
  );
}
