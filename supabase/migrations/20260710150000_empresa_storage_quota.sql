-- Quota de armazenamento por empresa.
-- Usado para limitar anexos/evidencias no Plano Evidencias e vender memoria extra.

alter table if exists public.empresas
  add column if not exists "StorageLimitMB" numeric not null default 1024,
  add column if not exists "StorageUsedMB" numeric not null default 0,
  add column if not exists "StorageExtraMB" numeric not null default 0;

comment on column public.empresas."StorageLimitMB" is 'Limite base de armazenamento em MB. Plano Controle deve usar 0; Plano Evidencias começa com 1024 MB.';
comment on column public.empresas."StorageUsedMB" is 'Uso aproximado de armazenamento em MB para evidencias/anexos.';
comment on column public.empresas."StorageExtraMB" is 'Memoria adicional contratada em MB, somada ao limite base.';

update public.empresas
set "StorageLimitMB" = 0
where lower(coalesce("Plano", '')) like '%controle%';

update public.empresas
set "StorageLimitMB" = 1024
where lower(coalesce("Plano", '')) like '%evid%'
  and coalesce("StorageLimitMB", 0) = 0;
