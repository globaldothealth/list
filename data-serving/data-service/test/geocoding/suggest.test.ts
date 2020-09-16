import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import request from 'supertest';

let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

describe('Geocodes', () => {
    it('are suggested', async () => {
        const lyon = {
            administrativeAreaLevel1: 'Rhône',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'Lyon',
        };
        await request(app).post('/api/geocode/seed').send(lyon).expect(200);
        return request(app)
            .get('/api/geocode/suggest')
            .query({ q: 'Lyon' })
            .expect(200, [lyon]);
    });
});
