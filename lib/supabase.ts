import { createClient, SupabaseClient } from '@supabase/supabase-js';

// A "anon key" é pública por design — pode ir no cliente. A segurança real vem da RLS no banco.
// Defina em .env.local (dev) e nas variáveis da Netlify (produção):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = !!(url && anon);

if (!supabaseConfigurado) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. ' +
    'Configure o .env.local (dev) e as variáveis da Netlify (produção).'
  );
}

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', anon ?? 'anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'checkciatos_auth',
  },
});
