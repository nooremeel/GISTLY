require('./setup');
const request = require('supertest');
const app = require('../app');

jest.mock('../services/aiService', () => ({
  generateSummaryAndTags: jest.fn().mockResolvedValue({
    summary: 'Mocked summary text.',
    tags: ['mocked-tag'],
  }),
}));
const { generateSummaryAndTags } = require('../services/aiService');

async function registerAndLogin(agent, email) {
  const user = { email, password: 'password123' };
  await agent.post('/api/auth/register').send(user);
  await agent.post('/api/auth/login').send(user);
}

describe('Bookmark routes', () => {
  test('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(401);
  });

  test('creates a bookmark using a mocked AI response, merges tags', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, 'owner@example.com');

    const res = await agent
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', tags: ['user-tag'] });

    expect(res.status).toBe(201);
    expect(generateSummaryAndTags).toHaveBeenCalled();
    expect(res.body.summary).toBe('Mocked summary text.');
    expect(res.body.tags).toEqual(expect.arrayContaining(['Mocked-tag', 'User-tag']));
  });

  test('User B cannot GET/PUT/DELETE a bookmark owned by User A', async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    await registerAndLogin(agentA, 'usera@example.com');
    await registerAndLogin(agentB, 'userb@example.com');

    const created = await agentA.post('/api/bookmarks').send({ url: 'https://example.com' });
    const bookmarkId = created.body._id;

    expect((await agentB.get(`/api/bookmarks/${bookmarkId}`)).status).toBe(404);
    expect((await agentB.put(`/api/bookmarks/${bookmarkId}`).send({ note: 'hijacked' })).status).toBe(404);
    expect((await agentB.delete(`/api/bookmarks/${bookmarkId}`)).status).toBe(404);
  });

test('grouped and by-tag routes are scoped per user', async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    await registerAndLogin(agentA, 'usera2@example.com');
    await registerAndLogin(agentB, 'userb2@example.com');

    await agentA.post('/api/bookmarks').send({ url: 'https://example.com', tags: ['shared-tag'] });

    const groupedB = await agentB.get('/api/bookmarks/grouped');
    expect(groupedB.status).toBe(200);
    expect(groupedB.body.data).toEqual([]);

    const byTagB = await agentB.get('/api/bookmarks/tags/shared-tag');
    expect(byTagB.status).toBe(200);
    expect(byTagB.body.data).toEqual([]);
  });
});