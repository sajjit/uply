import React, { useState, useEffect } from 'react';
import { Store, Package, Inbox, ClipboardList, Users, BarChart3 } from 'lucide-react';
import * as api from '../../lib/api';
import { GlobalStyle, TopBar } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';
import AdminHome from './Home';
import AdminRestaurants from './Restaurants';
import AdminProducts from './Products';
import AdminRequests from './Requests';
import AdminOrders from './Orders';
import AdminUsers from './Users';
import AdminStats from './Stats';

export default function AdminApp({ profile, onLogout }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [r, p, o, req, u] = await Promise.all([
      api.fetchRestaurants(),
      api.fetchProducts(),
      api.fetchOrders(),
      api.fetchProductRequests(),
      api.fetchUsers(),
    ]);
    setRestaurants(r.data);
    setProducts(p.data);
    setOrders(o.data);
    setRequests(req.data);
    setUsers(u.data);
    setLoading(false);
  }

  const tabs = [
    { id: 'home', label: t('tabHome'), icon: Store },
    { id: 'restaurants', label: t('tabRestaurants'), icon: Store },
    { id: 'products', label: t('tabProducts'), icon: Package },
    { id: 'requests', label: t('tabRequests'), icon: Inbox },
    { id: 'orders', label: t('tabOrders'), icon: ClipboardList },
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

  return (
    <div className="uply-root">
      <GlobalStyle />
      <TopBar title={t('adminSpace')} subtitle={profile.email} onLogout={onLogout} />
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
        {tab === 'restaurants' && <AdminRestaurants restaurants={restaurants} products={products} users={users} onChange={loadAll} />}
        {tab === 'products' && <AdminProducts restaurants={restaurants} products={products} onChange={loadAll} />}
        {tab === 'requests' && <AdminRequests requests={requests} restaurants={restaurants} onChange={loadAll} />}
        {tab === 'orders' && <AdminOrders orders={orders} restaurants={restaurants} onChange={loadAll} />}
        {tab === 'users' && <AdminUsers restaurants={restaurants} users={users} onChange={loadAll} />}
        {tab === 'stats' && <AdminStats />}
      </div>
    </div>
  );
}
