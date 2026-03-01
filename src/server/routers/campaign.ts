import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { CampaignSchema } from "@/lib/schemas";
import { campaignRepository } from "@/server/repositories/campaign.repository";

const CreateCampaignInput = CampaignSchema.omit({
    id: true,
});

export const campaignRouter = router({
    create: publicProcedure
        .input(CreateCampaignInput)
        .output(CampaignSchema)
        .mutation(({ input }) => campaignRepository.create(input)),

    list: publicProcedure
        .output(z.array(CampaignSchema))
        .query(() => campaignRepository.findAll()),

    byId: publicProcedure
        .input(z.object({ id: z.string() }))
        .output(CampaignSchema)
        .query(({ input }) => campaignRepository.findById(input.id)),

    updateStatus: publicProcedure
        .input(z.object({ id: z.string(), status: z.enum(["active", "archived", "draft"]) }))
        .mutation(({ input }) => campaignRepository.updateStatus(input.id, input.status)),

    delete: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ input }) => campaignRepository.delete(input.id)),
});
