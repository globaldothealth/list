import React, { useEffect } from 'react';
import clsx from 'clsx';

type LegalType = 'privacy-policy' | 'cookie-policy' | 'terms-and-conditions';

interface Props {
    id: string;
    children: string;
    type: LegalType;
    classes?: {
        root: string;
    };
}

const IUBENDA_URL = 'https://www.iubenda.com';
const IUBENDA_SRC = 'https://cdn.iubenda.com/iubenda.js';
export default function IubendaElement({
    children,
    id,
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

    const createURL = (id: string, type: LegalType): string => {
        switch (type) {
            case 'cookie-policy':
                return `${IUBENDA_URL}/privacy-policy/${id}/cookie-policy`;
            case 'privacy-policy':
                return `${IUBENDA_URL}/privacy-policy/${id}`;
            default:
                return `${IUBENDA_URL}/${type}/${id}`;
        }
    };

    return (
        <a
            href={createURL(id, type)}
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
