-- Replace single retention_days with per-type retention settings
alter table settings add column retention_days_post integer not null default 180;
alter table settings add column retention_days_reply integer not null default 180;
alter table settings add column retention_days_retweet integer not null default 180;
alter table settings add column retention_days_quote_tweet integer not null default 180;

-- Migrate existing value to all types
update settings set
  retention_days_post = retention_days,
  retention_days_reply = retention_days,
  retention_days_retweet = retention_days,
  retention_days_quote_tweet = retention_days;

-- Drop the old column
alter table settings drop column retention_days;
