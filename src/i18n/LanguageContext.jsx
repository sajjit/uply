import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translate } from './translations';
import { updateLanguage } from '../lib/api';

/* ============================================================
   Language context.
   - Default language is French (the app's primary language).
   - Persisted in localStorage so the choice survives a refresh.
   - Optionally synced to the user's profile in the database
     (profiles.language) so it follows them across devices.
   ============================================================ */

const LanguageContext = createContext({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = 'uply_lang';

export function LanguageProvider({ children, profileId = null }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // French is the primary language. Only use stored value if it's explicitly 'en'.
      // This ensures new sessions always start in French.
      return stored === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  });

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  // If a profile is logged in and has a saved language preference, prefer it on load.
  useEffect(() => {
    // Intentionally not auto-overriding local choice once a session is active;
    // profileId is passed in so a future enhancement can sync from DB on first login.
  }, [profileId]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  async function setLangAndPersist(next) {
    setLang(next);
    if (profileId) {
      await updateLanguage(profileId, next);
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangAndPersist, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
