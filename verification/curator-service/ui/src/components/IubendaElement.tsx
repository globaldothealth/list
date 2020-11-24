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

const IUBENDA_URL = 'https://www.iubenda.com';
const IUBENDA_SRC = 'https://cdn.iubenda.com/iubenda.js';
const IUBENDA_ID = process.env.REACT_APP_IUBENDA_PUBLIC_ID;
export default function IubendaElement({
    children,
    type,
    classes,
}: Props): JSX.Element {
    useEffect(() => {
        const script = document.createElement('script');
        const tag = document.getElementsByTagName('script')[0];

        script.src = IUBENDA_SRC;

        if (tag?.parentNode) {
            tag.parentNode.insertBefore(script, tag);
        }
    }, []);

    const createURL = (type: LegalType): string => {
        switch (type) {
            case 'cookie-policy':
                return `${IUBENDA_URL}/privacy-policy/${IUBENDA_ID}/cookie-policy`;
            case 'privacy-policy':
                return `${IUBENDA_URL}/privacy-policy/${IUBENDA_ID}`;
            default:
                return `${IUBENDA_URL}/${type}/${IUBENDA_ID}`;
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
