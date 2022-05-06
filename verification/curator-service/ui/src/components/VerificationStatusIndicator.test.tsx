import React from 'react';
import { VerificationStatus } from '../api/models/Case';
import VerificationStatusIndicator from './VerificationStatusIndicator';
import { render } from '@testing-library/react';

it('displays verified svg for verified case', async () => {
    const { getByTestId } = render(
        <VerificationStatusIndicator status={VerificationStatus.Verified} />,
    );
    const svg = getByTestId('verified-svg');
    expect(svg).toBeInTheDocument();
});

it('displays unverified svg for unverified case', async () => {
    const { getByTestId } = render(
        <VerificationStatusIndicator status={VerificationStatus.Unverified} />,
    );
    const svg = getByTestId('unverified-svg');
    expect(svg).toBeInTheDocument();
});
