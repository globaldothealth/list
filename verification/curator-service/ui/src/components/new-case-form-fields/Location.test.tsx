import { render, screen } from '@testing-library/react';

import Location from './Location';
import React from 'react';

test('shows location when passed location information', async () => {
    render(
        <Location
            location={{
                type: 'place',
                country: 'United States',
                adminArea1: 'Hillsborough County',
                adminArea3: 'Some city',
                latitude: 80.45,
                longitude: 27.9379,
            }}
        />,
    );
    expect(screen.getByText(/place/i)).toBeInTheDocument();
    expect(screen.getByText(/united States/i)).toBeInTheDocument();
    expect(screen.getByText(/Hillsborough County/i)).toBeInTheDocument();
    expect(screen.getByText(/Some city/i)).toBeInTheDocument();
    expect(screen.getByText(/80.4500/i)).toBeInTheDocument();
    expect(screen.getByText(/27.9379/i)).toBeInTheDocument();
    expect(screen.getByText(/N\/A/i)).toBeInTheDocument();
});

test('shows empty defaults when location undefined', async () => {
    render(<Location location={undefined} />);
    expect(screen.getByText(/Country/i)).toBeInTheDocument();
});
