import request from 'supertest';
import app from '../src/index';
import axios, { AxiosResponse } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GET /', () => {
    it('should return 200 OK with latest date', (done) => {
        const cases = [
            {
                _id: 'abc123',
                outcome: 'recovered',
                date: new Date('2020-04-21').toJSON(),
            },
            {
                _id: 'def456',
                outcome: 'recovered',
                date: new Date('2020-04-22').toJSON(),
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

        request(app)
            .get('/')
            .expect(200, /2020-04-22/, done);
    });
});
