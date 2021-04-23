import * as fullCase from './fixtures/fullCase.json';

import { fireEvent, render } from '@testing-library/react';

import React from 'react';
import { Router } from 'react-router-dom';
import ViewCase from './ViewCase';
import axios from 'axios';
import { createMemoryHistory } from 'history';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

it('loads and displays case', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText, getByText } = render(
        <ViewCase
            id="abc123"
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    // Case data.
    expect(
        await findByText(/Case 5ef8e943dfe6e00030892d58/),
    ).toBeInTheDocument();
    expect(
        getByText(
            'https://www.colorado.gov/pacific/cdphe/news/10-new-presumptive-positive-cases-colorado-cdphe-confirms-limited-community-spread-covid-19',
        ),
    ).toBeInTheDocument();
    expect(getByText('5ea86423bae6982635d2e1f8')).toBeInTheDocument();
    expect(getByText('twitter.com/a-tweet')).toHaveAttribute(
        'href',
        'https://twitter.com/a-tweet',
    );
    expect(getByText('news.org/an-article')).toHaveAttribute(
        'href',
        'https://news.org/an-article',
    );
    expect(getByText('entryId')).toBeInTheDocument();
    expect(getByText('abc123')).toBeInTheDocument();
    expect(getByText('2020-01-20')).toBeInTheDocument();
    expect(getByText('xyz789')).toBeInTheDocument();
    expect(getByText('2020-04-13')).toBeInTheDocument();
    expect(
        getByText('Contact of a confirmed case at work.'),
    ).toBeInTheDocument();
    // Demographics.
    expect(getByText('Non-binary/Third gender')).toBeInTheDocument();
    expect(getByText('50-59')).toBeInTheDocument();
    expect(getByText('Horse breeder')).toBeInTheDocument();
    expect(getByText('Swedish')).toBeInTheDocument();
    expect(getByText('Asian')).toBeInTheDocument();
    // Location.
    expect(getByText('France')).toBeInTheDocument();
    expect(getByText('Île-de-F')).toBeInTheDocument();
    expect(getByText('Wuhan')).toBeInTheDocument();
    expect(getByText('Paris')).toBeInTheDocument();
    expect(getByText('Admin2')).toBeInTheDocument();
    expect(getByText(/2.3522/)).toBeInTheDocument();
    expect(getByText(/48.85/)).toBeInTheDocument();
    // Events.
    expect(getByText('2020-01-01')).toBeInTheDocument();
    expect(getByText('2020-01-02')).toBeInTheDocument();
    expect(getByText('2020-01-03')).toBeInTheDocument();
    expect(getByText('2020-01-04 - 2020-01-05')).toBeInTheDocument();
    expect(getByText('2020-01-06')).toBeInTheDocument();
    expect(getByText('Recovered')).toBeInTheDocument();
    expect(getByText('PCR test')).toBeInTheDocument();
    // Symptoms.
    expect(getByText(/Symptomatic/)).toBeInTheDocument();
    expect(getByText(/Severe pneumonia/)).toBeInTheDocument();
    expect(getByText(/Dyspnea/)).toBeInTheDocument();
    expect(getByText(/Weakness/)).toBeInTheDocument();
    // Preexisting conditions
    expect(getByText(/Hypertension/)).toBeInTheDocument();
    expect(getByText(/Type 2 diabetes/)).toBeInTheDocument();
    expect(getByText(/Coronary heart disease/)).toBeInTheDocument();
    expect(getByText(/Lung cancer/)).toBeInTheDocument();
    // Transmission.
    expect(getByText(/Vector borne/)).toBeInTheDocument();
    expect(getByText(/Gym/)).toBeInTheDocument();
    expect(getByText(/bbf8e943dfe6e00030892dcc/)).toHaveAttribute(
        'href',
        '/cases/view/bbf8e943dfe6e00030892dcc',
    );
    expect(getByText(/aaf8e943dfe6e00030892dee/)).toHaveAttribute(
        'href',
        '/cases/view/aaf8e943dfe6e00030892dee',
    );

    // Travel history.
    expect(getByText('2020-02-10 - 2020-02-17')).toBeInTheDocument();
    expect(getByText('United States')).toBeInTheDocument();
    expect(getByText('New York')).toBeInTheDocument();
    expect(getByText('Kings County')).toBeInTheDocument();
    expect(getByText('Brooklyn')).toBeInTheDocument();
    expect(getByText('Kings Hospital Center')).toBeInTheDocument();
    expect(getByText('Point')).toBeInTheDocument();
    expect(getByText(/40.68/)).toBeInTheDocument();
    expect(getByText(/73.97/)).toBeInTheDocument();
    expect(getByText('Plane')).toBeInTheDocument();
    expect(getByText('Family')).toBeInTheDocument();
    // Pathogens and genome.
    expect(getByText(/Pneumonia \(104\)/)).toBeInTheDocument();
    expect(getByText('2019-12-30')).toBeInTheDocument();
    expect(
        getByText('https://www.ncbi.nlm.nih.gov/nuccore/NC_045512'),
    ).toBeInTheDocument();
    expect(getByText('NC_045512.2')).toBeInTheDocument();
    expect(
        getByText(
            'Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome',
        ),
    ).toBeInTheDocument();
    expect(getByText('33000')).toBeInTheDocument();
});

it('can go to the edit page', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const history = createMemoryHistory();
    const { findByText } = render(
        <Router history={history}>
            <ViewCase
                id="5ef8e943dfe6e00030892d58"
                enableEdit={true}
                onModalClose={(): void => {
                    return;
                }}
            />
        </Router>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/5ef8e943dfe6e00030892d58',
    );
    fireEvent.click(await findByText('Edit'));
    expect(history.location.pathname).toBe(
        '/cases/edit/5ef8e943dfe6e00030892d58',
    );
});

it('does not show the edit button when not enabled', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { queryByText, findByText } = render(
        <ViewCase
            id="abc123"
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(
        await findByText(/Case 5ef8e943dfe6e00030892d58/),
    ).toBeInTheDocument();
    expect(queryByText('Edit')).toBeNull();
});

it('displays API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(
        <ViewCase
            id="abc123"
            onModalClose={(): void => {
                return;
            }}
        />,
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Request failed/)).toBeInTheDocument();
});
