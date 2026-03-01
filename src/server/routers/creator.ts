import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { CreatorSchema } from "@/lib/schemas";
import { creatorRepository } from "@/server/repositories/creator.repository";

export const creatorRouter = router({
    list: publicProcedure
        .output(z.array(CreatorSchema))
        .query(() => creatorRepository.findAll()),

    byId: publicProcedure
        .input(z.object({ id: z.string() }))
        .output(CreatorSchema)
        .query(({ input }) => creatorRepository.findById(input.id)),


    topByEngagement: publicProcedure
        .input(z.object({ limit: z.number().int().max(20).default(5) }))
        .output(z.array(CreatorSchema))
        .query(({ input }) => creatorRepository.topByEngagement(input.limit)),
});
