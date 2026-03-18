-- Add tsvector column for full-text search
alter table tweets add column fts tsvector
  generated always as (to_tsvector('english', full_text)) stored;

create index idx_tweets_fts on tweets using gin (fts);
