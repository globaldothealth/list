import React from 'react';
import { render, screen, fireEvent } from '../util/test-utils';
import FiltersDialog from './index';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';

describe('<FiltersDialog />', () => {
    it('Should render properly', () => {
        render(
            <MemoryRouter>
                <FiltersDialog showModalAlert={false} closeAlert={jest.fn()} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
    });

    it('Should display an error when trying to enter future date', async () => {
        render(
            <MemoryRouter>
                <FiltersDialog showModalAlert={false} closeAlert={jest.fn()} />
            </MemoryRouter>,
        );

        const date = new Date();
        // Make sure the date is always in the future for the test
        date.setDate(date.getDate() + 1);
        const futureDate = format(date, 'yyyy-MM-dd');

        const dateBeforeInput = screen.getByLabelText(/Date confirmed before/i);
        const dateAfterInput = screen.getByLabelText(/Date confirmed after/i);

        fireEvent.change(dateBeforeInput, {
            target: { value: futureDate },
        });
        fireEvent.change(dateAfterInput, { target: { value: futureDate } });

        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

        expect(
            await screen.findByText(
                /Date confirmed before can't be a future date/i,
            ),
        ).toBeVisible();

        expect(
            await screen.findByText(
                /Date confirmed after can't be a future date/i,
            ),
        ).toBeVisible();
    });
});
