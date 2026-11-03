import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as policy from '../supabase/functions/admin-users/policy.ts';
import { userUpdatePayload } from '../lib/userFields.ts';

test('management form sends only editable fields from a complete database row', () => {
  assert.deepEqual(userUpdatePayload({ Nome: 'Synthetic', Role: 'Gestor', Email: 'test@example.invalid', user_id: 'id', empresa_id: 'tenant', SenhaProvisoria: true }), { Nome: 'Synthetic', Role: 'Gestor' });
});

for (const caller of ['gestor', 'admin', 'master', 'plataforma']) {
  test(`${caller}: generic update rejects identity, flags and unexpected fields`, () => {
    for (const key of ['Email', 'user_id', 'empresa_id', 'SenhaProvisoria', 'TentativasFalhadas', 'DataCriacao', 'unexpected', '__proto__']) {
      assert.throws(() => policy.validateUserUpdate(JSON.parse(`{"${key}":"value"}`), caller));
    }
    for (const value of [null, [], {}, 'x', { Nome: {} }, { Role: null }, { Status: 'unknown' }]) assert.throws(() => policy.validateUserUpdate(value, caller));
  });
}

test('hierarchy preserves administrators and reserves platform accounts', () => {
  assert.equal(policy.canManageRole('gestor', 'COLABORADOR'), true);
  for (const role of ['Gestor', 'Admin', 'Master', 'Plataforma', '', null]) assert.equal(policy.canManageRole('gestor', role), false);
  for (const caller of ['admin', 'master']) {
    for (const role of ['Colaborador', 'Gestor', 'Admin', 'Master']) assert.equal(policy.canManageRole(caller, role), true);
    assert.throws(() => policy.validateUserUpdate({ Role: 'Plataforma' }, caller));
  }
  assert.deepEqual(policy.validateUserUpdate({ Role: 'Colaborador', Nome: 'Synthetic', Time: null }, 'gestor'), { Role: 'Colaborador', Nome: 'Synthetic', Time: null });
  assert.deepEqual(policy.validateUserUpdate({ Role: 'Plataforma' }, 'plataforma'), { Role: 'Plataforma' });
});

test('email lookup is case insensitive but escapes SQL LIKE metacharacters', () => {
  assert.equal(policy.emailPattern('Test_100%@example.invalid'), 'Test\\_100\\%@example.invalid');
  assert.equal(policy.emailPattern('a\\b@example.invalid'), 'a\\\\b@example.invalid');
});

