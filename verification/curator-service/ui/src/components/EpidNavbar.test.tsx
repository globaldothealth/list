import React from 'react';
import { render } from '@testing-library/react';
import EpidNavbar from './EpidNavbar';

test('renders epid brand', () => {
    const { getByText } = render(<EpidNavbar />);
    const brandName = getByText(/epid/i);
    expect(brandName).toBeInTheDocument();
});