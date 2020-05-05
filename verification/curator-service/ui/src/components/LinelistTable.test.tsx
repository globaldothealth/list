import '@testing-library/jest-dom/extend-expect';

import LinelistTable from './LinelistTable';
import React from 'react';
import axios from 'axios';
import { fireEvent, render } from '@testing-library/react';

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
  mockedAxios.get.mockClear();
  mockedAxios.delete.mockClear();
});

it('loads and displays cases', async () => {
  const cases = [
    {
      _id: 'abc123',
      importedCase: {
        outcome: 'Recovered',
      },
      events: [
        {
          name: 'confirmed',
          dateRange: {
            start: new Date().toJSON(),
          },
        }
      ],
      notes: "some notes",
      source: {
        url: "http://foo.bar",
      }
    },
  ];
  const axiosResponse = {
    data: {
      cases: cases,
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosResponse);

  const { findByText } = render(<LinelistTable />)

  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=5&page=1');
  const items = await findByText(/abc123/);
  expect(items).toBeInTheDocument();
})

it('can delete a row', async () => {
  const cases = [
    {
      _id: 'abc123',
      importedCase: {
        outcome: 'Recovered',
      },
      events: [
        {
          name: 'confirmed',
          dateRange: {
            start: new Date().toJSON(),
          },
        }
      ],
      notes: "some notes",
      source: {
        url: "http://foo.bar",
      }
    },
  ];
  const axiosGetResponse = {
    data: {
      cases: cases,
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

  // Load table
  const { getByText, findByText, queryByText } = render(<LinelistTable />)
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=5&page=1');
  const row = await findByText(/abc123/);
  expect(row).toBeInTheDocument();

  // Delete case
  const axiosGetAfterDeleteResponse = {
    data: {
      cases: [],
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  const axiosDeleteResponse = {
    data: {
      case: cases[0],
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosGetAfterDeleteResponse);
  mockedAxios.delete.mockResolvedValueOnce(axiosDeleteResponse);

  const deleteButton = getByText(/delete_outline/);
  fireEvent.click(deleteButton);
  const confirmButton = getByText(/check/);
  fireEvent.click(confirmButton);
  expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
  expect(mockedAxios.delete).toHaveBeenCalledWith('/api/cases/' + cases[0]._id);

  // Check table data is reloaded
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  const newRow = await queryByText(/abc123/);
  expect(newRow).not.toBeInTheDocument();
})