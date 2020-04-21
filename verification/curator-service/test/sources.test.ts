import request from 'supertest';
import app from '../src/index';

describe('GET', () => {
    it('list should return 501 Not Implemented', (done) => {
        request(app).get('/api/sources').expect(501, done);
    });
    it('one item should return 501 Not Implemented', (done) => {
        request(app).get('/api/sources/42').expect(501, done);
    });
});

describe('PUT', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).put('/api/sources/id').expect(501, done);
    });
});

describe('POST', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).post('/api/sources/').expect(501, done);
    });
});

describe('DELETE', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).delete('/api/sources/42').expect(501, done);
    });
});
