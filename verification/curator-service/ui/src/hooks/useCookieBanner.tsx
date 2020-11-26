import { useEffect } from 'react';

const POLICY_ID = process.env.REACT_APP_POLICY_PUBLIC_ID;
const SITE_ID = process.env.REACT_APP_COOKIE_CONSENT_PUBLIC_ID;

const configuration = {
    whitelabel: false,
    lang: 'en',
    siteId: SITE_ID,
    cookiePolicyId: POLICY_ID,
    banner: {
        rejectButtonColor: '#ECF3F0',
        rejectButtonCaptionColor: '#0E7569',
        position: 'float-bottom-center',
        textColor: 'white',
        backgroundColor: '#0E7569',
        acceptButtonDisplay: true,
        acceptButtonColor: 'white',
        acceptButtonCaptionColor: '#0E7569',
        customizeButtonDisplay: true,
        customizeButtonColor: '#ECF3F0',
        customizeButtonCaptionColor: '#0E7569',
    },
};
export default function useCookieBanner(): void {
    const insertConfiguration = (): void => {
        const script = document.createElement('script');

        script.text = `
            var _iub = _iub || [];
            _iub.csConfiguration = ${JSON.stringify(configuration)}
        `;

        document.head.appendChild(script);
    };

    const insertScript = (): void => {
        const script = document.createElement('script');

        script.src = 'https://cdn.iubenda.com/cs/iubenda_cs.js';

        document.body.appendChild(script);
    };

    useEffect(() => {
        insertConfiguration();
        insertScript();
    }, []);
}
