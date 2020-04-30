import { MemoryRouter, Router } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';

import EpidNavbar from './EpidNavbar';
import React from 'react';
import { createMemoryHistory } from 'history';

test('renders epid brand', () => {
    const { getByText } = render(
        <MemoryRouter>
            <EpidNavbar />
        </MemoryRouter>);
    const brandName = getByText(/epid/i);
    expect(brandName).toBeInTheDocument();
});

test('redirects to new case on click', () => {
    const history = createMemoryHistory()
    const { getByText } = render(
        <Router history={history}>
            <EpidNavbar />
        </Router>);
    fireEvent.click(getByText(/Add a new case/))
    expect(history.location.pathname).toBe("/new");
});  