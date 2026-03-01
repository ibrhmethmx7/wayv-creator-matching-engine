-- 003_assessment_schema.sql
-- Drop old tables to clear the way for exact assessment specs
DROP TABLE IF EXISTS ai_briefs CASCADE;
DROP TABLE IF EXISTS match_runs CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS creators CASCADE;

CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    objective TEXT NOT NULL,
    target_country TEXT NOT NULL,
    target_gender TEXT NOT NULL,
    target_age_range TEXT NOT NULL,
    min_avg_watch_time NUMERIC NOT NULL,
    min_followers INTEGER NOT NULL,
    max_followers INTEGER NOT NULL,
    tone TEXT NOT NULL,
    niches JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_hook_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    do_not_use_words JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE creators (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    country TEXT NOT NULL,
    followers INTEGER NOT NULL,
    engagement_rate NUMERIC NOT NULL,
    avg_watch_time NUMERIC NOT NULL,
    content_style TEXT NOT NULL,
    primary_hook_type TEXT NOT NULL,
    niches JSONB NOT NULL DEFAULT '[]'::jsonb,
    brand_safety_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    audience JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_posts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_briefs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    response_json JSONB NOT NULL,
    error_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(campaign_id, creator_id)
);
