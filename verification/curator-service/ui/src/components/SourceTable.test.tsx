import '@testing-library/jest-dom/extend-expect';

import SourceTable from './SourceTable';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>;

it('loads and displays sources', async () => {
  const sources = [
    {
      _id: 'abc123',
      name: 'source name',
      format: 'format',
      origin: {
        url: "origin url",
        license: "origin license",
      },
      automation: {
        name: 'automation name',
        tag: 'automation tag',
        active: true,
        scheduleExpression: "automation schedule",
        parsing: {
          fields: [{ name: "field name", regexp: "field regexp" }]
        }
      }
    },
  ];
  const axiosResponse = {
    data: {
      sources: sources,
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosResponse);

  const { findByText } = render(<SourceTable />)

  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
  const items = await findByText(/abc123/);
  expect(items).toBeInTheDocument();
})