import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';

import React from 'react';
import SourceTable from './SourceTable';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.put.mockClear();
});

it('loads and displays sources', async () => {
    const sourceId = 'abc123';
    const sourceName = 'source_name';
    const originUrl = 'origin url';
    const format = 'JSON';
    const license = 'MIT';
    const recipients = ['foo@bar.com', 'bar@baz.com'];
    const awsLambdaArn = 'arn:aws:lambda:a:b:functions:c';
    const awsRuleArn = 'arn:aws:events:a:b:rule/c';
    const awsScheduleExpression = 'rate(2 hours)';
    const sources = [
        {
            _id: sourceId,
            name: sourceName,
            format: format,
            origin: {
                url: originUrl,
                license: license,
            },
            automation: {
                parser: {
                    awsLambdaArn: awsLambdaArn,
                },
                schedule: {
                    awsRuleArn: awsRuleArn,
                    awsScheduleExpression: awsScheduleExpression,
                },
            },
            dateFilter: {
                numDaysBeforeToday: 666,
                op: 'EQ',
            },
            notificationRecipients: recipients,
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

    const { findByText } = render(<SourceTable />);

    // Verify backend calls.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );

    // Verify display content.
    expect(await findByText(new RegExp(sourceId))).toBeInTheDocument();
    expect(await findByText(new RegExp(sourceName))).toBeInTheDocument();
    expect(await findByText(new RegExp(originUrl))).toBeInTheDocument();
    expect(await findByText(new RegExp(format))).toBeInTheDocument();
    expect(await findByText(new RegExp(license))).toBeInTheDocument();
    expect(
        await findByText(new RegExp(recipients.join('.*'))),
    ).toBeInTheDocument();
    expect(await findByText(new RegExp(awsLambdaArn))).toBeInTheDocument();
    expect(await findByText(new RegExp(awsRuleArn))).toBeInTheDocument();
    expect(
        await findByText('Only parse data from 666 day(s) ago'),
    ).toBeInTheDocument();
    expect(
        await findByText(
            new RegExp(awsScheduleExpression.replace(/(?=[()])/g, '\\')),
        ),
    ).toBeInTheDocument();
});

it('API errors are displayed', async () => {
    // TODO: Write/load json files for this/LLT test.
    const sources = [
        {
            _id: 'abc123',
            name: 'source_name',
            format: 'JSON',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'arn:aws:lambda:a:b:functions:c',
                },
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(2 hours)',
                },
            },
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

    const { getByText, findByText } = render(<SourceTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );
    const row = await findByText(/abc123/);
    expect(row).toBeInTheDocument();

    // Throw error on delete request.
    mockedAxios.delete.mockRejectedValueOnce(new Error('Request failed'));

    const deleteButton = getByText(/delete_outline/);
    fireEvent.click(deleteButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

    const error = await findByText('Error: Request failed');
    expect(error).toBeInTheDocument();
});

it('can delete a row', async () => {
    const sources = [
        {
            _id: 'abc123',
            name: 'source_name',
            format: 'JSON',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'arn:aws:lambda:a:b:functions:c',
                },
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(2 hours)',
                },
            },
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
    const { getByText, findByText } = render(<SourceTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );
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
    expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/sources/' + sources[0]._id,
    );

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const noRec = await findByText(/No records to display/);
    expect(noRec).toBeInTheDocument();
});

it('can edit a row', async () => {
    const sources = [
        {
            _id: 'abc123',
            name: 'source_name',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'rule arn',
                },
            },
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
    const { getByText, findByText, queryByText } = render(<SourceTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );
    const row = await findByText('origin url');
    expect(row).toBeInTheDocument();

    // Edit sources
    const editedSources = [
        {
            _id: 'abc123',
            name: 'source_name',
            format: 'format',
            origin: {
                url: 'new source url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'rule arn',
                },
            },
        },
    ];
    const axiosGetAfterEditResponse = {
        data: {
            sources: editedSources,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosEditResponse = {
        data: {
            source: editedSources[0],
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.put.mockResolvedValueOnce(axiosEditResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const editedRow = await findByText('new source url');
    expect(editedRow).toBeInTheDocument();
    const oldRow = queryByText('origin url');
    expect(oldRow).not.toBeInTheDocument();
});

it.only('can edit the boolean fields in a row', async () => {
    const sources = [
        {
            _id: 'abc123',
            name: 'source_name',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'rule arn',
                },
            },
            excludeFromLineList: false,
            hasStableIdentifiers: false,
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
    const { getByText, findByText, queryByText } = render(<SourceTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );
    const row = await findByText('origin url');
    expect(row).toBeInTheDocument();

    // Edit sources
    const editedSources = [
        {
            _id: 'abc123',
            name: 'source_name',
            format: 'format',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'rule arn',
                },
            },
            excludeFromLineList: true,
            hasStableIdentifiers: true,
        },
    ];
    const axiosGetAfterEditResponse = {
        data: {
            sources: editedSources,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosEditResponse = {
        data: {
            source: editedSources[0],
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.put.mockResolvedValueOnce(axiosEditResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const editedRow = await findByText('origin url');
    expect(editedRow).toBeInTheDocument();
});

it('can edit a row even if sending notifications on edit fails', async () => {
    const sources = [
        {
            _id: 'abc123',
            name: 'source_name',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'origin rule arn',
                },
            },
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
    const { getByText, findByText, queryByText } = render(<SourceTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sources/?limit=10&page=1',
    );
    const row = await findByText('origin url');
    expect(row).toBeInTheDocument();

    // Edit sources
    const editedSources = [
        {
            _id: 'abc123',
            name: 'source_name',
            format: 'format',
            origin: {
                url: 'origin url',
                license: 'origin license',
            },
            automation: {
                parser: {
                    awsLambdaArn: 'lambda arn',
                },
                schedule: {
                    awsRuleArn: 'new rule arn',
                },
            },
        },
    ];
    const axiosGetAfterEditResponse = {
        data: {
            sources: editedSources,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosEditResponse = {
        data: {
            source: editedSources[0],
            name: 'NotificationSendError',
        },
        status: 500,
        statusText: 'error',
        config: {},
        headers: {},
    };
    mockedAxios.put.mockResolvedValueOnce(axiosEditResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const editedRow = await findByText('new rule arn');
    expect(editedRow).toBeInTheDocument();
    const oldRow = queryByText('origin rule arn');
    expect(oldRow).not.toBeInTheDocument();
});
