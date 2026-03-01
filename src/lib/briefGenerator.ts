import crypto from "crypto";
import { supabase } from "./supabase";
import { BriefSchema, type Brief, type Campaign, type Creator } from "./schemas";
import OpenAI from "openai";

const TTL_MS = 60 * 60 * 1000; // 1 hour cache per campaign+creator+model combo

let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _openai;
}

// Deterministic prompt hashing for cache invalidation
function hashInput(campaign: Campaign, creator: Creator, model: string): string {
    const payload = JSON.stringify({
        campaignId: campaign.id,
        creatorId: creator.id,
        brand: campaign.brand,
        objective: campaign.objective,
        tone: campaign.tone,
        creatorStyle: creator.content_style,
        niches: creator.niches,
        model
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
}

async function getCached(campaignId: string, creatorId: string, inputHash: string): Promise<Brief | null> {
    const { data } = await supabase()
        .from("ai_briefs")
        .select("response_json, updated_at, prompt_hash")
        .eq("campaign_id", campaignId)
        .eq("creator_id", creatorId)
        .limit(1)
        .single();

    if (!data) return null;

    // Hash mismatch = Campaign or Creator data changed, cache is invalid
    if (data.prompt_hash !== inputHash) return null;

    const row = data as { response_json: unknown; updated_at: string };

    // TTL Check
    if (Date.now() - new Date(row.updated_at).getTime() > TTL_MS) return null;

    const parsed = BriefSchema.safeParse(row.response_json);
    return parsed.success ? parsed.data : null;
}

async function saveToCache(campaignId: string, creatorId: string, inputHash: string, responseJson: Brief, model: string, errorCount: number) {
    // Upsert mechanism manually via matching unique (campaign_id, creator_id)
    const { error } = await supabase()
        .from("ai_briefs")
        .upsert({
            campaign_id: campaignId,
            creator_id: creatorId,
            model,
            prompt_hash: inputHash,
            response_json: responseJson,
            error_count: errorCount,
            updated_at: new Date().toISOString()
        }, { onConflict: 'campaign_id,creator_id' });

    if (error) console.error("[Cache Save Error]", error);
}

function makePrompt(campaign: Campaign, creator: Creator): string {
    return `You are an AI Influencer Marketing Strategist. Generate a highly personalized brief for a creator.

CAMPAIGN:
- Brand: ${campaign.brand}
- Objective: ${campaign.objective}
- Tone: ${campaign.tone}
- Target Demographics: ${campaign.target_age_range}, ${campaign.target_gender} in ${campaign.target_country}
- Do NOT use these words: ${campaign.do_not_use_words.join(", ")}

CREATOR:
- Username: @${creator.username}
- Niches: ${creator.niches.join(", ")}
- Content Style: ${creator.content_style}
- Primary Hook Style: ${creator.primary_hook_type}

Return ONLY valid JSON. The output must strictly follow this exact schema:
{
  "outreachMessage": "A personalized message to the creator offering the campaign (max 3 sentences)",
  "contentIdeas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"],
  "hookSuggestions": ["Hook 1", "Hook 2", "Hook 3"]
}`;
}

function repairPrompt(badJson: string, errorMsg: string): string {
    return `The previous output was INVALID JSON or failed schema validation: ${errorMsg}.

Fix the malformed JSON and return ONLY the corrected JSON. Do not include markdown blocks like \`\`\`json.
Required exact keys: outreachMessage (string), contentIdeas (array of 5 strings), hookSuggestions (array of 3 strings).

Bad Output:
${badJson}`;
}

async function callOpenAI(prompt: string, modelParam: "gpt-4o-mini" | "gpt-4o" = "gpt-4o-mini"): Promise<string> {
    const res = await getOpenAI().chat.completions.create({
        model: modelParam,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
    });
    return res.choices[0]?.message.content ?? "";
}

function formatUnknownError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Generates an AI Brief for a specific Campaign + Creator pair.
 * Incorporates: Cost awareness (cache), Schema Validation, Retry/Repair loop, and Model Fallbacks.
 */
export async function generateBrief(campaign: Campaign, creator: Creator): Promise<Brief> {
    let currentModel: "gpt-4o-mini" | "gpt-4o" = "gpt-4o-mini";
    const inputHash = hashInput(campaign, creator, currentModel);

    // 1. Check Cache
    const cached = await getCached(campaign.id, creator.id, inputHash);
    if (cached) return cached;

    let raw = "";
    let errorCount = 0;
    let parsed: ReturnType<typeof BriefSchema.safeParse> | null = null;
    let lastError: unknown = null;

    // 2. Initial Call
    try {
        raw = await callOpenAI(makePrompt(campaign, creator), currentModel);
        parsed = BriefSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) lastError = parsed.error;
    } catch (error: unknown) {
        errorCount++;
        lastError = error;
    }

    // 3. Retry 1: Repair Prompt
    if (!parsed?.success) {
        errorCount++;
        const errMsg = lastError ? formatUnknownError(lastError) : "Syntax Error";
        try {
            raw = await callOpenAI(repairPrompt(raw, errMsg), currentModel);
            parsed = BriefSchema.safeParse(JSON.parse(raw));
            if (!parsed.success) lastError = parsed.error;
        } catch (error: unknown) {
            lastError = error;
        }
    }

    // 4. Retry 2: Hard Block / Model Fallback to gpt-4o for complex reasoning structure issues
    if (!parsed?.success) {
        errorCount++;
        currentModel = "gpt-4o"; // fallback
        const hardPrompt = makePrompt(campaign, creator) + "\n\nCRITICAL: YOU MUST RETURN ONLY VALID JSON MATCHING THE EXACT SCHEMA.";
        try {
            raw = await callOpenAI(hardPrompt, currentModel);
            parsed = BriefSchema.safeParse(JSON.parse(raw));
            if (!parsed.success) {
                throw new Error(`Brief generation critically failed after 2 retries and model fallback. Last Error: ${parsed.error.message}`);
            }
        } catch (error: unknown) {
            throw new Error(`Brief generation critically failed after 2 retries and model fallback. Last Error: ${formatUnknownError(error)}`);
        }
    }

    if (!parsed?.success) throw new Error(`Brief generation failed schema validation after all retries.`);

    // 5. Persist to DB (cache)
    await saveToCache(campaign.id, creator.id, inputHash, parsed.data, currentModel, errorCount);

    return parsed.data;
}
