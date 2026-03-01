# Wayv AI Influencer Toolkit

An AI-powered influencer marketing platform built as part of the Wayv technical assessment, focused on creator discovery, campaign matching, and intelligent brief generation.

This project uses a Next.js (App Router) + tRPC frontend and a Supabase (Postgres) backend to power a clean, robust, and explainable creator matching engine and OpenAI-assisted brief generator.

---

##  Trade-offs & Development Notes

### Hybrid Columnar + JSONB Approach
For the database schema, I chose a pragmatic **hybrid approach** to store Creators and Campaigns rather than heavily normalizing every field:
- **Trade-off:** By keeping queryable fields (e.g., `followers`, `engagement_rate`, `country`) as standard Postgres columns, we get fast database filtering. Deeply nested data (`audience distribution`, `last_posts`, `niches`) are kept as `JSONB`. This trades strict normalization for massive flexibility and read performance.

### AI Brief Caching & Cost Awareness
- **Development Note:** The GPT models (especially long system prompts generating strict JSONs) can be expensive and slow. I implemented a robust caching layer using a cryptographic SHA-256 hash. If the input parameters `(campaign + creator)` haven't changed, the backend skips the OpenAI API and serves the cached `ai_brief` immediately.
To ensure **Cost Awareness** with the LLM API, generation inputs are processed into a cryptographic SHA-256 hash. The `ai_briefs` table stores the `prompt_hash`, `response_json`, `model`, and an `error_count` tracking diagnostic metrics. If a specific Campaign + Creator pair hasn't changed its core properties within a 1-hour window, the API seamlessly returns cached JSON instead of repeatedly burning OpenAI tokens.

---

## Scoring Engine Explanation (`src/lib/scoring.ts`)

The ranker computes a normalized total composite score (0-100) using a strict breakdown weighting formula.

**Tie-Breaking Engine Rules:**
1. Highest `totalScore` wins.
2. If total scores tie, the creator with the highest `engagement_rate` takes priority.
3. If they still tie, the creator with the absolute most `followers` wins.

**Algorithm Highlights:**
- **Brand Safety (Hard Reject / Penalties):** Intersects campaign `do_not_use_words` against creator `brand_safety_flags`. Deducts 5 points from the total score per risk flag overlap. 
- **Engagement Fit (Max 15 points):** The industry average ER is ~1-3%. The function aggressively rewards engagement, acting as a linear slider up to an `EXCELLENT_ER` of 10% (avoiding penalizing true nano-influencers who push 15%+).
- **Follower Fit (Max 10 points):** Uses a decay equation when outside the `min_followers` / `max_followers` range so near-omissions still score reasonably well instead of zeroing out.

---

##  AI Brief Generator (`src/lib/briefGenerator.ts`)

The brief API accepts a `Campaign` and a targeted `Creator`, constructing a heavily personalized instruction context with rigid JSON formatting strings to map correctly to `BriefSchema`.

**Generator Architecture & Resiliency:**
1. **Cache Lookups First:** Checks Supabase `ai_briefs` matching the internal unique SHA-256 params hash.
2. **Model Selection:** Defaults to `gpt-4o-mini` for high speed & low cost.
3. **Structured Outputs:** Forces `response_format: { type: "json_object" }` alongside a strict example in the system prompt.
4. **Retry & Repair Loop:** If Zod parsing of the raw JSON fails (malformed fields, missed arrays), the engine loops back and pings the LLM with a highly specific "Repair Prompt" feeding it the exact Zod errors and the malformed text. 
5. **Model Fallbacks:** If the repair prompt fails after 1 retry, the engine promotes the context to the heavier, smarter `gpt-4o` layer as a last resort before failing.

---

##  Running the Platform Locally

### Prerequisites
1. Node.js (v20+)
2. Supabase project with a Service Role Key
3. OpenAI API Key

### Configuration
Create a `.env.local` file at the root tracking:

```env
# Create a .env.local file with these variables
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

### Installation & Initialization
1. `npm install`
2. Run SQL located inside `supabase/migrations/003_assessment_schema.sql` against your Supabase SQL editor.
3. Seed the local Database with the provided `.json` data using the CLI script:
   `npm run seed`
4. Test the backend scoring engine locally by running the custom verification script:
   `npx tsx supabase/test_match.ts`
5. Start the frontend Dashboard:
   `npm run dev`

Visit `http://localhost:3000` to interact with the Dashboard, Creator Roster, Matching Engine, and AI Brief tool!
