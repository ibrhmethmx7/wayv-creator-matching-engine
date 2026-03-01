import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { calculateMatchScore } from "../src/lib/scoring";
import { CampaignSchema, CreatorSchema } from "../src/lib/schemas";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("Fetching campaigns and creators from DB...");
    const { data: campaignData, error: campaignError } = await supabase.from("campaigns").select("*");
    const { data: creatorData, error: creatorError } = await supabase.from("creators").select("*");

    if (campaignError || creatorError) {
        console.error("Failed to fetch data", { campaignError, creatorError });
        return;
    }

    const campaigns = campaignData.map(c => CampaignSchema.parse(c));
    const creators = creatorData.map(c => CreatorSchema.parse(c));

    console.log(`Found ${campaigns.length} campaigns and ${creators.length} creators.\n`);

    for (const campaign of campaigns) {
        console.log("--------------------------------------------------");
        console.log(`Testing Match For Campaign: [${campaign.brand}] ${campaign.objective}`);
        console.log(`Constraints: ${campaign.min_followers} - ${campaign.max_followers} followers, ` +
            `Target: ${campaign.target_country}, Disallowed: [${campaign.do_not_use_words.join(", ")}]`);
        console.log("--------------------------------------------------");

        const scored = creators.map(creator => {
            const match = calculateMatchScore(campaign, creator);
            return { creator, match };
        });

        // Sort by tie-breaker rules
        scored.sort((a, b) => {
            if (b.match.totalScore !== a.match.totalScore) return b.match.totalScore - a.match.totalScore;
            if (b.creator.engagement_rate !== a.creator.engagement_rate) return b.creator.engagement_rate - a.creator.engagement_rate;
            return b.creator.followers - a.creator.followers;
        });

        const top5 = scored.slice(0, 5);

        top5.forEach((result, i) => {
            const c = result.creator;
            const m = result.match;
            const isRisk = m.scoreBreakdown.brandSafetyPenalty < 0;

            console.log(`#${i + 1} @${c.username} | Score: ${m.totalScore} | ER: ${c.engagement_rate}% | Followers: ${c.followers.toLocaleString()} | Country: ${c.country} ${isRisk ? " [BRAND RISK PENALTY]" : ""}`);

            const bd = m.scoreBreakdown;
            console.log(`    Breakdown -> Niche: +${bd.nicheMatch}, Audience: +${bd.audienceCountryMatch}, ER: +${bd.engagementWeight}, WatchTime: +${bd.watchTimeFit}, Followers: +${bd.followerFit}, Hook: +${bd.hookMatch}`);
        });

        console.log("\n");
    }

    console.log("✅ Rigorous engine testing completed.");
}

runTests().catch(console.error);
