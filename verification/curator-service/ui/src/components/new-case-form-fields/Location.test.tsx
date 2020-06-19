import { render, screen } from '@testing-library/react';

import Location from './Location';
import React from 'react';

test('shows location when passed location information', async () => {
    render(
        <Location
            location={{
                geoResolution: 'place',
                country: 'United States',
                administrativeAreaLevel1: 'Hillsborough County',
                administrativeAreaLevel2: '',
                administrativeAreaLevel3: 'Some city',
                geometry: {
                    latitude: 80.45,
                    longitude: 27.9379,
                },
                name: 'some name',
                place: '',
            }}
        />,
    );
    expect(screen.getByText(/place/i)).toBeInTheDocument();
    expect(screen.getByText(/united States/i)).toBeInTheDocument();
    expect(screen.getByText(/Hillsborough County/i)).toBeInTheDocument();
    expect(screen.getByText(/Some city/i)).toBeInTheDocument();
    expect(screen.getByText(/place/i)).toBeInTheDocument();
    expect(screen.getByText(/80.4500/i)).toBeInTheDocument();
    expect(screen.getByText(/27.9379/i)).toBeInTheDocument();
    expect(screen.getByText(/N\/A/i)).toBeInTheDocument();
});

test('shows empty defaults when location undefined', async () => {
    render(<Location location={undefined} />);
    expect(screen.getByText(/Country/i)).toBeInTheDocument();
});
