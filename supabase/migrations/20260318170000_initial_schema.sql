-- tweets: core table storing all archived tweet types
create table tweets (
  id text primary key,
  tweet_type text not null default 'post',
  full_text text not null,
  created_at timestamptz not null,
  archived_at timestamptz not null default now(),

  -- Engagement metrics (snapshot at archive time)
  retweet_count integer not null default 0,
  favorite_count integer not null default 0,
  reply_count integer not null default 0,
  quote_count integer not null default 0,
  bookmark_count integer not null default 0,
  view_count integer default 0,

  -- Reply metadata
  in_reply_to_tweet_id text,
  in_reply_to_user_id text,
  in_reply_to_screen_name text,

  -- Quote tweet / retweet metadata
  quoted_tweet_id text,
  retweeted_tweet_id text,
  quoted_tweet_text text,
  quoted_tweet_author text,

  -- Thread tracking
  conversation_id text,
  thread_position integer,

  -- Source and language
  source text,
  lang text,

  -- Deletion tracking
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  is_protected boolean not null default false,

  -- Raw data backup
  raw_json jsonb,

  -- Import source tracking
  import_source text not null default 'export',

  constraint valid_tweet_type check (tweet_type in ('post', 'reply', 'retweet', 'quote_tweet')),
  constraint valid_import_source check (import_source in ('export', 'api'))
);

-- tweet_entities: extracted URLs, hashtags, mentions
create table tweet_entities (
  id uuid primary key default gen_random_uuid(),
  tweet_id text not null references tweets(id) on delete cascade,
  entity_type text not null,
  value text not null,
  expanded_url text,
  display_url text,
  title text,
  start_index integer,
  end_index integer,

  constraint valid_entity_type check (entity_type in ('url', 'hashtag', 'mention', 'cashtag'))
);

-- tweet_media: images and video thumbnails
create table tweet_media (
  id text primary key,
  tweet_id text not null references tweets(id) on delete cascade,
  media_type text not null,
  original_url text not null,
  storage_path text,
  width integer,
  height integer,
  alt_text text,
  duration_ms integer,
  thumbnail_storage_path text,
  video_url text,
  file_size_bytes bigint,

  constraint valid_media_type check (media_type in ('photo', 'video', 'animated_gif'))
);

-- settings: app configuration (single row)
create table settings (
  id integer primary key default 1 check (id = 1),
  retention_days integer not null default 180,
  auto_delete_enabled boolean not null default false,
  dry_run_mode boolean not null default true,
  viral_threshold integer not null default 100,
  protected_keywords text[] default '{}',
  last_sync_at timestamptz,
  last_deletion_run_at timestamptz,
  x_user_id text,
  x_username text,
  updated_at timestamptz not null default now()
);

-- deletion_log: audit trail for every deletion
create table deletion_log (
  id uuid primary key default gen_random_uuid(),
  tweet_id text not null,
  tweet_type text not null,
  tweet_text text not null,
  tweet_created_at timestamptz not null,
  deletion_reason text not null,
  deleted_at timestamptz not null default now(),
  api_response_code integer,
  api_error text,
  dry_run boolean not null default false,
  was_retweet boolean not null default false
);

-- Indexes
create index idx_tweets_created_at on tweets(created_at desc);
create index idx_tweets_tweet_type on tweets(tweet_type);
create index idx_tweets_conversation_id on tweets(conversation_id)
  where conversation_id is not null;
create index idx_tweets_is_deleted on tweets(is_deleted);
create index idx_tweets_is_protected on tweets(is_protected);
create index idx_tweets_in_reply_to on tweets(in_reply_to_tweet_id)
  where in_reply_to_tweet_id is not null;
create index idx_tweets_retention_candidates on tweets(created_at, is_deleted, is_protected)
  where is_deleted = false and is_protected = false;

create index idx_entities_tweet_id on tweet_entities(tweet_id);
create index idx_entities_type on tweet_entities(entity_type);
create index idx_entities_url on tweet_entities(expanded_url)
  where entity_type = 'url';
create index idx_entities_hashtag on tweet_entities(value)
  where entity_type = 'hashtag';

create index idx_media_tweet_id on tweet_media(tweet_id);
create index idx_media_type on tweet_media(media_type);

create index idx_deletion_log_deleted_at on deletion_log(deleted_at desc);
create index idx_deletion_log_tweet_id on deletion_log(tweet_id);

-- RLS: service role only (single-user private app)
alter table tweets enable row level security;
alter table tweet_entities enable row level security;
alter table tweet_media enable row level security;
alter table settings enable row level security;
alter table deletion_log enable row level security;

create policy "Service role full access on tweets"
  on tweets for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access on tweet_entities"
  on tweet_entities for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access on tweet_media"
  on tweet_media for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access on settings"
  on settings for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access on deletion_log"
  on deletion_log for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Seed initial settings row
insert into settings (id) values (1);
