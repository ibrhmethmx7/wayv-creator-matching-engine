import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { generateBrief } from "@/lib/briefGenerator";
import { BriefSchema } from "@/lib/schemas";
import { campaignRepository } from "@/server/repositories/campaign.repository";
import { creatorRepository } from "@/server/repositories/creator.repository";
import { supabase } from "@/lib/supabase";

export const briefRouter = router({
    // Get brief history for UI
    history: publicProcedure
        .output(z.array(z.object({
            id: z.string(),
            campaign_id: z.string(),
            creator_id: z.string().nullable(),
            brief: z.any(),
            created_at: z.string()
        })))
        .query(async () => {
            const { data } = await supabase()
                .from("ai_briefs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);
            return (data ?? []).map((row: any) => ({
                id: row.id,
                campaign_id: row.campaign_id,
                creator_id: row.creator_id,
                brief: row.response_json, // mapping back to old frontend expectation temporarily
                created_at: row.created_at
            }));
        }),

    // Generate strict outreach/hook/idea brief per campaign+creator
    generate: publicProcedure
        .input(z.object({
            campaignId: z.string(),
            creatorId: z.string()
        }))
        .output(BriefSchema)
        .mutation(async ({ input }) => {
            console.log(`[BriefGen Request] Campaign=${input.campaignId} Creator=${input.creatorId}`);

            const campaign = await campaignRepository.findById(input.campaignId);
            if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

            const creator = await creatorRepository.findById(input.creatorId);
            if (!creator) throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });

            try {
                const result = await generateBrief(campaign, creator);
                return result;
            } catch (error: any) {
                console.error("[BriefGen failed]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to generate brief: ${error.message}`
                });
            }
        })
});
