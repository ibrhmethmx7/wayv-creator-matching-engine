import { z } from "zod";

// --- CREATOR SCHEMA ---
export const CreatorAudienceSchema = z.object({
    topCountries: z.array(z.string()),
    genderSplit: z.record(z.string(), z.number()), // e.g. "female": 0.86
    topAgeRange: z.string()
});

export const CreatorPostSchema = z.object({
    caption: z.string(),
    views: z.number(),
    likes: z.number()
});

export const CreatorSchema = z.object({
    id: z.string(),
    username: z.string(),
    country: z.string(),
    niches: z.array(z.string()),
    followers: z.number(),
    engagement_rate: z.number(),
    avg_watch_time: z.number(),
    content_style: z.string(),
    primary_hook_type: z.string(),
    brand_safety_flags: z.array(z.string()),
    audience: CreatorAudienceSchema,
    last_posts: z.array(CreatorPostSchema),
    created_at: z.string().optional()
});

export type Creator = z.infer<typeof CreatorSchema>;


// --- CAMPAIGN SCHEMA ---
export const CampaignSchema = z.object({
    id: z.string(),
    brand: z.string(),
    objective: z.string(),
    target_country: z.string(),
    target_gender: z.string(),
    target_age_range: z.string(),
    niches: z.array(z.string()),
    preferred_hook_types: z.array(z.string()),
    min_avg_watch_time: z.number(),
    min_followers: z.number(),
    max_followers: z.number(),
    tone: z.string(),
    do_not_use_words: z.array(z.string()),
    created_at: z.string().optional()
});

export type Campaign = z.infer<typeof CampaignSchema>;


// --- SCORE BREAKDOWN SCHEMA ---
export const ScoreBreakdownSchema = z.object({
    nicheMatch: z.number(),
    audienceCountryMatch: z.number(),
    engagementWeight: z.number(),
    watchTimeFit: z.number(),
    followerFit: z.number(),
    hookMatch: z.number(),
    brandSafetyPenalty: z.number(),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const MatchResultSchema = z.object({
    creatorId: z.string(),
    totalScore: z.number(),
    scoreBreakdown: ScoreBreakdownSchema
});

export type MatchResult = z.infer<typeof MatchResultSchema>;


// --- AI BRIEF SCHEMA ---
export const BriefSchema = z.object({
    outreachMessage: z.string(),
    contentIdeas: z.array(z.string()),
    hookSuggestions: z.array(z.string()),
});

export type Brief = z.infer<typeof BriefSchema>;

// --- DASHBOARD STATS SCHEMA ---
export const DashboardStatsSchema = z.object({
    totalCampaigns: z.number(),
    totalCreators: z.number(),
    totalBriefsGenerated: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
