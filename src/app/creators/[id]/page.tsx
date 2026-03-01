"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Zap, FileText, TrendingUp, Eye, ThumbsUp, MessageCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmt = (n: number): string =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
        n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` :
            String(n);

const ER_TIER = (er: number) =>
    er >= 6 ? { label: "🔥 Top Tier", cls: "badge-ok" } :
        er >= 3 ? { label: "✓ Good", cls: "badge-brand" } :
            { label: "~Low", cls: "badge" };

function timeAgo(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}


export default function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: creator, isLoading, isError } = trpc.creator.byId.useQuery({ id });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--line-soft)] bg-[var(--surface)]" />
                ))}
            </div>
        );
    }

    if (isError || !creator) {
        return (
            <div className="space-y-3">
                <Link href="/creators" className="btn-secondary inline-flex"><ArrowLeft size={14} /> Creators</Link>
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>Creator not found.</p>
            </div>
        );
    }

    const initials = creator.username.slice(0, 2).toUpperCase();
    const { label: erLabel, cls: erCls } = ER_TIER(Number(creator.engagement_rate));

    return (
        <div className="space-y-5" style={{ maxWidth: 800 }}>
            <Link href="/creators" className="btn-secondary inline-flex"><ArrowLeft size={14} /> All Creators</Link>

            {/* Hero */}
            <Card>
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-xl font-black">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-black tracking-tight">@{creator.username}</h1>
                        <p className="text-sm" style={{ color: "var(--text-dim)" }}>{creator.country}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className={cn("badge", erCls)}>{erLabel} {Number(creator.engagement_rate).toFixed(1)}% ER</span>
                            {creator.niches.map((c) => <span key={c} className="badge badge-brand">{c}</span>)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/match" className="btn-secondary"><Zap size={14} /> Match</Link>
                        <Link href="/brief" className="btn-secondary"><FileText size={14} /> Brief</Link>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: "Followers", value: fmt(creator.followers) },
                    { label: "Engagement", value: Number(creator.engagement_rate).toFixed(1) + "%" },
                    { label: "Avg Watch Time", value: creator.avg_watch_time + "s" },
                    { label: "Content Style", value: creator.content_style },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                            <p className="mt-1 text-xl font-black">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>


            {/* Brand Safety */}
            {creator.brand_safety_flags.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><ArrowLeft size={16} /> Brand Safety Flags</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {creator.brand_safety_flags.map((l) => <span key={l} className="badge bg-red-500/10 text-red-500 border-red-500/20">{l}</span>)}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
