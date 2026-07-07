import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import * as api from './lib/api';
import { LanguageProvider } from './i18n/LanguageContext';
import { GlobalStyle } from './components/shared';
import Login from './pages/Login';
import SetNewPassword from './pages/SetNewPassword';
import ClientApp from './pages/client/ClientApp';
import AdminApp from './pages/admin/AdminApp';

/**
 * Root component. Responsibilities:
 *  - Hold auth/session state
 *  - Decide which top-level experience to render (login / client / admin)
 *  - Provide the LanguageProvider context to everything below it
 *
 * All actual page logic lives in src/pages/**. This file should stay thin —
 * if you're tempted to add a feature here, it probably belongs in a page.
 */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setProfile(null); setRecovery(false); }
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function init() {
    const session = await api.getSession();
    if (session) {
      const { profile: p } = await api.getMyProfile();
      setProfile(p);
    }
    setLoading(false);
  }

  async function handleLogin(email, password) {
    const { profile: p, error } = await api.signIn(email, password);
    if (error) return { ok: false, error };
    setProfile(p);
    return { ok: true };
  }

  async function handleLogout() {
    await api.signOut();
    setProfile(null);
  }

  function handlePasswordResetDone() {
    setRecovery(false);
    setProfile((prev) => (prev ? { ...prev, must_reset_password: false } : prev));
  }

  return (
    <LanguageProvider profileId={profile?.id || null}>
      <AppContent
        loading={loading}
        profile={profile}
        recovery={recovery}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPasswordResetDone={handlePasswordResetDone}
      />
    </LanguageProvider>
  );
}

function AppContent({ loading, profile, recovery, onLogin, onLogout, onPasswordResetDone }) {
  if (loading) {
    return (
      <div className="uply-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <GlobalStyle />
        <div className="uply-mono" style={{ color: '#8A938A' }}>Chargement…</div>
      </div>
    );
  }

  // Followed a "forgot password" email link — force the new-password screen
  // regardless of role, before anything else can render.
  if (recovery) {
    return <SetNewPassword profileId={profile?.id} onDone={onPasswordResetDone} />;
  }

  if (!profile) {
    return <Login onLogin={onLogin} />;
  }

  // Admin-created account that hasn't set its own password yet.
  if (profile.must_reset_password) {
    return <SetNewPassword profileId={profile.id} forced onDone={onPasswordResetDone} />;
  }

  if (profile.role === 'admin') {
    return <AdminApp profile={profile} onLogout={onLogout} />;
  }

  return <ClientApp profile={profile} onLogout={onLogout} />;
}
