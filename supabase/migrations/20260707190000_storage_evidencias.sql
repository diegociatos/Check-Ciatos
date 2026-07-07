-- Bucket privado de evidências de conclusão de tarefas.
-- Caminho: {empresa_id}/{task_id}/{arquivo}. Isolado por empresa via RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias', 'evidencias', false, 5242880,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','application/pdf']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;

-- Acesso: só à própria empresa (1º nível da pasta = empresa_id) ou plataforma.
drop policy if exists evidencias_insert on storage.objects;
create policy evidencias_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (public.app_is_plataforma() or (storage.foldername(name))[1] in (select public.app_empresas()))
  );

drop policy if exists evidencias_select on storage.objects;
create policy evidencias_select on storage.objects for select to authenticated
  using (
    bucket_id = 'evidencias'
    and (public.app_is_plataforma() or (storage.foldername(name))[1] in (select public.app_empresas()))
  );

drop policy if exists evidencias_delete on storage.objects;
create policy evidencias_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (public.app_is_plataforma() or (storage.foldername(name))[1] in (select public.app_empresas()))
  );
