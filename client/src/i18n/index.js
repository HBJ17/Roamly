import en from './en';
import translations from './translations';

export const LANGUAGES = {
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

const dictionaries = { en, ...translations };

// Missing keys fall back to English, then to the key itself. `{name}` placeholders are filled from vars.
export const translate = (lang, key, vars) => {
  const text = dictionaries[lang]?.[key] ?? en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
};

export const registerDictionary = (lang, dict) => {
  dictionaries[lang] = dict;
};
