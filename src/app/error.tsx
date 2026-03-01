"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div style={{ padding: 40, maxWidth: 560 }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faint)", fontWeight: 700, marginBottom: 12 }}>Error</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-dim)", marginBottom: 20 }}>{error.message}</p>
            <button onClick={reset} className="btn-primary">Try again</button>
        </div>
    );
}
