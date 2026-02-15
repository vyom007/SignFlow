-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_url text,
  file_name text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'completed', 'declined', 'expired')),
  is_template boolean default false,
  template_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

alter table public.documents enable row level security;
create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

-- Signers table
create table if not exists public.signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  name text not null,
  email text not null,
  sign_order integer default 1,
  status text not null default 'pending' check (status in ('pending', 'sent', 'viewed', 'signed', 'declined')),
  token uuid default gen_random_uuid(),
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.signers enable row level security;
create policy "signers_select_via_doc" on public.signers for select using (
  exists (select 1 from public.documents where documents.id = signers.document_id and documents.user_id = auth.uid())
);
create policy "signers_insert_via_doc" on public.signers for insert with check (
  exists (select 1 from public.documents where documents.id = signers.document_id and documents.user_id = auth.uid())
);
create policy "signers_update_via_doc" on public.signers for update using (
  exists (select 1 from public.documents where documents.id = signers.document_id and documents.user_id = auth.uid())
);
create policy "signers_delete_via_doc" on public.signers for delete using (
  exists (select 1 from public.documents where documents.id = signers.document_id and documents.user_id = auth.uid())
);
-- Allow signers to view/update their own signer record via token (public signing)
create policy "signers_select_by_token" on public.signers for select using (true);
create policy "signers_update_by_token" on public.signers for update using (true);

-- Signature fields (placed on the PDF)
create table if not exists public.signature_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_id uuid references public.signers(id) on delete cascade,
  field_type text not null default 'signature' check (field_type in ('signature', 'text', 'date', 'initials', 'checkbox')),
  page_number integer not null default 1,
  x_position float not null,
  y_position float not null,
  width float not null default 200,
  height float not null default 50,
  value text,
  required boolean default true,
  created_at timestamptz default now()
);

alter table public.signature_fields enable row level security;
create policy "fields_select_via_doc" on public.signature_fields for select using (
  exists (select 1 from public.documents where documents.id = signature_fields.document_id and documents.user_id = auth.uid())
);
create policy "fields_insert_via_doc" on public.signature_fields for insert with check (
  exists (select 1 from public.documents where documents.id = signature_fields.document_id and documents.user_id = auth.uid())
);
create policy "fields_update_via_doc" on public.signature_fields for update using (
  exists (select 1 from public.documents where documents.id = signature_fields.document_id and documents.user_id = auth.uid())
);
create policy "fields_delete_via_doc" on public.signature_fields for delete using (
  exists (select 1 from public.documents where documents.id = signature_fields.document_id and documents.user_id = auth.uid())
);
-- Public signing access
create policy "fields_select_public" on public.signature_fields for select using (true);
create policy "fields_update_public" on public.signature_fields for update using (true);

-- Audit trail
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_id uuid references public.signers(id) on delete set null,
  action text not null,
  details text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;
create policy "audit_select_via_doc" on public.audit_logs for select using (
  exists (select 1 from public.documents where documents.id = audit_logs.document_id and documents.user_id = auth.uid())
);
create policy "audit_insert_public" on public.audit_logs for insert with check (true);

-- Storage bucket for document files
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents_storage_select" on storage.objects for select using (bucket_id = 'documents');
create policy "documents_storage_insert" on storage.objects for insert with check (bucket_id = 'documents');
create policy "documents_storage_update" on storage.objects for update using (bucket_id = 'documents');
create policy "documents_storage_delete" on storage.objects for delete using (bucket_id = 'documents');
