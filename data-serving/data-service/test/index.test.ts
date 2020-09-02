import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import request from 'supertest';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    await mongoServer.stop();
});

describe('GET /random-url', () => {
    it('should return 404', (done) => {
        request(app).get('/random-url').expect(404, done);
    });
});

describe('GET /health', () => {
    it('should be healthy when connected', (done) => {
        request(app).get('/health').expect(200, done);
    });
});
