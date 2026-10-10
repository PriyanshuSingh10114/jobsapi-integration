const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../../src/app');

describe('Dice Native Module Integration Endpoints', () => {
  let server;
  let baseUrl;

  test('setup test server', (t, done) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  test('GET /api/dice/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/dice/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'Dice Native Node.js Engine');
  });

  test('GET /api/dice/dashboard/stats returns queue and automation counters', async () => {
    const res = await fetch(`${baseUrl}/api/dice/dashboard/stats`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.hasOwnProperty('resumes_count'));
    assert.ok(data.hasOwnProperty('search_profiles_count'));
    assert.ok(data.hasOwnProperty('queued_count'));
  });

  test('GET /api/dice/settings/dice-status returns connection state', async () => {
    const res = await fetch(`${baseUrl}/api/dice/settings/dice-status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.hasOwnProperty('is_connected'));
  });

  test('GET /api/dice/resumes returns list array', async () => {
    const res = await fetch(`${baseUrl}/api/dice/resumes`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  test('GET /api/dice/search-profiles returns profiles array', async () => {
    const res = await fetch(`${baseUrl}/api/dice/search-profiles`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  test('GET /api/dice/review-queue returns review items array', async () => {
    const res = await fetch(`${baseUrl}/api/dice/review-queue`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  test('GET /api/dice/applications/queue returns queue array', async () => {
    const res = await fetch(`${baseUrl}/api/dice/applications/queue`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  test('POST /api/dice/jobs/match-direct matches jobs by skills', async () => {
    const res = await fetch(`${baseUrl}/api/dice/jobs/match-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_skills: ['react', 'node.js'] })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.hasOwnProperty('score'));
    assert.ok(Array.isArray(data.matched_skills));
  });

  test('teardown server', (t, done) => {
    server.close(done);
  });
});
