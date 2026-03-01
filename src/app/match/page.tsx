"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Play, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/lib/schemas";

function BreakdownTooltip({ bd }: { bd: ScoreBreakdown }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex justify-between gap-4"><span>Niche:</span> <span>+{bd.nicheMatch}/30</span></div>
      <div className="flex justify-between gap-4"><span>Audience Country:</span> <span>+{bd.audienceCountryMatch}/20</span></div>
      <div className="flex justify-between gap-4"><span>Engagement:</span> <span>+{bd.engagementWeight}/15</span></div>
      <div className="flex justify-between gap-4"><span>Watch Time:</span> <span>+{bd.watchTimeFit}/15</span></div>
      <div className="flex justify-between gap-4"><span>Follower Fit:</span> <span>+{bd.followerFit}/10</span></div>
      <div className="flex justify-between gap-4"><span>Hook Sync:</span> <span>+{bd.hookMatch}/10</span></div>
      {bd.brandSafetyPenalty < 0 && (
        <div className="flex justify-between gap-4 text-red-400 font-bold border-t border-red-500/20 pt-1 mt-1">
          <span>Brand Safety Penalty:</span> <span>{bd.brandSafetyPenalty}</span>
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: creatorsObj } = trpc.creator.list.useQuery();
  const creatorsMap = new Map(creatorsObj?.map(c => [c.id, c]));

  const matchQuery = trpc.match.getTopCreators.useQuery(
    { campaignId: selectedCampaign, limit: 20 },
    { enabled: false }
  );

  const handleRun = () => {
    if (!selectedCampaign) return;
    matchQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Campaign Match Engine</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">Scoring algorithm based on Niche (30), Country (20), ER (15), Watch Time (15), Followers (10), Hook (10).</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center">
        <select
          className="flex-1 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
        >
          <option value="" disabled>Select a campaign to match...</option>
          {campaigns?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.brand} — {c.objective} ({c.target_country})
            </option>
          ))}
        </select>

        <button
          onClick={handleRun}
          disabled={!selectedCampaign || matchQuery.isFetching}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {matchQuery.isFetching ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {matchQuery.isFetching ? "Running Engine..." : "Run Match"}
        </button>
      </div>

      {matchQuery.isSuccess && matchQuery.data && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Top 20 Creators Ranked</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchQuery.data.creators.map((match, i) => {
              const creator = creatorsMap.get(match.creatorId);
              if (!creator) return null;

              const isBrandRisk = match.scoreBreakdown.brandSafetyPenalty < 0;

              return (
                <Link
                  key={match.creatorId}
                  href={`/creators/${match.creatorId}`}
                  className={cn(
                    "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all hover:border-[var(--brand-alpha)] hover:bg-[var(--surface-2)]",
                    isBrandRisk ? "border-red-500/20" : "border-[var(--line-soft)] bg-[var(--surface)]"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Rank Badge */}
                      <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-3)] text-[10px] font-black border border-[var(--lineSoft)]">
                        #{i + 1}
                      </div>
                      <h3 className="text-lg font-bold">@{creator.username}</h3>
                      <p className="text-xs text-[var(--text-dim)]">{creator.followers.toLocaleString()} • {creator.country}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-2xl font-black tabular-nums text-[var(--brand)] group-hover:text-[var(--brand-light)]">
                        {match.totalScore}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Score</span>
                    </div>
                  </div>

                  {/* Breakdown Mini UI */}
                  <div className="rounded border border-[var(--line-soft)] bg-[#00000020] p-2">
                    <BreakdownTooltip bd={match.scoreBreakdown} />
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <Badge className="border-neutral-200">{Number(creator.engagement_rate).toFixed(1)}% ER</Badge>
                    {isBrandRisk && <Badge className="text-red-400 border-red-500/30 bg-red-500/10"><ShieldAlert size={10} className="mr-1" /> Risk</Badge>}
                    <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowRight size={16} className="text-[var(--brand)]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
