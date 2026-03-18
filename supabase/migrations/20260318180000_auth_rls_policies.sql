-- Allow authenticated users to read all tables (single-user app)
-- Write operations still require service_role

create policy "Authenticated user read access on tweets"
  on tweets for select
  using (auth.role() = 'authenticated');

create policy "Authenticated user read access on tweet_entities"
  on tweet_entities for select
  using (auth.role() = 'authenticated');

create policy "Authenticated user read access on tweet_media"
  on tweet_media for select
  using (auth.role() = 'authenticated');

create policy "Authenticated user read access on settings"
  on settings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated user read access on deletion_log"
  on deletion_log for select
  using (auth.role() = 'authenticated');
