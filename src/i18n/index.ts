import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Language = 'en' | 'ko' | 'zh' | 'es' | 'ja';

interface Translation {
  language: {
    name: string;
    code: string;
  };
  mainMenu: Record<string, string>;
  messages: Record<string, string>;
  prompts: Record<string, string>;
  choices: Record<string, string>;
  errors: Record<string, string>;
  server: Record<string, string>;
}

class I18nManager {
  private currentLanguage: Language = 'en';
  private translations: Map<Language, Translation> = new Map();
  private fallbackLanguage: Language = 'en';

  async initialize(language?: Language): Promise<void> {
    // Load all available translations
    const languages: Language[] = ['en', 'ko', 'zh', 'es', 'ja'];

    for (const lang of languages) {
      try {
        const translationPath = path.join(__dirname, 'translations', `${lang}.json`);
        const content = await fs.readFile(translationPath, 'utf-8');
        const translation = JSON.parse(content) as Translation;
        this.translations.set(lang, translation);
      } catch (error) {
        console.error(`Failed to load ${lang} translation:`, error);
      }
    }

    // Set current language
    if (language && this.translations.has(language)) {
      this.currentLanguage = language;
    }
  }

  setLanguage(language: Language): void {
    if (this.translations.has(language)) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language ${language} not available, using ${this.fallbackLanguage}`);
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getAvailableLanguages(): Array<{ code: Language; name: string }> {
    const languages: Array<{ code: Language; name: string }> = [];

    for (const [code, translation] of this.translations.entries()) {
      languages.push({
        code,
        name: translation.language.name,
      });
    }

    return languages;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.translations.get(this.currentLanguage);
    const fallbackTranslation = this.translations.get(this.fallbackLanguage);

    if (!translation && !fallbackTranslation) {
      return key;
    }

    // Split key by dot to navigate nested structure
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translation || fallbackTranslation;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Try fallback language
        if (fallbackTranslation && translation !== fallbackTranslation) {
          value = fallbackTranslation;
          for (const fk of keys) {
            if (value && typeof value === 'object' && fk in value) {
              value = value[fk];
            } else {
              return key;
            }
          }
          break;
        }
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      for (const [param, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  }

  // Convenience method for choice formatting
  formatChoice(name: string, value: string): { name: string; value: string } {
    return { name, value };
  }
}

// Create singleton instance
const i18n = new I18nManager();

// Export instance and types
export { i18n };
export type { Translation };

/**
 * Retrieves a localized string for the specified key, optionally substituting parameters.
 *
 * If the key is not found in the current language, falls back to the default language. Returns the key itself if no translation is available.
 *
 * @param key - The dot-separated path to the translation string
 * @param params - Optional parameters to replace placeholders in the translation
 * @returns The localized string with parameters substituted, or the key if not found
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return i18n.t(key, params);
}
