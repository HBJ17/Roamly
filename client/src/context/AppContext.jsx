import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1.0, name: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012, name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011, name: 'Euro' },
  GBP: { symbol: '£', rate: 0.0094, name: 'British Pound' },
  AED: { symbol: 'AED ', rate: 0.044, name: 'UAE Dirham' }
};

const LANGUAGES = {
  en: 'English',
  ta: 'தமிழ் (Tamil)',
  hi: 'हिन्दी (Hindi)',
  te: 'తెలుగు (Telugu)',
  ml: 'മലയാളം (Malayalam)',
  kn: 'ಕನ್ನಡ (Kannada)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  es: 'Español (Spanish)',
  ja: '日本語 (Japanese)',
  ar: 'العربية (Arabic)'
};

const TRANSLATIONS = {
  en: {
    packages: 'Packages',
    hotels: 'Hotels',
    transports: 'Transports',
    trip_builder: 'Custom Itinerary',
    compare: 'Compare',
    dashboard: 'Dashboard',
    partner_desk: 'Partner Desk',
    central_control: 'Central Control',
    login: 'Sign In',
    signup: 'Join Caravan →',
    logout: 'Sign Out',
    search: 'Search',
    explore_packages: 'Explore Packages',
    book_now: 'Book Now',
    view_details: 'View Details',
    total_payable: 'Total Payable',
    verified_traveler: 'Verified Traveler'
  },
  hi: {
    packages: 'पैकेज',
    hotels: 'होटल',
    transports: 'परिवहन',
    trip_builder: 'कस्टम यात्रा कार्यक्रम',
    compare: 'तुलना करें',
    dashboard: 'डैशबोर्ड',
    partner_desk: 'पार्टनर डेस्क',
    central_control: 'केंद्रीय नियंत्रण',
    login: 'साइन इन',
    signup: 'शामिल हों →',
    logout: 'साइन आउट',
    search: 'खोजें',
    explore_packages: 'पैकेज खोजें',
    book_now: 'अभी बुक करें',
    view_details: 'विवरण देखें',
    total_payable: 'कुल देय',
    verified_traveler: 'सत्यापित यात्री'
  },
  ta: {
    packages: 'சுற்றுலா தொகுப்புகள்',
    hotels: 'விடுதிகள்',
    transports: 'போக்குவரத்து',
    trip_builder: 'பயணத் திட்டம்',
    compare: 'ஒப்பிடு',
    dashboard: 'டாஷ்போர்டு',
    partner_desk: 'பங்குதாரர் தளம்',
    central_control: 'மையக் கட்டுப்பாடு',
    login: 'உள்நுழைக',
    signup: 'இணையுங்கள் →',
    logout: 'வெளியேறுக',
    search: 'தேடுக',
    explore_packages: 'தொகுப்புகளைக் காண்க',
    book_now: 'பதிவு செய்க',
    view_details: 'விவரங்கள்',
    total_payable: 'மொத்த தொகை',
    verified_traveler: 'சரிபார்க்கப்பட்ட பயணி'
  }
};

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => localStorage.getItem('roamly_currency') || 'INR');
  const [lang, setLang] = useState(() => localStorage.getItem('roamly_lang') || 'en');
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roamly_compare') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('roamly_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('roamly_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('roamly_compare', JSON.stringify(compareList));
  }, [compareList]);

  // Format currency helper
  const formatCurrency = (amountInINR) => {
    if (amountInINR === undefined || amountInINR === null) return '₹0';
    const curr = CURRENCIES[currency] || CURRENCIES.INR;
    const converted = Number(amountInINR) * curr.rate;
    return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Translate helper
  const t = (key) => {
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
  };

  const toggleCompare = (pkg) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p._id === pkg._id);
      if (exists) return prev.filter((p) => p._id !== pkg._id);
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 packages at once.');
        return prev;
      }
      return [...prev, pkg];
    });
  };

  const removeCompare = (pkgId) => {
    setCompareList((prev) => prev.filter((p) => p._id !== pkgId));
  };

  return (
    <AppContext.Provider
      value={{
        currency,
        setCurrency,
        currencies: CURRENCIES,
        lang,
        setLang,
        languages: LANGUAGES,
        formatCurrency,
        t,
        compareList,
        toggleCompare,
        removeCompare,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
