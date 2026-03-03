import { supabase } from "@/lib/supabase";
import { CampaignSchema, type Campaign } from "@/lib/schemas";
import { z } from "zod";

export type CreateCampaignInput = Omit<Campaign, "id">;

export const campaignRepository = {
    async create(input: CreateCampaignInput): Promise<Campaign> {
        const { data, error } = await supabase()
            .from("campaigns")
            .insert({ ...input, id: crypto.randomUUID() })
            .select()
            .single();
        if (error) throw new Error(`[CampaignRepository.create] ${error.message}`);
        return CampaignSchema.parse(data);
    },

    async findAll(): Promise<Campaign[]> {
        const { data, error } = await supabase()
            .from("campaigns")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw new Error(`[CampaignRepository.findAll] ${error.message}`);
        return z.array(CampaignSchema).parse(data ?? []);
    },

    async findById(id: string): Promise<Campaign> {
        const { data, error } = await supabase()
            .from("campaigns")
            .select("*")
            .eq("id", id)
            .single();
        if (error || !data) throw new Error(`[CampaignRepository.findById] ${error?.message ?? "Not found"}`);
        return CampaignSchema.parse(data);
    },

    async count(): Promise<number> {
        const { count, error } = await supabase()
            .from("campaigns")
            .select("*", { count: "exact", head: true });
        if (error) throw new Error(`[CampaignRepository.count] ${error.message}`);
        return count ?? 0;
    },

    async updateStatus(id: string, status: "active" | "archived" | "draft"): Promise<void> {
        const { error } = await supabase()
            .from("campaigns")
            .update({ status })
            .eq("id", id);
        if (error) throw new Error(`[CampaignRepository.updateStatus] ${error.message}`);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase()
            .from("campaigns")
            .delete()
            .eq("id", id);
        if (error) throw new Error(`[CampaignRepository.delete] ${error.message}`);
    },
};
