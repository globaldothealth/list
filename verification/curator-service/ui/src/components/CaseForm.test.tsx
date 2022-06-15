import { fireEvent, render, waitFor, screen } from '@testing-library/react';

import CaseForm from './CaseForm';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme/theme';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

beforeEach(() => {
    const axiosSourcesResponse = {
        data: { sources: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);
    const axiosSymptomsResponse = {
        data: { symptoms: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosSymptomsResponse);
    const axiosPlacesOfTransmissionResponse = {
        data: { placesOfTransmission: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosPlacesOfTransmissionResponse);
    const axiosOccupationResponse = {
        data: { occupations: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosOccupationResponse);
});

afterEach(() => {
    jest.clearAllMocks();
});

it('renders form', async () => {
    render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>
                <CaseForm
                    onModalClose={(): void => {
                        return;
                    }}
                    diseaseName="COVID-19"
                />
            </ThemeProvider>
        </MemoryRouter>,
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(4));
    expect(
        screen.getByText('Enter the details for a new case'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Submit case/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Demographics/i)).toHaveLength(1);
    expect(screen.getAllByText(/Location/i)).toHaveLength(3);
    expect(screen.getAllByText(/Events/i)).toHaveLength(1);
    expect(screen.getByTestId('caseReference')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nationalities/i)).toBeInTheDocument();
    expect(screen.getByText(/Variant of Concern/i)).toBeInTheDocument();
});

test('Check location error message to become red on submit', () => {
    const { getByText } = render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>
                <CaseForm
                    onModalClose={(): void => {
                        return;
                    }}
                    diseaseName="COVID-19"
                />
            </ThemeProvider>
        </MemoryRouter>,
    );

    const mandatoryLocationMessage = getByText('A location must be provided');
    const submittButton = getByText(/Submit case/i);
    fireEvent.click(submittButton);
    expect(mandatoryLocationMessage).toHaveClass('Mui-error');
});

it('can add and remove genome sequencing sections', async () => {
    const { queryByTestId, getByTestId, getByText } = render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>
                <CaseForm
                    onModalClose={(): void => {
                        return;
                    }}
                    diseaseName="COVID-19"
                />
            </ThemeProvider>
        </MemoryRouter>,
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(4));

    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
    await waitFor(() => {
        fireEvent.click(getByText(/Add genome sequence/));
    });
    expect(queryByTestId('genome-sequence-section')).toBeInTheDocument();
    await waitFor(() => {
        fireEvent.click(getByTestId('remove-genome-sequence-button'));
    });
    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
});
