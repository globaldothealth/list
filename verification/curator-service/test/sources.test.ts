import request from 'supertest';
import app from '../src/index';

describe('GET /', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).get('/api').expect(501, done);
    });
});

describe('GET', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).get('/api/42').expect(501, done);
    });
});

describe('PUT', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).put('/api/id').expect(501, done);
    });
});

describe('POST', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).post('/api').expect(501, done);
    });
});

describe('DELETE', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).delete('/api/42').expect(501, done);
    });
});
