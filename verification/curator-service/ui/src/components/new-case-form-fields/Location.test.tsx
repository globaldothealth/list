import { Form, Formik } from 'formik';

import { Location as Loc } from '../Case';
import Location from './Location';
import React from 'react';
import { render } from '@testing-library/react';

test('shows location when passed location information', async () => {
    const loc: Loc = {
        geoResolution: 'Admin3',
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
    };
    const { getByDisplayValue } = render(
        <Formik
            initialValues={{ location: loc }}
            // onSubmit just here to appease tslint.
            onSubmit={async (values): Promise<void> => {
                return;
            }}
        >
            <Form>
                <Location locationPath="location" geometry={loc.geometry} />
            </Form>
        </Formik>,
    );
    expect(getByDisplayValue(/Admin3/i)).toBeInTheDocument();
    expect(getByDisplayValue(/united States/i)).toBeInTheDocument();
    expect(getByDisplayValue(/Hillsborough County/i)).toBeInTheDocument();
    expect(getByDisplayValue(/Some city/i)).toBeInTheDocument();
    expect(getByDisplayValue(/80.45/i)).toBeInTheDocument();
    expect(getByDisplayValue(/27.9379/i)).toBeInTheDocument();
});
