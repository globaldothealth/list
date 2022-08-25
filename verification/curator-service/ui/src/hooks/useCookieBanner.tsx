import { useTheme, Theme } from '@mui/material/styles';

const POLICY_ID = process.env.REACT_APP_POLICY_PUBLIC_ID;
const SITE_ID = process.env.REACT_APP_COOKIE_CONSENT_PUBLIC_ID;

interface CookieInitialiser {
    initCookieBanner: () => void;
}

const useCookieBanner: () => CookieInitialiser = () => {
    const env = process.env.NODE_ENV;

    const theme = useTheme<Theme>();
    const configuration = {
        whitelabel: false,
        lang: 'en',
        siteId: SITE_ID,
        cookiePolicyId: POLICY_ID,
        banner: {
            rejectButtonColor: theme.palette.background.default,
            rejectButtonCaptionColor: theme.palette.primary.main,
            position: 'float-bottom-center',
            textColor: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            acceptButtonDisplay: true,
            acceptButtonColor: theme.palette.background.paper,
            acceptButtonCaptionColor: theme.palette.primary.main,
            customizeButtonDisplay: true,
            customizeButtonColor: theme.palette.background.default,
            customizeButtonCaptionColor: theme.palette.primary.main,
        },
    };

    const insertConfiguration = () => {
        const script = document.createElement('script');

        script.text = `
            var _iub = _iub || [];
            _iub.csConfiguration = ${JSON.stringify(configuration)}
        `;

        document.head.appendChild(script);
    };

    const insertScript = () => {
        const script = document.createElement('script');

        script.src = 'https://cdn.iubenda.com/cs/iubenda_cs.js';

        document.body.appendChild(script);
    };

    const initCookieBanner = () => {
        if (env !== 'production') return;

        insertConfiguration();
        insertScript();
    };

    return {
        initCookieBanner,
    };
};

export { useCookieBanner };
