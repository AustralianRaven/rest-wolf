const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { stringifyEnvironment } = require('@usebruno/filestore');
const { runCli } = require('./helpers/run-cli');

jest.setTimeout(30000);

const writeFixtureFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

describe('CLI run — auth inherited from the environment', () => {
  let server;
  let receivedHeaders;
  let port;
  let tmpDir;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      receivedHeaders = req.headers;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bru-cli-env-auth-'));
    receivedHeaders = undefined;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  const stageCollection = (environmentAuth) => {
    writeFixtureFile(
      path.join(tmpDir, 'bruno.json'),
      JSON.stringify({ version: '1', name: 'env-auth', type: 'collection' }, null, 2) + '\n'
    );
    writeFixtureFile(path.join(tmpDir, 'collection.bru'), 'meta {\n  name: env-auth\n  seq: 1\n}\n');
    writeFixtureFile(path.join(tmpDir, 'req.bru'), `meta {
  name: req
  type: http
  seq: 1
}

get {
  url: http://127.0.0.1:${port}/ping
  body: none
  auth: inherit-environment
}
`);
    const environment = {
      name: 'Dev',
      variables: [{ uid: 'tokenVariableUid000001', name: 'TOKEN', value: 'shared-token', type: 'text', enabled: true, secret: false }],
      auth: environmentAuth
    };
    writeFixtureFile(path.join(tmpDir, 'environments', 'Dev.bru'), stringifyEnvironment(environment, { format: 'bru' }));
  };

  it('sends the copy of a saved auth stored on the selected environment, with no saved auths on this machine', async () => {
    stageCollection({
      mode: 'bearer',
      bearer: { token: '{{TOKEN}}' },
      namedAuthModeUid: 'saved-auth-from-another-machine',
      namedAuthModeName: 'KC V2'
    });

    const { code } = await runCli(['run', 'req.bru', '--env', 'Dev', '--noproxy'], tmpDir);

    expect(code).toBe(0);
    expect(receivedHeaders.authorization).toBe('Bearer shared-token');
  });

  it('sends no auth when no environment is selected', async () => {
    stageCollection({ mode: 'bearer', bearer: { token: '{{TOKEN}}' } });

    const { code } = await runCli(['run', 'req.bru', '--noproxy'], tmpDir);

    expect(code).toBe(0);
    expect(receivedHeaders.authorization).toBeUndefined();
  });
});
