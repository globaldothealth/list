import app from '../../src/index';
import request from 'supertest';

describe('GET /', () => {
    it('should return 200 OK', (done) => {
        request(app).get('/').expect(200, done);
    });
});
