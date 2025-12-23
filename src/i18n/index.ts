type Translations = {
    [key: string]: string | Translations;
};

export class I18n {
    locale: string = 'en';
    translations: Translations = {};
    observers: Function[] = [];

    constructor() {
        this.locale = localStorage.getItem('moonbix_lang') || 'en';
    }

    async loadTranslations(locale: string) {
        this.locale = locale;
        localStorage.setItem('moonbix_lang', locale);

        try {
            // Dynamic import in Vite
            const module = await import(`./locales/${locale}.json`);
            this.translations = module.default;
            this.notify();
        } catch (e) {
            console.error(`Failed to load translations for ${locale}`, e);
        }
    }

    t(key: string): string {
        const keys = key.split('.');
        let value: any = this.translations;
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    }

    subscribe(cb: Function) {
        this.observers.push(cb);
    }

    notify() {
        this.observers.forEach(cb => cb());
    }
}

export const i18n = new I18n();
