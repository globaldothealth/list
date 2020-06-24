import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import request from 'supertest';

jest.mock('../../src/geocoding/mapbox');

let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

describe('FakeGeocoder', () => {
    it('can seed geocodes', (done) => {
        request(app)
            .post('/api/geocode/seed')
            .send({
                administrativeAreaLevel1: 'Rhône',
                country: 'France',
                geometry: { latitude: 45.75889, longitude: 4.84139 },
                name: 'Lyon',
            })
            .expect(200, done);
    });
    it('can clear geocodes', (done) => {
        request(app).post('/api/geocode/clear').expect(200, done);
    });
});
