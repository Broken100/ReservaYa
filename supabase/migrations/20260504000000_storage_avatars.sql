-- Create a public bucket for avatars and logos
insert into storage.buckets (id, name, public)
values ('public_assets', 'public_assets', true)
on conflict (id) do nothing;

-- Set up RLS policies for the public_assets bucket
-- 1. Allow public access to view files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'public_assets' );

-- 2. Allow authenticated users to upload files
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'public_assets'
  and auth.role() = 'authenticated'
);

-- 3. Allow users to update their own files
create policy "Users can update their own files"
on storage.objects for update
using (
  bucket_id = 'public_assets'
  and auth.uid() = owner
);

-- 4. Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'public_assets'
  and auth.uid() = owner
);
