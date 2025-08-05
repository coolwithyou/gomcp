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
declare class I18nManager {
    private currentLanguage;
    private translations;
    private fallbackLanguage;
    initialize(language?: Language): Promise<void>;
    setLanguage(language: Language): void;
    getCurrentLanguage(): Language;
    getAvailableLanguages(): Array<{
        code: Language;
        name: string;
    }>;
    t(key: string, params?: Record<string, string | number>): string;
    formatChoice(name: string, value: string): {
        name: string;
        value: string;
    };
}
declare const i18n: I18nManager;
export { i18n };
export type { Translation };
export declare function t(key: string, params?: Record<string, string | number>): string;
//# sourceMappingURL=index.d.ts.map