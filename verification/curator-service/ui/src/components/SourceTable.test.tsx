import '@testing-library/jest-dom/extend-expect';

import SourceTable from './SourceTable';
import React from 'react';
import axios from 'axios';
import { fireEvent, render } from '@testing-library/react';

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
  mockedAxios.get.mockClear();
  mockedAxios.delete.mockClear();
});

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
        parser: {
          awsLambdaArn: "lambda arn",
        },
        schedule: {
          awsRuleArn: "rule arn",
        },
        regexParsing: {
          fields: [{ name: "field name", regex: "field regexp" }]
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

it('can delete a row', async () => {
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
        parser: {
          awsLambdaArn: "lambda arn",
        },
        schedule: {
          awsRuleArn: "rule arn",
        },
        regexParsing: {
          fields: [{ name: "field name", regex: "field regexp" }]
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

  // Load table
  const { getByText, findByText, queryByText } = render(<SourceTable />)
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
  const row = await findByText(/abc123/);
  expect(row).toBeInTheDocument();

  // Delete source
  const axiosGetAfterDeleteResponse = {
    data: {
      sources: [],
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  const axiosDeleteResponse = {
    data: {
      source: sources[0],
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
  expect(mockedAxios.delete).toHaveBeenCalledWith('/api/sources/' + sources[0]._id);

  // Check table data is reloaded
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  const newRow = queryByText(/abc123/);
  expect(newRow).not.toBeInTheDocument();
})

it('can add a row', async () => {
  const axiosGetResponse = {
    data: {
      sources: [],
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

  const { getByText, findByText, queryByText } = render(<SourceTable />)

  // Check table is empty on load
  const row = queryByText(/abc123/);
  expect(row).not.toBeInTheDocument();

  // Add a row
  const newSource =
  {
    _id: 'abc123',
    name: 'source name',
    format: 'format',
    origin: {
      url: "origin url",
      license: "origin license",
    },
    automation: {
      parser: {
        awsLambdaArn: "lambda arn",
      },
      schedule: {
        awsRuleArn: "rule arn",
      }
    }
  };
  const axiosPostResponse = {
    data: {
      source: newSource,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  const axiosGetAfterAddResponse = {
    data: {
      sources: [newSource],
      total: 15,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.post.mockResolvedValueOnce(axiosPostResponse);
  mockedAxios.get.mockResolvedValueOnce(axiosGetAfterAddResponse);

  const addButton = getByText(/add_box/);
  fireEvent.click(addButton);
  const confirmButton = getByText(/check/);
  fireEvent.click(confirmButton);
  expect(mockedAxios.post).toHaveBeenCalledTimes(1);

  // Check table is reloaded
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  const newRow = await findByText(/abc123/);
  expect(newRow).toBeInTheDocument();
})
