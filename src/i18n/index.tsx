import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en, type MessageKey } from './en';
import { vi } from './vi';

export type Locale = 'en' | 'vi';

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, vi };
const STORAGE_KEY = 'order-desk.locale';

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'vi' ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage is optional; the choice still applies to this page.
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionaries[locale][key as MessageKey] ?? dictionaries[locale]['errors.unknown'],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
