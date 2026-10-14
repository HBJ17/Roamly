import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translate } from '../i18n';
import api from '../api/client';

const DEFAULT_CURRENCIES = {
  INR: { symbol: '₹', rate: 1.0, name: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012, name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011, name: 'Euro' },
  GBP: { symbol: '£', rate: 0.0094, name: 'British Pound' },
  AED: { symbol: 'AED ', rate: 0.044, name: 'UAE Dirham' }
};

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const AppContext = createContext(null);
const MAX_COMPARE = 4;

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState(() => read('roamly_currency', 'INR'));
  const [lang, setLang] = useState(() => read('roamly_lang', 'en'));
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(read('roamly_compare', '[]'));
    } catch {
      return [];
    }
  });

  // Live display rates from the API; built-in rates are used until (or if) they arrive.
  useEffect(() => {
    api.get('/config').then((res) => setCurrencies(res.data.currencies)).catch(() => {});
  }, []);

  useEffect(() => write('roamly_currency', currency), [currency]);
  useEffect(() => write('roamly_compare', JSON.stringify(compareList)), [compareList]);
  useEffect(() => {
    write('roamly_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(() => {
    const curr = currencies[currency] || currencies.INR;
    // Prices are stored in INR; other currencies are display-only conversions.
    const formatCurrency = (amountInINR, { exact = false } = {}) => {
      const n = Number(amountInINR || 0) * curr.rate;
      const digits = currency === 'INR' || !exact ? 0 : 2;
      return `${curr.symbol}${n.toLocaleString(currency === 'INR' ? 'en-IN' : undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })}`;
    };

    const toggleCompare = (pkg) => {
      let added = false;
      setCompareList((prev) => {
        if (prev.some((p) => p._id === pkg._id)) return prev.filter((p) => p._id !== pkg._id);
        if (prev.length >= MAX_COMPARE) return prev;
        added = true;
        return [...prev, { _id: pkg._id, title: pkg.title, destinationName: pkg.destinationName }];
      });
      return added;
    };

    return {
      currency,
      setCurrency,
      currencies,
      setCurrencies,
      lang,
      setLang,
      languages: LANGUAGES,
      t: (key, vars) => translate(lang, key, vars),
      formatCurrency,
      compareList,
      toggleCompare,
      isComparing: (id) => compareList.some((p) => p._id === id),
      compareFull: compareList.length >= MAX_COMPARE,
      removeCompare: (id) => setCompareList((prev) => prev.filter((p) => p._id !== id)),
      clearCompare: () => setCompareList([])
    };
  }, [currency, currencies, lang, compareList]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
