import { router } from "./trpc";
import { campaignRouter } from "./routers/campaign";
import { creatorRouter } from "./routers/creator";
import { matchRouter } from "./routers/match";
import { briefRouter } from "./routers/brief";
import { statsRouter } from "./routers/stats";

export const appRouter = router({
    campaign: campaignRouter,
    creator: creatorRouter,
    match: matchRouter,
    brief: briefRouter,
    stats: statsRouter,
});

export type AppRouter = typeof appRouter;
