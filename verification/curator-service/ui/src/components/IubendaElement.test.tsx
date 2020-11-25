import React from 'react';
import { render } from '@testing-library/react';

import IubendaElement from './IubendaElement';

test('renders privacy policy link', async () => {
    const { getByText } = render(
        <IubendaElement type="privacy-policy">Privacy policy</IubendaElement>,
    );

    const button = getByText('Privacy policy') as HTMLAnchorElement;

    expect(button.href).toContain('https://www.iubenda.com/privacy-policy');
});

test('renders cookie policy link', async () => {
    const { getByText } = render(
        <IubendaElement type="cookie-policy">Cookie policy</IubendaElement>,
    );

    const button = getByText('Cookie policy') as HTMLAnchorElement;

    expect(button.href).toContain('https://www.iubenda.com/privacy-policy');
    expect(button.href).toContain('cookie-policy');
});
