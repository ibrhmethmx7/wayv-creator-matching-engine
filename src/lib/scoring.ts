/**
 * Matches a campaign against all creators in the database.
 * Pure function: calculates scores and breakdown.
 */
export { type Campaign, type Creator, type MatchResult, type ScoreBreakdown } from "./schemas";
import { Campaign, Creator, MatchResult, ScoreBreakdown } from "./schemas";

// Weights total to 100
export const SCORING_WEIGHTS = {
    niche: 30,
    audienceCountry: 20,
    engagement: 15,
    watchTime: 15,
    hook: 10,
    followerFit: 10
};

/**
 * clamp(val, min, max) limits val to [min, max]
 */
function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
}

export function calculateMatchScore(campaign: Campaign, creator: Creator): MatchResult {
    const bd: ScoreBreakdown = {
        nicheMatch: 0,
        audienceCountryMatch: 0,
        engagementWeight: 0,
        watchTimeFit: 0,
        followerFit: 0,
        hookMatch: 0,
        brandSafetyPenalty: 0,
    };

    // 1. Brand Safety (Hard Reject / Penalty)
    // If ANY of the creator's brand safety flags match the campaign's do Not Use Words
    const safetyOverlap = creator.brand_safety_flags.filter(f =>
        campaign.do_not_use_words.some(word => f.toLowerCase().includes(word.toLowerCase()))
    );
    if (safetyOverlap.length > 0) {
        // Based on assessment, return -5 penalty or hard block. We'll use a -5 penalty per overlap,
        // or a hard block if it's considered mission critical. Assessment showed brandSafetyPenalty: -5
        bd.brandSafetyPenalty = -5 * safetyOverlap.length;
    }

    // 2. Niche Relevance (0-30)
    // Overlap between campaign niches and creator niches
    if (campaign.niches.length > 0) {
        const intersection = creator.niches.filter(n => campaign.niches.includes(n)).length;
        const jaccard = intersection / (new Set([...campaign.niches, ...creator.niches])).size;
        bd.nicheMatch = Math.round(jaccard * SCORING_WEIGHTS.niche);
    } else {
        bd.nicheMatch = SCORING_WEIGHTS.niche; // If campaign has no specific niche, free points
    }

    // 3. Audience Country Match (0-20)
    // Creator must have the targetCountry in their topCountries
    if (creator.audience.topCountries.includes(campaign.target_country)) {
        bd.audienceCountryMatch = SCORING_WEIGHTS.audienceCountry;
    } else {
        // If it's not in top countries, but they are physically in that country, partial points
        if (creator.country === campaign.target_country) {
            bd.audienceCountryMatch = Math.round(SCORING_WEIGHTS.audienceCountry * 0.5);
        }
    }

    // 4. Engagement Rate (0-15)
    // The dataset has ER as decimal (e.g. 11.3 for 11.3%).
    // We'll consider 5% "good", 10% "max".
    // Formula: MaxPoints * clamp((value - min)/(excellent - min), 0, 1)
    const MIN_ER = 1.0;
    const EXCELLENT_ER = 10.0;
    const erScore = clamp((creator.engagement_rate - MIN_ER) / (EXCELLENT_ER - MIN_ER), 0, 1);
    bd.engagementWeight = Math.round(erScore * SCORING_WEIGHTS.engagement);

    // 5. Watch Time Fit (0-15)
    // Creator avgWatchTime vs Campaign minAvgWatchTime
    if (creator.avg_watch_time >= campaign.min_avg_watch_time) {
        bd.watchTimeFit = SCORING_WEIGHTS.watchTime;
    } else {
        // Penalize linearly the further away it is
        const ratio = creator.avg_watch_time / campaign.min_avg_watch_time;
        bd.watchTimeFit = Math.round(ratio * SCORING_WEIGHTS.watchTime);
    }

    // 6. Follower Range Fit (0-10)
    if (creator.followers >= campaign.min_followers && creator.followers <= campaign.max_followers) {
        bd.followerFit = SCORING_WEIGHTS.followerFit;
    } else {
        // Outside range = exponential/linear drop-off
        const distMin = Math.max(0, campaign.min_followers - creator.followers);
        const distMax = Math.max(0, creator.followers - campaign.max_followers);
        const maxDist = distMin > 0 ? campaign.min_followers : campaign.max_followers;
        const ratio = clamp(1 - ((distMin || distMax) / maxDist), 0, 1);
        bd.followerFit = Math.round(ratio * SCORING_WEIGHTS.followerFit);
    }

    // 7. Hook Type Preference (0-10)
    if (campaign.preferred_hook_types.length === 0) {
        bd.hookMatch = SCORING_WEIGHTS.hook; // No preference
    } else if (campaign.preferred_hook_types.includes(creator.primary_hook_type)) {
        bd.hookMatch = SCORING_WEIGHTS.hook; // Exact match
    } else {
        bd.hookMatch = 0; // No match
    }

    // Sum components
    let totalScore =
        bd.nicheMatch +
        bd.audienceCountryMatch +
        bd.engagementWeight +
        bd.watchTimeFit +
        bd.followerFit +
        bd.hookMatch +
        bd.brandSafetyPenalty;

    totalScore = Math.max(0, totalScore);

    return {
        creatorId: creator.id,
        totalScore,
        scoreBreakdown: bd
    };
}

export const scoreCreator = calculateMatchScore;

export function rankCreators(campaign: Campaign, creators: Creator[]): MatchResult[] {
    return creators
        .map((creator) => scoreCreator(campaign, creator))
        .sort((a, b) => b.totalScore - a.totalScore);
}
