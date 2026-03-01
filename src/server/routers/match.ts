import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { creatorRepository } from "@/server/repositories/creator.repository";
import { campaignRepository } from "@/server/repositories/campaign.repository";
import { calculateMatchScore } from "@/lib/scoring";
import { MatchResultSchema } from "@/lib/schemas";
import { TRPCError } from "@trpc/server";

export const matchRouter = router({
    getTopCreators: publicProcedure
        .input(z.object({
            campaignId: z.string(),
            limit: z.number().int().min(1).max(50).default(20)
        }))
        .output(z.object({
            creators: z.array(MatchResultSchema)
        }))
        .query(async ({ input }) => {
            console.log(`[MatchRequest] campaignId=${input.campaignId}`);

            const campaign = await campaignRepository.findById(input.campaignId);
            if (!campaign) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Campaign not found with ID ${input.campaignId}`
                });
            }

            const creators = await creatorRepository.findAll();

            // Calculate score for all creators and filter out Hard Rejects (negative infinity)
            const scored = creators.map((creator) => calculateMatchScore(campaign, creator));

            // Tie-break strategy: Total Score DESC, Engagement Rate DESC, Follower DESC
            scored.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;

                const cA = creators.find(x => x.id === a.creatorId);
                const cB = creators.find(x => x.id === b.creatorId);

                if (cA && cB && cB.engagement_rate !== cA.engagement_rate) {
                    return cB.engagement_rate - cA.engagement_rate;
                }

                if (cA && cB) {
                    return cB.followers - cA.followers;
                }

                return 0;
            });

            return {
                creators: scored.slice(0, input.limit)
            };
        }),
});
