import '@testing-library/jest-dom/extend-expect';

import { MemoryRouter } from 'react-router-dom';
import UploadsTable from './UploadsTable';
import axios from 'axios';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme/theme';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

it('loads and displays uploads', async () => {
    const sourceName = 'source_name';
    const sourceUrl = 'source url';
    const uploadId = 'abc123';
    const status = 'IN_PROGRESS';
    const numCreated = 4;
    const numUpdated = 6;
    const numError = 1;
    const uploads = [
        {
            sourceUrl: sourceUrl,
            sourceName: sourceName,
            upload: {
                _id: uploadId,
                status: status,
                summary: { numCreated, numUpdated, numError },
            },
        },
    ];
    const axiosResponse = {
        data: {
            uploads: uploads,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText } = render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>
                <UploadsTable />
            </ThemeProvider>
        </MemoryRouter>,
    );

    // Verify backend calls.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/uploads?limit=10&page=1&changes_only=false',
    );

    // Verify display content.
    expect(await findByText(new RegExp(sourceUrl))).toBeInTheDocument();
    expect(await findByText(new RegExp(sourceName))).toBeInTheDocument();
    expect(await findByText(new RegExp(uploadId))).toBeInTheDocument();
    expect(await findByText(new RegExp(status))).toBeInTheDocument();
    expect(await findByText(`${numCreated}`)).toBeInTheDocument();
    expect(await findByText(`${numUpdated}`)).toBeInTheDocument();
    expect(await findByText(`${numError}`)).toBeInTheDocument();
});

it('API errors are displayed', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>
                <UploadsTable />
            </ThemeProvider>
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/uploads?limit=10&page=1&changes_only=false',
    );

    expect(await findByText('Error: Request failed')).toBeInTheDocument();
});
