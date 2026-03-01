-- campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  title text not null,
  description text not null,
  budget numeric(12, 2) not null,
  target_locations text[] not null default '{}',
  target_categories text[] not null default '{}',
  language text not null,
  created_at timestamptz not null default now()
);

-- creators
create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  location text not null,
  categories text[] not null default '{}',
  follower_count integer not null,
  avg_views integer not null,
  engagement_rate numeric(5, 2) not null,
  price_min numeric(10, 2) not null,
  price_max numeric(10, 2) not null,
  languages text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ai_briefs cache
create table if not exists ai_briefs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  input_hash text not null,
  brief jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_campaigns_created_at on campaigns(created_at desc);
create index if not exists idx_creators_location on creators(location);
create index if not exists idx_creators_engagement on creators(engagement_rate desc);
create index if not exists idx_ai_briefs_hash on ai_briefs(input_hash);
create index if not exists idx_ai_briefs_campaign on ai_briefs(campaign_id);
