import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class I18nManager {
    currentLanguage = 'en';
    translations = new Map();
    fallbackLanguage = 'en';
    async initialize(language) {
        const languages = ['en', 'ko', 'zh', 'es', 'ja'];
        for (const lang of languages) {
            try {
                const translationPath = path.join(__dirname, 'translations', `${lang}.json`);
                const content = await fs.readFile(translationPath, 'utf-8');
                const translation = JSON.parse(content);
                this.translations.set(lang, translation);
            }
            catch (error) {
                console.error(`Failed to load ${lang} translation:`, error);
            }
        }
        if (language && this.translations.has(language)) {
            this.currentLanguage = language;
        }
    }
    setLanguage(language) {
        if (this.translations.has(language)) {
            this.currentLanguage = language;
        }
        else {
            console.warn(`Language ${language} not available, using ${this.fallbackLanguage}`);
            this.currentLanguage = this.fallbackLanguage;
        }
    }
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    getAvailableLanguages() {
        const languages = [];
        for (const [code, translation] of this.translations.entries()) {
            languages.push({
                code,
                name: translation.language.name,
            });
        }
        return languages;
    }
    t(key, params) {
        const translation = this.translations.get(this.currentLanguage);
        const fallbackTranslation = this.translations.get(this.fallbackLanguage);
        if (!translation && !fallbackTranslation) {
            return key;
        }
        const keys = key.split('.');
        let value = translation || fallbackTranslation;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                if (fallbackTranslation && translation !== fallbackTranslation) {
                    value = fallbackTranslation;
                    for (const fk of keys) {
                        if (value && typeof value === 'object' && fk in value) {
                            value = value[fk];
                        }
                        else {
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
        if (params) {
            for (const [param, paramValue] of Object.entries(params)) {
                value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(paramValue));
            }
        }
        return value;
    }
    formatChoice(name, value) {
        return { name, value };
    }
}
const i18n = new I18nManager();
export { i18n };
export function t(key, params) {
    return i18n.t(key, params);
}
//# sourceMappingURL=index.js.map