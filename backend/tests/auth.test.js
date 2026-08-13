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
});