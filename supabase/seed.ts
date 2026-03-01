import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// 1. Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Load JSON files
const campaignsPath = path.join(process.cwd(), "dataset", "campaigns.json");
const creatorsPath = path.join(process.cwd(), "dataset", "creators.json");

if (!fs.existsSync(campaignsPath) || !fs.existsSync(creatorsPath)) {
    console.error("Missing campaigns.json or creators.json in dataset/ folder.");
    process.exit(1);
}

const rawCampaigns = JSON.parse(fs.readFileSync(campaignsPath, "utf-8"));
const rawCreators = JSON.parse(fs.readFileSync(creatorsPath, "utf-8"));

async function seed() {
    console.log("Seeding Database from Assessment JSONs...");

    // Wipe existing data to prevent conflict
    await supabase.from("ai_briefs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("campaigns").delete().neq("id", "0");
    await supabase.from("creators").delete().neq("id", "0");

    // Transform and Insert Campaigns
    // campaigns.json format: { id, brand, objective, targetCountry, targetGender, targetAgeRange, niches, preferredHookTypes, minAvgWatchTime, budgetRange: {minFollowers, maxFollowers}, tone, doNotUseWords }
    const campaignsToInsert = rawCampaigns.map((c: any) => ({
        id: c.id,
        brand: c.brand,
        objective: c.objective,
        target_country: c.targetCountry,
        target_gender: c.targetGender,
        target_age_range: c.targetAgeRange,
        min_avg_watch_time: c.minAvgWatchTime,
        min_followers: c.budgetRange.minFollowers,
        max_followers: c.budgetRange.maxFollowers,
        tone: c.tone,
        niches: c.niches,
        preferred_hook_types: c.preferredHookTypes,
        do_not_use_words: c.doNotUseWords
    }));

    const { error: cmpErr } = await supabase.from("campaigns").insert(campaignsToInsert);
    if (cmpErr) {
        console.error("Campaign insert error:", cmpErr.message);
    } else {
        console.log(`✅ Seeded ${campaignsToInsert.length} campaigns.`);
    }

    // Transform and Insert Creators
    // creators.json format: { id, username, country, niches, followers, engagementRate, avgWatchTime, contentStyle, primaryHookType, brandSafetyFlags, audience: {}, lastPosts: [] }
    const creatorsToInsert = rawCreators.map((c: any) => ({
        id: c.id,
        username: c.username,
        country: c.country,
        followers: c.followers,
        engagement_rate: c.engagementRate * 100, // convert decimal 0.113 to % 11.3 natively
        avg_watch_time: c.avgWatchTime,
        content_style: c.contentStyle,
        primary_hook_type: c.primaryHookType,
        niches: c.niches,
        brand_safety_flags: c.brandSafetyFlags,
        audience: c.audience,
        last_posts: c.lastPosts
    }));

    const { error: crErr } = await supabase.from("creators").insert(creatorsToInsert);
    if (crErr) {
        console.error("Creator insert error:", crErr.message);
    } else {
        console.log(`✅ Seeded ${creatorsToInsert.length} creators.`);
    }
}

seed().catch(console.error);
