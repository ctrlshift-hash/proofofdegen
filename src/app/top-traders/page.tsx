"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { formatNumber } from "@/lib/utils";
import { TOP_TRADER_PROFILES, TopTraderProfile } from "@/lib/top-trader-profiles";
import WhoToFollow from "@/components/sidebar/WhoToFollow";
import { NEWS_ARTICLES } from "@/lib/news";

export default function TopTradersPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<TopTraderProfile | null>(null);
  const [sortBy, setSortBy] = useState<"sol" | "name">("sol");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const entries = await Promise.all(
          TOP_TRADER_PROFILES.map(async (p) => {
            try {
              const res = await fetch(`/api/wallets/balance?address=${p.wallet}`);
              if (!res.ok) return [p.wallet, undefined] as const;
              const data = await res.json();
              return [p.wallet, data.sol as number] as const;
            } catch { return [p.wallet, undefined] as const; }
          })
        );
        if (cancelled) return;
        const map: Record<string, number> = {};
        entries.forEach(([w, sol]) => { if (sol !== undefined) map[w] = sol; });
        setBalances(map);
      } catch {}
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Importer disabled (manual-only mode)

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4">Top Traders</h1>
        <p className="text-sm text-muted-foreground mb-6">Manual list (like Jeet Leaderboard). Edit <code className="font-mono">src/lib/top-trader-profiles.ts</code> to add or update wallets and trades.</p>

        {/* Controls (timeframe removed, sort retained) */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input text-sm h-10 py-2 leading-normal w-full md:w-64 pr-8 appearance-none"
          >
            <option value="sol">Sort: SOL balance</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {TOP_TRADER_PROFILES.length === 0 ? (
          <div className="card p-8 text-center text-muted-foreground">No traders yet. Add entries to the manual list.</div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
            {[...TOP_TRADER_PROFILES]
              .filter(p => new Set(["Cupsey","Jijo","Cented","West","Mercy","Sheep"]).has(p.name))
              .sort((a,b)=> {
                if (sortBy === "name") return a.name.localeCompare(b.name);
                const aSol = balances[a.wallet];
                const bSol = balances[b.wallet];
                const aVal = typeof aSol === "number" ? aSol : -Infinity;
                const bVal = typeof bSol === "number" ? bSol : -Infinity;
                return bVal - aVal;
              })
              .map((p, idx) => (
              <div key={p.wallet} className="flex items-center gap-3 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-4 hover:bg-accent transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center text-white font-semibold">
                  {p.pfpUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.pfpUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{p.name?.[0]?.toUpperCase() || "T"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button className="font-semibold truncate hover:underline text-left" onClick={() => setSelected(p)}>{p.name}</button>
                    <span className="inline-flex items-center rounded-full bg-degen-purple/15 text-degen-purple px-2 py-0.5 text-[11px]">
                      {balances[p.wallet] !== undefined ? `${balances[p.wallet].toFixed(3)} SOL` : "SOL n/a"}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-muted-foreground">• {p.worstTrades?.length || 0} trades</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    <button
                      onClick={() => copyToClipboard(p.wallet)}
                      className="hover:underline decoration-dotted"
                      title={copied === p.wallet ? "Copied!" : "Click to copy"}
                    >
                      {p.wallet}
                    </button>
                    {copied === p.wallet && <span className="ml-2 text-[11px] text-green-400">Copied</span>}
                  </div>
                  {/* Mini recent tokens */}
                  {p.worstTrades && p.worstTrades.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.worstTrades.slice(0, 3).map((t, i) => (
                        <a
                          key={i}
                          href={t.tokenUrl || "#"}
                          target={t.tokenUrl ? "_blank" : undefined}
                          className="inline-flex items-center max-w-[10rem] gap-1 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] hover:border-border"
                        >
                          <span className="truncate">{t.tokenOutSymbol || t.tokenOut}</span>
                          <span className={`text-[10px] ${((t.amountOut||0)-(t.amountIn||0))>=0?"text-green-400":"text-red-400"}`}>
                            {((t.amountOut||0)-(t.amountIn||0))>=0?"+":""}{(((t.amountOut||0)-(t.amountIn||0))).toFixed(2)}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {/* Total Value removed */}
                <button className="text-xs px-3 py-2 rounded-md bg-muted hover:bg-muted/80" onClick={() => setSelected(p)}>View Trades</button>
              </div>
            ))}
            </div>

            {/* Sidebar */}
            <aside className="hidden md:block w-[320px] space-y-4">
              {/* Who to follow */}
              <WhoToFollow />

              {/* News */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-bold mb-3">Latest news</h3>
                <div className="space-y-3">
                  {NEWS_ARTICLES.slice(0,4).map((a) => (
                    <a key={a.slug} href={`/news/${encodeURIComponent(a.slug)}`} className="block group">
                      <div className="text-sm font-medium group-hover:underline line-clamp-2">{a.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{a.summary}</div>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

      {selected && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
            <div className="bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center text-white font-semibold">
                  {selected.pfpUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.pfpUrl} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selected.name?.[0]?.toUpperCase() || "T"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-lg leading-tight">{selected.name}</div>
                  <div className="text-xs text-gray-400 font-mono truncate">
                    <button
                      onClick={() => copyToClipboard(selected.wallet)}
                      className="hover:underline decoration-dotted"
                      title={copied === selected.wallet ? "Copied!" : "Click to copy"}
                    >
                      {selected.wallet}
                    </button>
                    {copied === selected.wallet && <span className="ml-2 text-[11px] text-green-400">Copied</span>}
                  </div>
                </div>
                <button className="ml-auto text-sm px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700" onClick={() => setSelected(null)}>Close</button>
              </div>

              {/* Summary cards (SOL / USDT / Total) removed */}

              <div className="text-sm text-gray-300 mb-2">Trades</div>
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-800">
                {(() => {
                  const manualTrades = selected.worstTrades || [];
                  if (manualTrades.length === 0) return <div className="text-sm text-gray-400 p-3">No trades found.</div>;
                  return (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        <th className="text-left p-3">Token</th>
                        <th className="text-right p-3">Bought</th>
                        <th className="text-right p-3">Sold</th>
                        <th className="text-right p-3">Holding</th>
                        <th className="text-right p-3">ROI</th>
                        <th className="text-left p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualTrades.map((t, i) => {
                        const bought = t.amountIn || 0;
                        const sold = t.amountOut || 0;
                        const holding = Math.max(0, +(bought - sold).toFixed(4));
                        const roi = bought > 0 ? ((sold - bought) / bought) * 100 : 0;
                        const duration = typeof t.durationMinutes === "number" ? (t.durationMinutes >= 60 ? `${Math.round(t.durationMinutes/60)}h` : `${Math.round(t.durationMinutes)}m`) : "-";
                        const formatUnits = (n?: number) => {
                          if (n === undefined) return "";
                          if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(1)}B`;
                          if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
                          if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
                          return n.toLocaleString();
                        };
                        return (
                          <tr key={i} className={`border-t border-gray-800 ${i % 2 ? "bg-gray-900" : "bg-gray-950"}`}>
                            <td className="p-3">
                              {t.tokenUrl ? (
                                <a href={t.tokenUrl} target="_blank" className="underline">
                                  {t.tokenOutSymbol || t.tokenOut}
                                </a>
                              ) : (
                                t.tokenOutSymbol || t.tokenOut
                              )}
                            </td>
                            <td className="p-3 text-right">{bought.toFixed(4)} SOL{t.tokenUnitsIn !== undefined ? <span className="text-xs text-gray-400"> • {formatUnits(t.tokenUnitsIn)}</span> : null}</td>
                            <td className="p-3 text-right">{sold.toFixed(4)} SOL{t.tokenUnitsOut !== undefined ? <span className="text-xs text-gray-400"> • {formatUnits(t.tokenUnitsOut)}</span> : null}</td>
                            <td className="p-3 text-right">{holding.toFixed(4)} SOL</td>
                            <td className={`p-3 text-right ${roi >= 0 ? "text-green-400" : "text-red-400"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</td>
                            <td className="p-3 text-xs">{duration}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


