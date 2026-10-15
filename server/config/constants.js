module.exports = {
  SUPPORTED_CURRENCIES: {
    INR: { symbol: '₹', rate: 1.0, name: 'Indian Rupee' },
    USD: { symbol: '$', rate: 0.012, name: 'US Dollar' },
    EUR: { symbol: '€', rate: 0.011, name: 'Euro' },
    GBP: { symbol: '£', rate: 0.0094, name: 'British Pound' },
    AED: { symbol: 'AED ', rate: 0.044, name: 'UAE Dirham' }
  },
  SUPPORTED_LANGUAGES: {
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
  },

  // What each kind of partner is allowed to list. Local partners are tied to their home city.
  AGENCY_TYPES: ['Hotel Partner', 'Cab Operator', 'Intercity Transit', 'Tour Operator'],
  AGENCY_CAPABILITIES: {
    'Hotel Partner': ['hotel'],
    'Cab Operator': ['local-transport'],
    'Intercity Transit': ['intercity-transport'],
    'Tour Operator': ['package']
  },
  CITY_BOUND_AGENCY_TYPES: ['Hotel Partner', 'Cab Operator', 'Tour Operator'],

  DEFAULT_COMMISSION_PERCENT: 10.0,
  LOYALTY_POINTS_PER_100_INR: 5,
  LOYALTY_POINT_VALUE_INR: 1.0,
  MAX_LOYALTY_REDEEM_PERCENT: 20
};
