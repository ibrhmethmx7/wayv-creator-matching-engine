"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import type { Creator } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

const ER_TIER = (er: number) =>
  er >= 6 ? { label: "🔥 Top", cls: "badge-ok" } :
    er >= 3 ? { label: "✓ Good", cls: "badge-brand" } :
      { label: "~Low", cls: "badge" };

const fmt = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` :
      String(n);

export default function CreatorsPage() {
  const { data: creators, isLoading } = trpc.creator.list.useQuery();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");

  const filtered = (creators ?? []).filter(
    (c) =>
      !search ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.niches.some((cat) => cat.toLowerCase().includes(search.toLowerCase()))
  );

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="space-y-5">
      <header className="page-head">
        <span className="page-kicker">Creators</span>
        <h1 className="page-title">Creator Directory</h1>
        <p className="page-sub">
          {creators?.length ?? 0} creators in the pool
        </p>
      </header>

      {/* Search bar */}
      <input
        className="input"
        style={{ maxWidth: 380 }}
        placeholder="Search by name, location or category…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No creators match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => <CreatorCard key={c.id} creator={c} />)}
          </div>

          {/* Show more / Show fewer */}
          {(hasMore || visible > PAGE_SIZE) && (
            <div className="flex items-center gap-3">
              {hasMore && (
                <button
                  className="btn-secondary"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Show more ({filtered.length - visible} remaining)
                </button>
              )}
              {visible > PAGE_SIZE && (
                <button
                  className="btn-secondary"
                  onClick={() => setVisible(PAGE_SIZE)}
                  style={{ color: "var(--text-faint)" }}
                >
                  Collapse
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-[var(--text-faint)]">
            Showing {shown.length} of {filtered.length} creators
          </p>
        </>
      )}
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  const initials = creator.username.slice(0, 2).toUpperCase();
  const { label: erLabel, cls: erCls } = ER_TIER(Number(creator.engagement_rate));

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="flex flex-col gap-3 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--brand)]"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--text)]">@{creator.username}</p>
          <p className="text-xs text-[var(--text-dim)]">{creator.country}</p>
        </div>
      </div>

      {/* Key stats row */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className={cn("badge", erCls)}>{erLabel} {Number(creator.engagement_rate).toFixed(1)}% ER</span>
        <span className="badge">{fmt(creator.followers)} followers</span>
        <span className="badge">{creator.avg_watch_time}s watch time</span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5">
        {creator.niches.map((cat) => (
          <span key={cat} className="badge badge-brand">{cat}</span>
        ))}
      </div>

      {/* Avg views footer */}
      <div className="mt-auto border-t border-[var(--line-soft)] pt-2.5 text-xs text-[var(--text-faint)]">
        {creator.content_style} · {creator.primary_hook_type}
      </div>
    </Link>
  );
}
