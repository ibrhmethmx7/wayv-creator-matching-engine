"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Plus, Zap, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NICHES = ["Fashion", "Beauty", "Tech", "Gaming", "Food", "Travel", "Fitness", "Lifestyle", "Finance", "Music"];
const LOCATIONS = ["United States", "UK", "Germany", "Turkey", "Global"];
const HOOKS = ["Storyline", "Product Demo", "Educational", "Shock Value", "Aesthetic"];

export default function CampaignsPage() {
  const [form, setForm] = useState({
    brand: "",
    objective: "",
    target_country: "United States",
    target_gender: "All",
    target_age_range: "18-35",
    niches: [] as string[],
    preferred_hook_types: [] as string[],
    min_avg_watch_time: "",
    min_followers: "",
    max_followers: "",
    tone: "Authentic",
    do_not_use_words: "",
  });

  const { data: campaigns, refetch } = trpc.campaign.list.useQuery();
  const create = trpc.campaign.create.useMutation({
    onSuccess: () => {
      refetch();
      setForm({
        brand: "",
        objective: "",
        target_country: "United States",
        target_gender: "All",
        target_age_range: "18-35",
        niches: [],
        preferred_hook_types: [],
        min_avg_watch_time: "",
        min_followers: "",
        max_followers: "",
        tone: "Authentic",
        do_not_use_words: "",
      });
    },
  });
  // Legacy status mutations removed for simplicity as the assessment didn't request them tightly, 
  // but keeping delete for utility.
  const deleteCampaign = trpc.campaign.delete.useMutation({
    onSuccess: () => refetch(),
  });

  function toggle(values: string[], item: string) {
    return values.includes(item) ? values.filter((v) => v !== item) : [...values, item];
  }

  return (
    <div className="space-y-5">
      <header className="page-head">
        <span className="page-kicker">Campaigns</span>
        <h1 className="page-title">Campaign Composer</h1>
        <p className="page-sub">Rebuilt page structure. Same backend actions.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({
                  brand: form.brand,
                  objective: form.objective,
                  target_country: form.target_country,
                  target_gender: form.target_gender,
                  target_age_range: form.target_age_range,
                  niches: form.niches,
                  preferred_hook_types: form.preferred_hook_types,
                  min_avg_watch_time: Number(form.min_avg_watch_time),
                  min_followers: Number(form.min_followers),
                  max_followers: Number(form.max_followers),
                  tone: form.tone,
                  do_not_use_words: form.do_not_use_words.split(",").map(w => w.trim()).filter(Boolean)
                });
              }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="input" placeholder="Brand Name" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} required />
                <input className="input" placeholder="Objective (e.g. Awareness)" value={form.objective} onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="input" placeholder="Min Followers" type="number" value={form.min_followers} onChange={(e) => setForm((p) => ({ ...p, min_followers: e.target.value }))} required />
                <input className="input" placeholder="Max Followers" type="number" value={form.max_followers} onChange={(e) => setForm((p) => ({ ...p, max_followers: e.target.value }))} required />
                <input className="input" placeholder="Min Watch Time (s)" type="number" value={form.min_avg_watch_time} onChange={(e) => setForm((p) => ({ ...p, min_avg_watch_time: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select className="input" value={form.target_country} onChange={(e) => setForm((p) => ({ ...p, target_country: e.target.value }))}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <input className="input" placeholder="Target Gender" value={form.target_gender} onChange={(e) => setForm((p) => ({ ...p, target_gender: e.target.value }))} required />
                <input className="input" placeholder="Target Age Range (e.g. 18-24)" value={form.target_age_range} onChange={(e) => setForm((p) => ({ ...p, target_age_range: e.target.value }))} required />
              </div>

              <input className="input" placeholder="Tone (e.g. Trustworthy)" value={form.tone} onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))} required />
              <input className="input" placeholder="Do Not Use Words (comma separated)" value={form.do_not_use_words} onChange={(e) => setForm((p) => ({ ...p, do_not_use_words: e.target.value }))} />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-faint)]">Niches</p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((c) => {
                    const active = form.niches.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, niches: toggle(p.niches, c) }))}
                        className={cn("badge", active && "badge-brand")}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-faint)]">Preferred Hooks</p>
                <div className="flex flex-wrap gap-2">
                  {HOOKS.map((l) => {
                    const active = form.preferred_hook_types.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, preferred_hook_types: toggle(p.preferred_hook_types, l) }))}
                        className={cn("badge", active && "badge-brand")}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="btn-primary" disabled={create.isPending}>
                <Plus className="h-4 w-4" /> {create.isPending ? "Creating..." : "Create Campaign"}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!campaigns?.length ? (
              <p className="text-sm text-[var(--text-dim)]">No campaigns yet.</p>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{c.objective}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-dim)]">{c.brand} · {c.target_country} · {c.min_followers.toLocaleString()}-{c.max_followers.toLocaleString()} target group</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link className="btn-secondary" href={`/match`}><Zap className="h-4 w-4" /> Match</Link>
                    <Link className="btn-secondary" href={`/brief`}><FileText className="h-4 w-4" /> Brief</Link>

                    <button
                      className="btn-secondary"
                      style={{ color: "var(--bad, #f26c6c)", marginLeft: "auto" }}
                      disabled={deleteCampaign.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete campaign for "${c.brand}"? This cannot be undone.`)) {
                          deleteCampaign.mutate({ id: c.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
