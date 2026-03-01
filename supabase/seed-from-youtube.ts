/**
 * seed-from-youtube.ts
 *
 * 1. Deletes all existing mock creators
 * 2. Fetches real stats from YouTube Data API v3 for ~60 channels
 * 3. Upserts into Supabase creators table
 *
 * Usage:
 *   npx tsx supabase/seed-from-youtube.ts
 *
 * Required env var: YOUTUBE_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const YT_KEY = process.env.YOUTUBE_API_KEY!;
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── 60 YouTube handles (extra handles = insurance against 404s) ────────────
const HANDLES: string[] = [
    // ── TURKEY ──────────────────────────────────────────────────────────────
    "@RefikaSozer",          // Food / Cooking · 8M+
    "@DanlaBilic",           // Beauty / Fashion
    "@OlgaCebeci",           // Music
    "@berkaybicer",          // Travel / Lifestyle
    "@suvari",               // Gaming
    "@FatihDogrusoz",        // Business / Finance
    "@gamerzarenagg",        // Gaming / Esports
    "@CemYilmazComedy",      // Comedy
    "@NilufferAksoy",        // Lifestyle / Beauty
    "@TurkishFoodRecipes",   // Food
    // ── USA / CANADA ─────────────────────────────────────────────────────────
    "@mkbhd",                // Tech · 18M+
    "@LinusTechTips",        // Tech · 15M+
    "@unboxtherapy",         // Tech · 22M+
    "@JerryRigEverything",   // Tech (teardowns)
    "@CaseyNeistat",         // Vlog / Lifestyle · 12M
    "@GrahamStephan",        // Finance / Real-estate
    "@andreijikh",           // Finance / Magic
    "@AthleanX",             // Fitness
    "@JeffNippard",          // Fitness
    "@yogawithadriene",      // Fitness / Wellness
    "@MarkWiens",            // Food / Travel
    "@BrianJohnsonBP",       // Health / Longevity
    "@VanossGaming",         // Gaming · Canada
    "@Markiplier",           // Gaming
    "@jacksepticeye",        // Gaming · Ireland/USA
    "@Disguisedtoast",       // Gaming
    "@shroud",               // Gaming
    "@JamesCharles",         // Beauty · 24M+
    "@jeffreestar",          // Beauty / Fashion
    "@PatrickStarrr",        // Beauty
    "@PeterMcKinnon",        // Photography / Vlog
    "@DavidDobrik",          // Vlog / Entertainment
    "@MrBeast",              // Entertainment · 200M+
    // ── UK ───────────────────────────────────────────────────────────────────
    "@mrwhosetheboss",       // Tech · 5M+
    "@GordonRamsay",         // Food · 20M+
    "@SortedFood",           // Food
    "@Callux",               // Lifestyle / Gaming
    "@KSI",                  // Entertainment / Music
    "@AmazingPhil",          // Lifestyle
    // ── GERMANY ─────────────────────────────────────────────────────────────
    "@Rezo",                 // Commentary / Entertainment
    "@MontanaBlack",         // Gaming · 3M+
    "@inscope21",            // Lifestyle / Gaming
    // ── NETHERLANDS ─────────────────────────────────────────────────────────
    "@NikkieTutorials",      // Beauty · 14M+
    // ── SWEDEN ──────────────────────────────────────────────────────────────
    "@PewDiePie",            // Gaming / Memes · 110M+
    // ── BRAZIL ──────────────────────────────────────────────────────────────
    "@whinderssonnunes",     // Entertainment / Comedy · 43M+
    "@felipeneto",           // Entertainment · 46M+
    "@CanalCanalha",         // Comedy
    // ── SPAIN ───────────────────────────────────────────────────────────────
    "@ElRubius",             // Gaming / Entertainment · 40M+
    "@AuronPlay",            // Gaming / Twitch
    "@TheWillyrex",          // Gaming
    // ── SOUTH KOREA ─────────────────────────────────────────────────────────
    "@SMTOWN",               // K-Pop / Music
    // ── JAPAN ───────────────────────────────────────────────────────────────
    "@HikakinTV",            // Entertainment · 10M+
    // ── INDIA ───────────────────────────────────────────────────────────────
    "@CarryMinati",          // Comedy / Gaming · 40M+
    "@TechBurner",           // Tech
    // ── FRANCE ──────────────────────────────────────────────────────────────
    "@Cyprien",              // Comedy / Entertainment · 14M+
    "@Squeezie",             // Gaming / Entertainment · 18M+
    // ── AUSTRALIA ───────────────────────────────────────────────────────────
    "@SkyDoesEverything",    // Gaming (AU/USA)
];

// ─── Mappings ────────────────────────────────────────────────────────────────
const COUNTRY_LOCATION: Record<string, string> = {
    TR: "Turkey", US: "USA", GB: "UK", DE: "Germany",
    FR: "France", AE: "UAE", BR: "Brazil", JP: "Japan",
    ES: "Spain", NL: "Netherlands", KR: "South Korea", IT: "Italy",
    CA: "Canada", AU: "Australia", MX: "Mexico", IN: "India",
    PL: "Poland", SE: "Sweden",
};
const COUNTRY_LANG: Record<string, string[]> = {
    TR: ["Turkish"], US: ["English"], GB: ["English"],
    DE: ["German", "English"], FR: ["French", "English"], AE: ["Arabic", "English"],
    BR: ["Portuguese"], JP: ["Japanese"], ES: ["Spanish"],
    NL: ["Dutch", "English"], KR: ["Korean"], IT: ["Italian", "English"],
    CA: ["English"], AU: ["English"], MX: ["Spanish"],
    IN: ["English", "Hindi"], PL: ["Polish"], SE: ["Swedish", "English"],
};
const CATEGORY_KW: [string, RegExp][] = [
    ["Fashion", /fashion|style|outfit|clothing|wear|moda|giyim/i],
    ["Beauty", /beauty|makeup|makyaj|skincare|cosmetic|güzellik/i],
    ["Tech", /tech|technology|gadget|review|phone|laptop|yazılım|teknoloji|unbox/i],
    ["Gaming", /gaming|game|gamer|gameplay|oyun|playstation|xbox|twitch|esport/i],
    ["Food", /food|recipe|cook|restaurant|yemek|mutfak|chef|pişir|yemek/i],
    ["Travel", /travel|seyahat|vlog|gezgin|trip|vacation|tatil/i],
    ["Fitness", /fitness|gym|workout|sport|egzersiz|health|yoga/i],
    ["Music", /music|müzik|song|rap|dj|kpop|müzisyen/i],
    ["Finance", /finance|money|invest|crypto|kripto|finans|para|trade/i],
    ["Comedy", /comedy|humor|komedi|funny|parody/i],
];
function inferCategories(title: string, desc: string): string[] {
    const text = `${title} ${desc}`;
    const hits = CATEGORY_KW.filter(([, re]) => re.test(text)).map(([c]) => c);
    return hits.length > 0 ? hits.slice(0, 3) : ["Lifestyle"];
}
function estimatePrice(subs: number): { price_min: number; price_max: number } {
    if (subs >= 10_000_000) return { price_min: 20000, price_max: 80000 };
    if (subs >= 5_000_000) return { price_min: 8000, price_max: 25000 };
    if (subs >= 1_000_000) return { price_min: 3000, price_max: 10000 };
    if (subs >= 500_000) return { price_min: 1200, price_max: 4000 };
    if (subs >= 100_000) return { price_min: 400, price_max: 1500 };
    if (subs >= 50_000) return { price_min: 150, price_max: 600 };
    return { price_min: 50, price_max: 200 };
}

async function ytGet(url: string) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`YT API ${r.status}: ${await r.text()}`);
    return r.json() as Promise<Record<string, unknown>>;
}

async function getEngagementRate(uploadsId: string): Promise<number> {
    try {
        const pl = await ytGet(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=10&key=${YT_KEY}`
        );
        const ids = ((pl.items as Array<{ contentDetails: { videoId: string } }>) ?? [])
            .map(i => i.contentDetails.videoId).join(",");
        if (!ids) return 3.5;
        const vs = await ytGet(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${YT_KEY}`
        );
        let total = 0, n = 0;
        for (const v of (vs.items as Array<{ statistics: Record<string, string> }>) ?? []) {
            const views = parseInt(v.statistics.viewCount ?? "0");
            const likes = parseInt(v.statistics.likeCount ?? "0");
            const comments = parseInt(v.statistics.commentCount ?? "0");
            if (views > 0) { total += ((likes + comments) / views) * 100; n++; }
        }
        return n > 0 ? Math.round((total / n) * 10) / 10 : 3.5;
    } catch { return 3.5; }
}

async function fetchChannel(handle: string) {
    const param = handle.startsWith("UC") ? `id=${handle}` : `forHandle=${encodeURIComponent(handle)}`;
    const data = await ytGet(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${param}&key=${YT_KEY}`
    );
    return ((data.items as unknown[]) ?? [])[0] as {
        snippet: { title: string; customUrl?: string; description: string; country?: string };
        statistics: Record<string, string>;
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
    } | null;
}

async function main() {
    if (!YT_KEY) { console.error("❌  YOUTUBE_API_KEY not set in .env.local"); process.exit(1); }

    // Step 1: clear existing mock creators
    console.log("🗑   Clearing existing creators…");
    const { error: delErr } = await db.from("creators").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delErr) { console.error("Delete failed:", delErr.message); process.exit(1); }
    console.log("✓   Cleared.\n");

    // Step 2: import from YouTube
    console.log(`🎬  Importing ${HANDLES.length} channels…\n`);
    let ok = 0, skip = 0;

    for (const handle of HANDLES) {
        try {
            const ch = await fetchChannel(handle);
            if (!ch) { console.warn(`  ⚠   Not found: ${handle}`); skip++; continue; }

            const subs = parseInt(ch.statistics.subscriberCount ?? "0");
            const totalViews = parseInt(ch.statistics.viewCount ?? "0");
            const totalVids = Math.max(parseInt(ch.statistics.videoCount ?? "1"), 1);
            const country = ch.snippet.country ?? "US";
            const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads ?? "";
            const er = uploadsId ? await getEngagementRate(uploadsId) : 3.5;

            const creator = {
                name: ch.snippet.title,
                username: (ch.snippet.customUrl ?? handle).replace(/^@/, "").toLowerCase(),
                location: COUNTRY_LOCATION[country] ?? country,
                categories: inferCategories(ch.snippet.title, ch.snippet.description),
                follower_count: subs,
                avg_views: Math.round(totalViews / totalVids),
                engagement_rate: er,
                languages: COUNTRY_LANG[country] ?? ["English"],
                ...estimatePrice(subs),
            };

            const { error } = await db.from("creators").upsert(creator, { onConflict: "username" });
            if (error) { console.error(`  ✗   ${handle}: ${error.message}`); skip++; }
            else {
                const fmtSubs = subs >= 1_000_000
                    ? `${(subs / 1_000_000).toFixed(1)}M`
                    : `${(subs / 1_000).toFixed(0)}K`;
                const fmtViews = creator.avg_views >= 1_000_000
                    ? `${(creator.avg_views / 1_000_000).toFixed(1)}M avg`
                    : `${(creator.avg_views / 1_000).toFixed(0)}K avg`;
                console.log(
                    `  ✓   ${creator.name.padEnd(30)} ${fmtSubs.padStart(7)} subs  ${fmtViews.padEnd(12)}  ER ${er}%  ${creator.location}`
                );
                ok++;
            }
            await new Promise(r => setTimeout(r, 300));
        } catch (e) { console.error(`  ✗   ${handle}: ${(e as Error).message}`); skip++; }
    }

    console.log(`\n✅  Done — ${ok} imported, ${skip} skipped.\n`);
}

main();
