import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import request from 'supertest';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

describe('GET /', () => {
    it('should return 200 OK', (done) => {
        request(app).get('/').expect(200, done);
    });
});
