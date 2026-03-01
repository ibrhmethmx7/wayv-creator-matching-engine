import { router, publicProcedure } from "../trpc";
import { DashboardStatsSchema } from "@/lib/schemas";
import { campaignRepository } from "@/server/repositories/campaign.repository";
import { creatorRepository } from "@/server/repositories/creator.repository";
import { briefRepository } from "@/server/repositories/brief.repository";

export const statsRouter = router({
    dashboard: publicProcedure
        .output(DashboardStatsSchema)
        .query(async () => {
            const [totalCampaigns, totalCreators, totalBriefsGenerated] = await Promise.all([
                campaignRepository.count(),
                creatorRepository.count(),
                briefRepository.totalGenerated(),
            ]);
            return { totalCampaigns, totalCreators, totalBriefsGenerated };
        }),
});
