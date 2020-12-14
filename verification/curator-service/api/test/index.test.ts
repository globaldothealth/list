import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import request from 'supertest';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: jest.fn().mockResolvedValue({}) };
    });
});

let mongoServer: MongoMemoryServer;
beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

beforeEach(() => {
    jest.clearAllMocks();
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
