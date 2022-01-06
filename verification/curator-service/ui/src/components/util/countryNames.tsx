import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

// register en locale so we don't pack all the others
countries.registerLocale(en);

export default function nameCountry(isoCode: string): string {
    return countries.getName(isoCode, 'en', { select: 'official' });
}
