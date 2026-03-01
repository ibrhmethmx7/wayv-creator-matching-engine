"use client";

import { trpc } from "@/lib/trpc";
import { Play, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import type { Brief } from "@/lib/schemas";
import { useSelectionContext } from "@/context/SelectionContext";

function BriefCard({ brief }: { brief: Brief }) {
  if (!brief) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 fade-in">
      {/* Outreach Message */}
      <Card className="border-[var(--brand)] border-opacity-30 bg-gradient-to-br from-[var(--surface-2)] to-[var(--background)]">
        <CardHeader className="pb-3 border-b border-[var(--line-soft)] mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--brand)]" />
            Outreach Message
          </CardTitle>
          <CardDescription>Personalized pitch for this creator</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--text)] whitespace-pre-wrap leading-relaxed italic">
            &quot;{brief.outreachMessage}&quot;
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Ideas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[var(--text-faint)]">5 Content Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {brief.contentIdeas?.map((idea, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text-faint)]">
                    {i + 1}
                  </span>
                  <span className="text-[var(--text-dim)] pt-0.5">{idea}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Hook Suggestions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[var(--text-faint)]">3 Hook Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brief.hookSuggestions?.map((hook, i) => (
                <div key={i} className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-dim)] italic">
                  &quot;{hook}&quot;
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BriefPage() {
  const {
    selectedCampaignId,
    selectedCreatorId,
    setSelectedCampaignId,
    setSelectedCreatorId,
  } = useSelectionContext();

  // Using TRPC data
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: creators } = trpc.creator.list.useQuery();

  const generateMut = trpc.brief.generate.useMutation();

  const handleGenerate = () => {
    if (!selectedCampaignId || !selectedCreatorId) return;
    generateMut.mutate({ campaignId: selectedCampaignId, creatorId: selectedCreatorId });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">AI Brief Generator</h1>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Generate personalized briefs (Outreach, 5 Ideas, 3 Hooks).
        </p>
      </div>

      <Card className="border-[var(--line)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold">1. Select Campaign</label>
              <select
                className="flex h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
              >
                <option value="" disabled>Choose campaign...</option>
                {campaigns?.map(c => (
                  <option key={c.id} value={c.id}>{c.brand} - {c.objective}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold">2. Select Targeted Creator</label>
              <select
                className="flex h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCreatorId}
                onChange={(e) => setSelectedCreatorId(e.target.value)}
              >
                <option value="" disabled>Choose creator...</option>
                {creators?.map(c => (
                  <option key={c.id} value={c.id}>
                    @{c.username} ({c.followers.toLocaleString()} - {c.country})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedCampaignId || !selectedCreatorId || generateMut.isPending}
              className={cn(
                "btn flex h-11 items-center justify-center gap-2 px-6",
                (!selectedCampaignId || !selectedCreatorId) && "opacity-50 cursor-not-allowed",
                generateMut.isPending ? "btn-secondary" : "btn-primary"
              )}
            >
              {generateMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {generateMut.isPending ? "Generating..." : "Generate Brief"}
            </button>
          </div>

          {generateMut.isError && (
            <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 flex items-center gap-2">
              <AlertCircle size={16} />
              {generateMut.error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Brief */}
      {generateMut.isSuccess && generateMut.data && (
        <div className="mt-8">
          <BriefCard brief={generateMut.data} />
        </div>
      )}

    </div>
  );
}
