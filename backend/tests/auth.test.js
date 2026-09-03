require('./setup');
const request = require('supertest');
const app = require('../app');

const testUser = { email: 'testuser1@example.com', password: 'password123' };

describe('Auth routes', () => {
  test('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
  });

  test('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials and sets a cookie', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send(testUser);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('GET /me without a token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /me with a valid session returns the user', async () => {
    const agent = request.agent(app); // persists cookies across requests
    await agent.post('/api/auth/register').send(testUser);
    await agent.post('/api/auth/login').send(testUser);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  test('logout clears the session so /me returns 401 again', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(testUser);
    await agent.post('/api/auth/login').send(testUser);
    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /forgot-password with valid email returns 200 and sets reset fields', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetUrl).toBeDefined();

    const User = require('../models/User');
    const userInDb = await User.findOne({ email: testUser.email }).select('+resetPasswordToken +resetPasswordExpire');
    expect(userInDb.resetPasswordToken).toBeDefined();
    expect(userInDb.resetPasswordExpire).toBeDefined();
  });

  test('POST /forgot-password with unknown email returns 200 for security', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /forgot-password with invalid email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  test('POST /reset-password/:token with valid token resets password and logs in', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    const rawToken = forgotRes.body.resetUrl.split('/reset-password/')[1];
    expect(rawToken).toBeDefined();

    const newPassword = 'newSecretPassword123';
    const resetRes = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.headers['set-cookie']).toBeDefined();

    // Verify user can now log in with the new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: newPassword });
    expect(loginRes.status).toBe(200);

    // Verify old password fails
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(oldLoginRes.status).toBe(401);
  });

  test('POST /reset-password/:token with invalid or expired token returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/invalidtoken1234567890')
      .send({ password: 'validNewPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  test('POST /reset-password/:token with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/sometoken')
      .send({ password: '123' });

    expect(res.status).toBe(400);
  });
});