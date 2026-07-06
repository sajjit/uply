import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { GlobalStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';
import ClientHome from './Home';
import Notifications from './Notifications';
import Catalog from './Catalog';
import Cart from './Cart';
import OrdersList from './Orders';
import RequestProduct from './RequestProduct';
import MyInvoices from './MyInvoices';
import Favorites from './Favorites';
import QuickOrder from './QuickOrder';

export default function ClientApp({ profile, onLogout }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('home');
  const [cart, setCart] = useState({});
  const [cartComment, setCartComment] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: prods }, { data: ords }, { data: rests }, { data: favs }, { data: orderStats }, { data: notifs }] = await Promise.all([
      api.fetchProducts(profile.restaurant_id),
      api.fetchOrders(profile.restaurant_id),
      api.fetchRestaurants(),
      api.fetchFavorites(profile.id),
      api.fetchOrderStats(profile.restaurant_id),
      api.fetchNotifications(profile.id),
    ]);
    setProducts((prods || []).filter((p) => p.active));
    setOrders((ords || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setRestaurant((rests || []).find((r) => r.id === profile.restaurant_id));
    setFavorites(favs || []);
    setStats(orderStats || {});
    setNotifications(notifs || []);
    setLoading(false);
  }

  const cartCount = Object.values(cart).reduce((s, c) => s + (c.qty || 0), 0);

  function setQty(productId, qty, comment) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = { qty, comment: comment !== undefined ? comment : (prev[productId]?.comment || '') };
      return next;
    });
  }

  async function toggleFav(productId) {
    const isFav = favorites.includes(productId);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== productId) : [...prev, productId]));
    await api.toggleFavorite(profile.id, productId, !isFav);
  }

  async function submitOrder() {
    const items = Object.entries(cart).map(([productId, c]) => {
      const p = products.find((x) => x.id === productId);
      return { productId, name: p?.name, qty: c.qty, unit: p?.unit, comment: c.comment, unitPrice: p?.price || 0 };
    });
    if (items.length === 0) return;
    await api.createOrder(profile.restaurant_id, items, profile.id, cartComment);
    setCart({});
    setCartComment('');
    await loadAll();
    setTab('orders');
  }

  function reorder(order) {
    const newCart = {};
    for (const it of order.order_items || []) {
      if (it.product_id && products.find((p) => p.id === it.product_id)) {
        newCart[it.product_id] = { qty: it.qty, comment: it.comment || '' };
      }
    }
    setCart(newCart);
    setTab('cart');
  }

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
      {tab === 'home' && (
        <ClientHome
          restaurant={restaurant}
          onNewOrder={() => setTab('catalog')}
          onOrders={() => setTab('orders')}
          onInvoices={() => setTab('invoices')}
          onFavorites={() => setTab('favorites')}
          onQuickOrder={() => setTab('quickOrder')}
          onLogout={onLogout}
          ordersCount={orders.length}
          notifications={notifications}
          onOpenNotifications={() => setTab('notifications')}
        />
      )}
      {tab === 'quickOrder' && (
        <QuickOrder
          products={products}
          stats={stats}
          onBack={() => setTab('home')}
          onConfirm={(items) => {
            setCart((prev) => {
              const next = { ...prev };
              for (const it of items) next[it.productId] = { qty: it.qty, comment: prev[it.productId]?.comment || '' };
              return next;
            });
            setTab('cart');
          }}
        />
      )}
      {tab === 'favorites' && (
        <Favorites
          products={products}
          favorites={favorites}
          cart={cart}
          setQty={setQty}
          onToggleFav={toggleFav}
          onBack={() => setTab('home')}
        />
      )}
      {tab === 'invoices' && <MyInvoices restaurantId={profile.restaurant_id} onBack={() => setTab('home')} />}
      {tab === 'notifications' && (
        <Notifications
          notifications={notifications}
          onBack={() => setTab('home')}
          onRead={async (id) => {
            await api.markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
          }}
        />
      )}
      {tab === 'catalog' && (
        <Catalog
          products={products}
          cart={cart}
          setQty={setQty}
          onBack={() => setTab('home')}
          onCart={() => setTab('cart')}
          cartCount={cartCount}
          onRequestProduct={() => setTab('requestProduct')}
          favorites={favorites}
          onToggleFav={toggleFav}
          stats={stats}
        />
      )}
      {tab === 'cart' && (
        <Cart
          cart={cart}
          products={products}
          setQty={setQty}
          onBack={() => setTab('catalog')}
          onSubmit={submitOrder}
          comment={cartComment}
          setComment={setCartComment}
        />
      )}
      {tab === 'orders' && <OrdersList orders={orders} onBack={() => setTab('home')} onReorder={reorder} />}
      {tab === 'requestProduct' && (
        <RequestProduct
          onBack={() => setTab('catalog')}
          onSubmit={async (name, comment) => {
            await api.createProductRequest(profile.restaurant_id, name, comment, profile.id);
            setTab('catalog');
          }}
        />
      )}
    </div>
  );
}
