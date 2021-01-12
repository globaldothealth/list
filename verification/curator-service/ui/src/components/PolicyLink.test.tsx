import React from 'react';
import { render } from '@testing-library/react';

import PolicyLink from './PolicyLink';

test('renders privacy policy link', async () => {
    const { getByText } = render(
        <PolicyLink type="privacy-policy">Privacy policy</PolicyLink>,
    );

    const button = getByText('Privacy policy') as HTMLAnchorElement;

    expect(button.href).toContain('https://www.iubenda.com/privacy-policy');
});

test('renders cookie policy link', async () => {
    const { getByText } = render(
        <PolicyLink type="cookie-policy">Cookie policy</PolicyLink>,
    );

    const button = getByText('Cookie policy') as HTMLAnchorElement;

    expect(button.href).toContain('https://www.iubenda.com/privacy-policy');
    expect(button.href).toContain('cookie-policy');
});
