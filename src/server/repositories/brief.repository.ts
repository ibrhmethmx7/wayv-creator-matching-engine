import { supabase } from "@/lib/supabase";
import { BriefSchema, type Brief } from "@/lib/schemas";

const TTL_MS = 10 * 60 * 1000;

export const briefRepository = {
    async findByHash(inputHash: string): Promise<Brief | null> {
        const { data } = await supabase()
            .from("ai_briefs")
            .select("brief, created_at")
            .eq("input_hash", inputHash)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!data) return null;
        const row = data as { brief: unknown; created_at: string };
        if (Date.now() - new Date(row.created_at).getTime() > TTL_MS) return null;

        const parsed = BriefSchema.safeParse(row.brief);
        return parsed.success ? parsed.data : null;
    },

    async save(campaignId: string, inputHash: string, brief: Brief): Promise<void> {
        const { error } = await supabase()
            .from("ai_briefs")
            .insert({ campaign_id: campaignId, input_hash: inputHash, brief });
        if (error) throw new Error(`[BriefRepository.save] ${error.message}`);
    },

    async countByCampaign(campaignId: string): Promise<number> {
        const { count, error } = await supabase()
            .from("ai_briefs")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaignId);
        if (error) throw new Error(`[BriefRepository.countByCampaign] ${error.message}`);
        return count ?? 0;
    },

    async totalGenerated(): Promise<number> {
        const { count, error } = await supabase()
            .from("ai_briefs")
            .select("*", { count: "exact", head: true });
        if (error) throw new Error(`[BriefRepository.totalGenerated] ${error.message}`);
        return count ?? 0;
    },

    async recent(limit = 10): Promise<Array<{ id: string; campaignId: string; campaignTitle: string; createdAt: string; brief: unknown }>> {
        const { data, error } = await supabase()
            .from("ai_briefs")
            .select("id, campaign_id, brief, created_at, campaigns(title)")
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error) throw new Error(`[BriefRepository.recent] ${error.message}`);
        type BriefRow = { id: string; campaign_id: string; brief: unknown; created_at: string; campaigns: { title: string } | null };
        return ((data ?? []) as unknown as BriefRow[]).map((row) => ({
            id: row.id,
            campaignId: row.campaign_id,
            campaignTitle: row.campaigns?.title ?? "Unknown Campaign",
            createdAt: row.created_at,
            brief: row.brief,
        }));
    },
};
