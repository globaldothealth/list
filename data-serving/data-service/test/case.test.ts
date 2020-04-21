import request from 'supertest';
import app from '../src/index';

describe('GET', () => {
    it('one item should return 200 OK', (done) => {
        request(app).get('/api/cases/id').expect(200, done);
    });
    it('list should return 200 OK', (done) => {
        request(app).get('/api/cases').expect(200, done);
    });
});

describe('POST', () => {
    it('create without age should return 422', (done) => {
        request(app).post('/api/cases').expect(422, done);
    });
    it('create with age should return 200 OK with provided age', (done) => {
        request(app)
            .post('/api/cases')
            .send({ age: 26 })
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                expect(res.text).toMatch(/26/);
                return done();
            });
    });
});

describe('PUT', () => {
    it('update should return 200 OK', (done) => {
        request(app).put('/api/cases/id').expect(200, done);
    });
});

describe('DELETE', () => {
    it('should return 200 OK', (done) => {
        request(app).delete('/api/cases/id').expect(200, done);
    });
});
