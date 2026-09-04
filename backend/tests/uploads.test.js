require('./setup');
const request = require('supertest');
const app = require('../app');

describe('Uploads API', () => {
  let authCookie;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'uploader@example.com', password: 'password123' });
    authCookie = res.headers['set-cookie'];
  });

  it('rejects uploads without authentication', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('image', Buffer.from('fake-image-bytes'), 'test.png');
    expect(res.status).toBe(401);
  });

  it('successfully uploads an image, saves to MongoDB, and serves via GET /uploads/:filename', async () => {
    const fakeImageBuffer = Buffer.from('fake-png-image-content-for-test');

    const uploadRes = await request(app)
      .post('/api/uploads')
      .set('Cookie', authCookie)
      .attach('image', fakeImageBuffer, { filename: 'avatar.png', contentType: 'image/png' });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.url).toMatch(/^\/uploads\/image-/);
    expect(uploadRes.body.filename).toBeDefined();

    // Now retrieve the image using the returned URL
    const getRes = await request(app)
      .get(uploadRes.body.url);

    expect(getRes.status).toBe(200);
    expect(getRes.headers['content-type']).toContain('image/png');
    expect(getRes.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(getRes.body).toEqual(fakeImageBuffer);
  });

  it('returns 404 for non-existent image', async () => {
    const res = await request(app).get('/uploads/non-existent-image-12345.png');
    expect(res.status).toBe(404);
  });
});
