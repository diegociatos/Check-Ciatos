import test from 'node:test';
import assert from 'node:assert/strict';
import { webhookAuthStatus } from '../supabase/functions/_shared/webhook-auth.ts';

test('webhook rejects events when its secret is not configured', () => {
  for (const secret of [undefined, '', '   ']) assert.equal(webhookAuthStatus(secret, 'anything'), 503);
});
test('webhook rejects missing and invalid credentials', () => {
  for (const token of [null, '', 'wrong', 'test-secret ']) assert.equal(webhookAuthStatus('test-secret', token), 401);
});
test('webhook accepts only the configured token', () => {
  assert.equal(webhookAuthStatus('test-secret', 'test-secret'), 200);
});

// Exercise the real entrypoint: rejected requests must never construct a service-role client.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
for (const [secret, token, expectedStatus] of [[undefined, 'forged', 503], ['secret', null, 401], ['secret', 'wrong', 401]]) {
  test('entrypoint rejects before privileged access: ' + expectedStatus + '/' + token, async () => {
    let handler;
    const source = readFileSync(new URL('../supabase/functions/asaas-webhook/index.ts', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, {
      exports: {}, Response, console,
      Deno: { env: { get: () => secret }, serve: fn => { handler = fn; } },
      require: path => path.includes('webhook-auth') ? { webhookAuthStatus } : { createClient: () => { throw new Error('Privileged client must not be created'); } },
    });
    const headers = token ? { 'asaas-access-token': token } : {};
    const response = await handler(new Request('http://localhost/webhook', { method: 'POST', headers, body: '{}' }));
    assert.equal(response.status, expectedStatus);
  });
}
