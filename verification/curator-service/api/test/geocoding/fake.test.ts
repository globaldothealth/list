import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import request from 'supertest';

const mockInitialize = jest.fn().mockResolvedValue({});
jest.mock('../../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: mockInitialize };
    });
});

jest.mock('../../src/geocoding/mapbox');

let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

describe('FakeGeocoder', () => {
    it('can seed geocodes', async () => {
        return request(app)
            .post('/api/geocode/seed')
            .send({
                administrativeAreaLevel1: 'Rhône',
                country: 'France',
                geometry: { latitude: 45.75889, longitude: 4.84139 },
                name: 'Lyon',
            })
            .expect(200);
    });
    it('can clear geocodes', () => {
        return request(app).post('/api/geocode/clear').expect(200);
    });
});
