import React from 'react';
import { render } from '@testing-library/react';
import ParsersAutocomplete from './ParsersAutocomplete';

it('renders the autocomplete component', async () => {
    const { getByDisplayValue } = render(
        <ParsersAutocomplete defaultValue="foo" onChange={console.log} />,
    );
    const val = getByDisplayValue('foo');
    expect(val).toBeInTheDocument();
});
