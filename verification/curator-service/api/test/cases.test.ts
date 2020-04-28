import app from '../src/index';
import axios from 'axios';
import request from 'supertest';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GET', () => {
    it('list should return 200 OK case date json', async () => {
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

        const res = await request(app)
            .get('/api/cases')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8');

        expect(res.body.length).toBe(2);
        expect(res.body).toContainEqual(cases[0]);
        expect(res.body).toContainEqual(cases[1]);
    });
});
