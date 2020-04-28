import EpidNavbar from './EpidNavbar';
import React from 'react';
import { render } from '@testing-library/react';

test('renders epid brand', () => {
    const { getByText } = render(<EpidNavbar />);
    const brandName = getByText(/epid/i);
    expect(brandName).toBeInTheDocument();
});  