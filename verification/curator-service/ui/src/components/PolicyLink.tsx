import React, { useEffect } from 'react';
import clsx from 'clsx';

type LegalType = 'privacy-policy' | 'cookie-policy' | 'terms-and-conditions';

interface Props {
    children: string;
    type: LegalType;
    classes?: {
        root: string;
    };
}

const POLICY_URL = 'https://www.iubenda.com';
const POLICY_ID = process.env.REACT_APP_POLICY_PUBLIC_ID;
export default function PolicyLink({
    children,
    type,
    classes,
}: Props): JSX.Element {
    useEffect(() => {
        const script = document.createElement('script');

        script.src = 'https://cdn.iubenda.com/iubenda.js';

        document.body.appendChild(script);
    }, []);

    const createURL = (type: LegalType): string => {
        switch (type) {
            case 'cookie-policy':
                return `${POLICY_URL}/privacy-policy/${POLICY_ID}/cookie-policy`;
            case 'privacy-policy':
                return `${POLICY_URL}/privacy-policy/${POLICY_ID}`;
            default:
                return `${POLICY_URL}/${type}/${POLICY_ID}`;
        }
    };

    return (
        <a
            href={createURL(type)}
            className={clsx([
                'iubenda-nostyle',
                'iubenda-embed',
                classes?.root,
            ])}
        >
            {children}
        </a>
    );
}