// Execute the real entrypoint with an in-memory Supabase adapter. No network,
// credentials, Auth mutations or mail are permitted by this fixture.
async function invoke({ role = 'gestor', targetRole = 'Colaborador', tenant = 'a', action = 'update', user = { Nome: 'Synthetic' } } = {}) {
  let handler;
  const writes = [];
  let reads = 0;
  const source = readFileSync(new URL('../supabase/functions/admin-users/index.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const admin = {
    from(table) {
      let mutation;
      const query = {
        select() { return query; },
        ilike() { return query; },
        update(row) { writes.push(row); mutation = row; return query; },
        delete() { writes.push('delete'); return query; },
        upsert(row) { writes.push(row); return query; },
        in() { return query; },
        async maybeSingle() { return { data: ++reads === 1 ? { Role: role, empresa_id: 'a' } : { Role: targetRole, empresa_id: tenant } }; },
        async single() { return { data: mutation }; },
        then(resolve) { resolve({ data: table === 'user_empresas' ? [] : null }); },
      };
      return query;
    },
    auth: { admin: new Proxy({}, { get() { throw new Error('Unexpected Auth mutation'); } }) },
  };
  vm.runInNewContext(compiled, {
    exports: {}, Response, console,
    Deno: { env: { get: key => key }, serve: fn => { handler = fn; } },
    require: path => path.includes('policy') ? policy : { createClient: (_url, key) => key === 'SUPABASE_ANON_KEY' ? { auth: { getUser: async () => ({ data: { user: { email: 'caller@example.invalid' } } }) } } : admin },
  });
  const response = await handler(new Request('http://localhost/admin-users', { method: 'POST', body: JSON.stringify({ action, email: 'target@example.invalid', user, empresas: ['a'] }) }));
  return { status: response.status, body: await response.json(), writes };
}

test('entrypoint rejects elevated role and unexpected fields before any write', async () => {
  for (const user of [{ Role: 'Admin' }, { user_id: 'forged' }, { empresa_id: 'b' }, { Email: 'other@example.invalid' }]) {
    const result = await invoke({ user });
    assert.equal(result.status, 400);
    assert.deepEqual(result.writes, []);
  }
});

for (const action of ['update', 'reset-password', 'toggle-status', 'delete', 'change-email', 'set-empresas']) {
  test(`entrypoint protects privileged targets for ${action}`, async () => {
    for (const targetRole of ['Gestor', 'Admin', 'Master', 'Plataforma']) {
      const result = await invoke({ action, targetRole });
      assert.equal(result.status, 403);
      assert.deepEqual(result.writes, []);
    }
  });
}

test('entrypoint rejects cross-company targets and gestor access grants', async () => {
  for (const args of [{ tenant: 'b' }, { action: 'set-empresas' }]) {
    const result = await invoke(args);
    assert.equal(result.status, 403);
    assert.deepEqual(result.writes, []);
  }
});

test('create cannot reserve platform privileges or link a privileged account as gestor', async () => {
  for (const args of [
    { role: 'admin', user: { Role: 'Plataforma' } },
    { role: 'master', user: { Role: 'Unknown' } },
    { role: 'gestor', user: { Role: 'Admin' } },
    { role: 'gestor', targetRole: 'Admin', user: { Email: 'synthetic@example.invalid', Role: 'Colaborador' } },
  ]) {
    const result = await invoke({ action: 'create', ...args });
    assert.equal(result.status, 403);
    assert.deepEqual(result.writes, []);
  }
});

test('self profile uses persisted response, while administrative self edits use the Edge', async () => {
  const source = readFileSync(new URL('../services/api.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  let edgeCalls = 0;
  const persisted = { Email: 'self@example.invalid', Nome: 'Persisted' };
  const query = { update() { return query; }, eq() { return query; }, select() { return query; }, async single() { return { data: persisted }; } };
  vm.runInNewContext(compiled, {
    exports,
    require: () => ({ supabase: {
      auth: { getUser: async () => ({ data: { user: { email: persisted.Email } } }) },
      from: () => query,
      functions: { invoke: async () => { edgeCalls++; return { data: { user: persisted } }; } },
    } }),
  });
  const result = await exports.authApi.updateUser(persisted.Email, { Nome: 'Submitted' });
  assert.equal(result, persisted);
  assert.equal(edgeCalls, 0);
  await exports.authApi.updateUser(persisted.Email, { Role: 'Admin' });
  assert.equal(edgeCalls, 1);
});

test('entrypoint preserves legitimate collaborator edits and admin promotions', async () => {
  for (const args of [{}, { role: 'admin', user: { Role: 'Gestor', Status: 'Ativo' } }, { role: 'master', user: { Nome: 'Synthetic' } }, { role: 'plataforma', user: { Role: 'Plataforma' } }]) {
    const result = await invoke(args);
    assert.equal(result.status, 200);
    assert.deepEqual(JSON.parse(JSON.stringify(result.writes)), [args.user ?? { Nome: 'Synthetic' }]);
  }
});

test('forward migration removes management bypass and restricts email RPC grants', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261103120000_harden_user_authorization.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /app_is_manager/);
  assert.match(sql, /coalesce\(auth.jwt\(\) ->> 'role', ''\) = 'service_role'/);
  assert.match(sql, /old\."SenhaProvisoria" = true and new\."SenhaProvisoria" = false/);
  for (const field of ['Role', 'Status', 'Time', 'Gestor', 'Email', 'TentativasFalhadas', 'DataCriacao']) assert.ok(sql.includes(`new."${field}"`) && sql.includes(`old."${field}"`));
  assert.match(sql, /new.user_id\s*:= old.user_id/);
  assert.match(sql, /new.empresa_id\s*:= old.empresa_id/);
  assert.match(sql, /revoke all on function public.renomear_email\(text, text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public.renomear_email\(text, text\) to service_role/);
  assert.match(sql, /drop policy if exists ue_manage on public.user_empresas/);
  assert.match(sql, /lower\(public.app_role\(\)\) in \('admin', 'master'\)/);
});
