import en from './en.json';
import ru from './ru.json';

export type SupportedLocale = 'en' | 'ru';

let currentLocale: SupportedLocale = 'ru'; // Default to Russian as per requirements or user preferences

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dictionary = currentLocale === 'ru' ? (ru as Record<string, any>) : (en as Record<string, any>);
  const parts = key.split('.');
  let current: any = dictionary;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English if missing in current locale
      const fallbackDict = en as Record<string, any>;
      let fb: any = fallbackDict;
      for (const p of parts) {
        if (fb && typeof fb === 'object' && p in fb) {
          fb = fb[p];
        } else {
          return `[MISSING: ${key}]`;
        }
      }
      current = fb;
      break;
    }
  }

  if (typeof current !== 'string') {
    return `[INVALID: ${key}]`;
  }

  if (params) {
    let result = current;
    for (const [paramKey, paramVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }
    return result;
  }

  return current;
}

