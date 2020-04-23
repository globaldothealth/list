import request from 'supertest';
import app from '../src/index';
import axios, { AxiosResponse } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GET /', () => {
    it('should return 200 OK', (done) => {
        const cases = [
            {
                _id: 'abc123',
                outcome: 'recovered',
                date: '2020-04-21',
            },
        ];
        const axiosResponse = {
            data: cases,
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValue(axiosResponse);

        request(app).get('/').expect(200, done);
    });
});
