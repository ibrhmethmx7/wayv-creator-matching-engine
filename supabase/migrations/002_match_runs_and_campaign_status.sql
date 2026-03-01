-- Match run history
create table if not exists match_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  results jsonb not null,
  creator_count integer not null default 0,
  top_score numeric(5,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_match_runs_campaign on match_runs(campaign_id, created_at desc);

-- Campaign status
alter table campaigns add column if not exists status text not null default 'active'
  check (status in ('active','archived','draft'));

create index if not exists idx_campaigns_status on campaigns(status);
