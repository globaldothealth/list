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

test('redirects to home on click', () => {
    const history = createMemoryHistory()
    const { getByTestId } = render(
        <Router history={history}>
            <EpidNavbar />
        </Router>);
    fireEvent.click(getByTestId('home-btn'))
    expect(history.location.pathname).toBe("/");
});  