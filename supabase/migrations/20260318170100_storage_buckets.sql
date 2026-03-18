-- Create storage bucket for tweet media (images + video thumbnails)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tweet-media',
  'tweet-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Storage policies
create policy "Public read access for tweet-media"
  on storage.objects for select
  using (bucket_id = 'tweet-media');

create policy "Service role upload for tweet-media"
  on storage.objects for insert
  with check (
    bucket_id = 'tweet-media'
    and auth.jwt() ->> 'role' = 'service_role'
  );

create policy "Service role delete for tweet-media"
  on storage.objects for delete
  using (
    bucket_id = 'tweet-media'
    and auth.jwt() ->> 'role' = 'service_role'
  );
