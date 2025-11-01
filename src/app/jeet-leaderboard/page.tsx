"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";

type Profile = {
  rank: number;
  wallet: string;
  name: string;
  pfpUrl: string;
  description?: string;
  jeetScore?: number;
  badges?: string[];
  roastTopQuote?: string;
  mostJeeted?: string[];
  pnlSol: number;
  pnlUsd: number;
  worstTrades: Array<{
    wallet: string;
    tokenMint: string;
    tokenSymbol?: string;
    side: string;
    qty: number;
    priceUsd: number;
    valueUsd: number;
    timestamp: string;
    note?: string;
  }>;
};

type Nomination = {
  id: string;
  name: string;
  wallet?: string;
  xUrl?: string;
  reason?: string;
  links?: string[];
  createdAt: number;
  votesUp: number;
  votesDown: number;
};

export default function JeetLeaderboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [sort, setSort] = useState<"usd" | "sol">("usd");
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [voteTally, setVoteTally] = useState<Record<string, number>>({});
  const [myCard, setMyCard] = useState({ name: "", wallet: "", coin: "", note: "", bgUrl: "", bgDataUrl: "" });
  const [generated, setGenerated] = useState<{ dataUrl: string; previewUrl: string } | null>(null);
  const [myPreset, setMyPreset] = useState<string | null>(null);
  const [noms, setNoms] = useState<Nomination[]>([]);
  const [nomForm, setNomForm] = useState({ name: "", wallet: "", xUrl: "", reason: "", links: "" });
  const [nomSort, setNomSort] = useState<"top" | "new">("top");
  const [nomModal, setNomModal] = useState<Nomination | null>(null);
  const [nomBg, setNomBg] = useState<{ url: string; dataUrl: string; preset: string | null }>({ url: "", dataUrl: "", preset: null });
  const [nomGenerated, setNomGenerated] = useState<string | null>(null);
  const [nomVotes, setNomVotes] = useState<Record<string, 1 | -1 | 0>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/wallets/jeet-leaderboard?timeframe=${timeframe}&sort=${sort}`);
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.profiles || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeframe, sort]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jeetVotesTally");
      if (raw) setVoteTally(JSON.parse(raw));
    } catch {}
  }, []);

  // Nominations local scaffold
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jeetNominations");
      if (raw) setNoms(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("jeetNominations", JSON.stringify(noms)); } catch {}
  }, [noms]);

  // load stored votes
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jeetNomVotes");
      if (raw) setNomVotes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("jeetNomVotes", JSON.stringify(nomVotes)); } catch {}
  }, [nomVotes]);

  const addNomination = () => {
    if (!nomForm.name.trim() && !nomForm.wallet.trim() && !nomForm.xUrl.trim()) return;
    const id = `nom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const links = nomForm.links.split(/\s+/).filter(Boolean);
    setNoms(prev => [{ id, name: nomForm.name.trim() || nomForm.xUrl || nomForm.wallet, wallet: nomForm.wallet.trim() || undefined, xUrl: nomForm.xUrl.trim() || undefined, reason: nomForm.reason.trim() || undefined, links, createdAt: Date.now(), votesUp: 1, votesDown: 0 }, ...prev]);
    setNomForm({ name: "", wallet: "", xUrl: "", reason: "", links: "" });
  };

  const voteNom = (id: string, delta: 1 | -1) => {
    setNomVotes(prevVotes => {
      const previous = prevVotes[id] ?? 0;
      if (previous === delta) return prevVotes; // one vote per nomination; ignore same vote
      const change = delta - previous; // could be 1, -1, or 2/-2 when flipping
      setNoms(prev => prev.map(n => {
        if (n.id !== id) return n;
        let up = n.votesUp;
        let down = n.votesDown;
        if (change === 1) up += 1; // from 0->+1 or -1->0
        if (change === -1) down += 1; // from 0->-1 or +1->0
        if (change === 2) { // -1 -> +1
          up += 1; down -= 1;
        }
        if (change === -2) { // +1 -> -1
          down += 1; up -= 1;
        }
        return { ...n, votesUp: Math.max(0, up), votesDown: Math.max(0, down) };
      }));
      const next = { ...prevVotes, [id]: delta };
      try { localStorage.setItem("jeetNomVotes", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const renderNomCard = async (n: Nomination): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext("2d"); if (!ctx) return "";
    // background: preset gradient or image
    if (nomBg.preset) {
      const grad = ctx.createLinearGradient(0,0,1200,630);
      if (nomBg.preset === "purple") { grad.addColorStop(0, "#3b0764"); grad.addColorStop(1, "#9333ea"); }
      if (nomBg.preset === "blue") { grad.addColorStop(0, "#0f172a"); grad.addColorStop(1, "#0ea5e9"); }
      if (nomBg.preset === "sunset") { grad.addColorStop(0, "#7c2d12"); grad.addColorStop(1, "#f97316"); }
      ctx.fillStyle = grad; ctx.fillRect(0,0,1200,630);
    } else if (nomBg.dataUrl || nomBg.url) {
      try { const img = await loadImage(nomBg.dataUrl || nomBg.url); ctx.drawImage(img, 0, 0, 1200, 630); }
      catch { ctx.fillStyle = "#0b1220"; ctx.fillRect(0,0,1200,630); }
    } else { ctx.fillStyle = "#0b1220"; ctx.fillRect(0,0,1200,630); }
    // content
    ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 44px Inter, sans-serif"; ctx.fillText("Jeet Nomination", 40, 70);
    ctx.font = "bold 64px Inter, sans-serif"; ctx.fillText(n.name, 40, 150);
    ctx.font = "24px Inter, sans-serif"; ctx.fillStyle = "#cbd5e1";
    const wshort = n.wallet ? `${n.wallet.slice(0,6)}…${n.wallet.slice(-4)}` : "";
    if (wshort) ctx.fillText(wshort, 40, 190);
    if (n.xUrl) { ctx.fillText(n.xUrl, 40, 225); }
    if (n.reason) { ctx.fillStyle = "#d1d5db"; ctx.font = "italic 24px Inter, sans-serif"; wrapText(ctx, `“${n.reason}”`, 40, 280, 1120, 34); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "20px Inter, sans-serif"; ctx.fillText("degenhub • nomination", 40, 590);
    return canvas.toDataURL("image/png");
  };


  const castVote = (name: string) => {
    setVoteTally((prev) => {
      const next = { ...prev, [name]: (prev[name] || 0) + 1 };
      try { localStorage.setItem("jeetVotesTally", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl; a.download = filename; a.click();
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  const shareOrDownload = async (dataUrl: string, filename: string) => {
    try {
      if ((navigator as any).canShare) {
        const file = await dataUrlToFile(dataUrl, filename);
        const shareData: any = { files: [file], title: "Jeet Card", text: "My Jeet Card from DegenHub" };
        if ((navigator as any).canShare(shareData)) {
          await (navigator as any).share(shareData);
          return;
        }
      }
    } catch {}
    downloadDataUrl(dataUrl, filename);
  };

  const exportProfileCard = async (p: Profile) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630; // social share size
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // background
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // title
    ctx.fillStyle = "#eef2ff"; ctx.font = "bold 44px Inter, sans-serif";
    ctx.fillText("Jeet Leaderboard", 40, 70);
    // name & wallet
    ctx.font = "bold 60px Inter, sans-serif"; ctx.fillText(p.name, 40, 150);
    ctx.font = "24px Inter, sans-serif"; ctx.fillStyle = "#94a3b8";
    const short = p.wallet ? `${p.wallet.slice(0, 6)}…${p.wallet.slice(-4)}` : "";
    ctx.fillText(short, 40, 190);
    // score
    ctx.fillStyle = "#fecaca"; ctx.font = "bold 30px Inter, sans-serif";
    const score = typeof p.jeetScore === "number" ? p.jeetScore : 0;
    ctx.fillText(`Jeet Score: ${score}`, 40, 240);
    // most jeeted
    ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 26px Inter, sans-serif"; ctx.fillText("Most jeeted coins:", 40, 300);
    ctx.font = "24px Inter, sans-serif"; ctx.fillStyle = "#e2e8f0";
    const list = (p.mostJeeted || []).slice(0, 3).join(" · ") || "—";
    ctx.fillText(list, 40, 340);
    // roast
    ctx.fillStyle = "#94a3b8"; ctx.font = "italic 22px Inter, sans-serif";
    const roast = p.roastTopQuote && p.roastTopQuote.length > 0 ? `“${p.roastTopQuote}”` : "";
    if (roast) wrapText(ctx, roast, 40, 400, 1120, 30);
    // footer
    ctx.fillStyle = "#64748b"; ctx.font = "20px Inter, sans-serif";
    ctx.fillText("degenhub • jeet card", 40, 590);
    downloadDataUrl(canvas.toDataURL("image/png"), `${p.name}-jeet-card.png`);
  };

  const renderMyCardDataUrl = async (): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    if (myPreset) {
      const grad = ctx.createLinearGradient(0,0,1200,630);
      if (myPreset === "purple") { grad.addColorStop(0, "#3b0764"); grad.addColorStop(1, "#9333ea"); }
      if (myPreset === "blue") { grad.addColorStop(0, "#0f172a"); grad.addColorStop(1, "#0ea5e9"); }
      if (myPreset === "sunset") { grad.addColorStop(0, "#7c2d12"); grad.addColorStop(1, "#f97316"); }
      ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (myCard.bgDataUrl || myCard.bgUrl) {
      try { const img = await loadImage(myCard.bgDataUrl || myCard.bgUrl); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
      catch { ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    } else { ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.fillStyle = "#e5e7eb"; ctx.font = "bold 48px Inter, sans-serif"; ctx.fillText("My Jeet Confession", 40, 80);
    ctx.font = "bold 60px Inter, sans-serif"; ctx.fillText(myCard.name || "Anon Jeeter", 40, 160);
    ctx.font = "24px Inter, sans-serif"; ctx.fillStyle = "#9ca3af";
    const short = myCard.wallet ? `${myCard.wallet.slice(0,6)}…${myCard.wallet.slice(-4)}` : "";
    if (short) ctx.fillText(short, 40, 200);
    ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 26px Inter, sans-serif"; ctx.fillText("Biggest jeet coin:", 40, 260);
    ctx.font = "24px Inter, sans-serif"; ctx.fillStyle = "#e2e8f0"; ctx.fillText(myCard.coin || "—", 40, 300);
    if (myCard.note) { ctx.fillStyle = "#94a3b8"; ctx.font = "italic 22px Inter, sans-serif"; wrapText(ctx, `“${myCard.note}”`, 40, 360, 1120, 30); }
    ctx.fillStyle = "#6b7280"; ctx.font = "20px Inter, sans-serif"; ctx.fillText("degenhub • jeet card", 40, 590);
    return canvas.toDataURL("image/png");
  };

  const generateOnly = async () => {
    const dataUrl = await renderMyCardDataUrl();
    if (!dataUrl) return;
    setGenerated({ dataUrl, previewUrl: dataUrl });
  };

  const exportMyCard = async () => {
    const dataUrl = await renderMyCardDataUrl();
    if (!dataUrl) return;
    setGenerated({ dataUrl, previewUrl: dataUrl });
    downloadDataUrl(dataUrl, `my-jeet-card.png`);
  };

  const shareMyCard = async () => {
    const dataUrl = generated?.dataUrl || await renderMyCardDataUrl();
    if (!dataUrl) return;
    setGenerated({ dataUrl, previewUrl: dataUrl });
    await shareOrDownload(dataUrl, `my-jeet-card.png`);
  };

  const uploadAndShareLink = async () => {
    // Auto-generate if needed
    let dataUrl = generated?.dataUrl;
    if (!dataUrl) {
      dataUrl = await renderMyCardDataUrl();
      if (!dataUrl) return;
      setGenerated({ dataUrl, previewUrl: dataUrl });
    }
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "jeet-card.png", { type: "image/png" });
    const fd = new FormData();
    fd.append("file", file);
    const upload = await fetch("/api/jeet-cards", { method: "POST", body: fd });
    if (!upload.ok) return;
    const { url } = await upload.json();
    const site = (process.env.NEXT_PUBLIC_SITE_URL as string) || window.location.origin;
    const absolute = url?.startsWith("http") ? url : `${site}${url}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent("My Jeet Card from DegenHub")}&url=${encodeURIComponent(absolute)}`;
    window.open(intent, "_blank");
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Watchlist: store wallet addresses in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jeetWatchlist");
      if (raw) setWatchlist(JSON.parse(raw));
    } catch {}
  }, []);

  const toggleWatch = (wallet: string) => {
    setWatchlist(prev => {
      const next = prev.includes(wallet) ? prev.filter(w => w !== wallet) : [...prev, wallet];
      try { localStorage.setItem("jeetWatchlist", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4">Jeet Leaderboard</h1>
        {/* Callout to key actions */}
        <div className="mb-4 rounded-lg border border-indigo-700/40 bg-indigo-900/20 p-3 flex flex-wrap items-center gap-3" role="region" aria-label="Quick actions">
          <div className="text-sm">Jump to:</div>
          <a href="#nominate" className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm" aria-label="Go to Nominate section">Nominate someone</a>
          <a href="#make-card" className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-sm" aria-label="Go to Create your Jeet Card section">Create your Jeet Card</a>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Send me wallets and worst trades to feature here. We'll track their
          biggest fumbles and rank them by USD size.
        </p>

        {/* Controls */}
        <div className="flex items-center gap-2 gap-y-2 mb-4 flex-wrap">
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            {(["daily","weekly","monthly"] as const).map(tf => (
              <button key={tf} className={`px-3 py-1 text-sm ${timeframe===tf?"bg-degen-purple/20 text-degen-purple":"hover:bg-accent"}`} onClick={() => setTimeframe(tf)}>
                {tf.charAt(0).toUpperCase()+tf.slice(1)}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value as any)} className="input text-sm h-10 py-2 leading-normal w-full md:w-64 pr-8 appearance-none">
            <option value="usd">Sort: USD loss</option>
            <option value="sol">Sort: SOL loss</option>
          </select>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyWatchlist} onChange={e=>setOnlyWatchlist(e.target.checked)} />
            Only watchlist
          </label>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (onlyWatchlist ? profiles.filter(p=>watchlist.includes(p.wallet)) : profiles).length === 0 ? (
          <div className="text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="space-y-3">
            {(onlyWatchlist ? profiles.filter(p=>watchlist.includes(p.wallet)) : profiles).map((p) => (
              <div key={p.wallet} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent transition-colors">
                <img src={p.pfpUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                <button className="text-left hover:underline font-semibold" onClick={() => setSelected(p)}>
                  {p.name}
                </button>
                <div className="font-mono text-sm text-muted-foreground ml-2">
                  {p.wallet.slice(0, 6)}…{p.wallet.slice(-6)}
                </div>
                <button className={`ml-2 text-xs px-2 py-1 rounded ${watchlist.includes(p.wallet)?"bg-yellow-500/20 text-yellow-400":"bg-muted"}`} onClick={()=>toggleWatch(p.wallet)}>
                  {watchlist.includes(p.wallet)?"★ Watched":"☆ Watch"}
                </button>
                <div className="ml-auto font-semibold text-red-400">
                  {p.pnlSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL ({p.pnlUsd.toLocaleString(undefined, { style: "currency", currency: "USD", currencyDisplay: "symbol" }).replace("US$", "$")})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions: Nominate + Create My Jeet Card */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pt-0">
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div id="nominate" className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg">Nominate someone for the Jeet Leaderboard</div>
              <select value={nomSort} onChange={e=>setNomSort(e.target.value as any)} className="bg-gray-800 text-sm rounded px-2 py-1">
                <option value="top">Top</option>
                <option value="new">New</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
              <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Name or handle" value={nomForm.name} onChange={e=>setNomForm({...nomForm, name: e.target.value})} />
              <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Wallet (optional)" value={nomForm.wallet} onChange={e=>setNomForm({...nomForm, wallet: e.target.value})} />
              <input className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2 focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="X profile URL (optional)" value={nomForm.xUrl} onChange={e=>setNomForm({...nomForm, xUrl: e.target.value})} />
              <input className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2 focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Links (evidence) separated by spaces (optional)" value={nomForm.links} onChange={e=>setNomForm({...nomForm, links: e.target.value})} />
              <textarea className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2 focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Reason (optional)" value={nomForm.reason} onChange={e=>setNomForm({...nomForm, reason: e.target.value})} />
              <select className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2" value={nomBg.preset || ""} onChange={(e)=>setNomBg({ ...nomBg, preset: e.target.value || null })} aria-label="Nomination background preset">
                <option value="">No preset background</option>
                <option value="purple">Purple gradient</option>
                <option value="blue">Blue gradient</option>
                <option value="sunset">Sunset gradient</option>
              </select>
              <input className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2" placeholder="Background image URL (optional)" value={nomBg.url} onChange={(e)=>setNomBg({ ...nomBg, url: e.target.value })} />
              <input type="file" accept="image/*" className="bg-gray-800 rounded px-3 py-2 outline-none md:col-span-2" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setNomBg(prev=>({ ...prev, dataUrl: String(r.result||"") })); r.readAsDataURL(f); }} />
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded bg-degen-purple/70 hover:bg-degen-purple focus:outline-none focus:ring-2 focus:ring-degen-purple/50 transition" onClick={addNomination}>Nominate</button>
                <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition" onClick={async()=>{ const temp: Nomination = { id: 'temp', name: nomForm.name || nomForm.xUrl || nomForm.wallet || 'Nomination', wallet: nomForm.wallet || undefined, xUrl: nomForm.xUrl || undefined, reason: nomForm.reason || undefined, links: nomForm.links.split(/\s+/).filter(Boolean), createdAt: Date.now(), votesUp: 0, votesDown: 0 }; const url=await renderNomCard(temp); if(url){ setNomGenerated(url); } }}>Generate card</button>
                <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" disabled={!nomGenerated} onClick={()=>{ if(!nomGenerated) return; const a=document.createElement('a'); a.href=nomGenerated; a.download='nomination.png'; a.click(); }}>Download</button>
                <button className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition" disabled={!nomGenerated} onClick={async()=>{ if(!nomGenerated) return; const res=await fetch(nomGenerated); const blob=await res.blob(); const file=new File([blob], 'nomination.png', {type:'image/png'}); const fd=new FormData(); fd.append('file', file); const up=await fetch('/api/jeet-cards',{method:'POST', body: fd}); if(up.ok){ const { url } = await up.json(); const site=(process.env.NEXT_PUBLIC_SITE_URL as string) || window.location.origin; const absolute = url?.startsWith('http')?url:`${site}${url}`; const intent=`https://twitter.com/intent/tweet?text=${encodeURIComponent('Nomination for the Jeet Leaderboard')}&url=${encodeURIComponent(absolute)}`; window.open(intent,'_blank'); } }}>Share</button>
              </div>
              {nomGenerated && (
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Nomination card preview</div>
                  <img src={nomGenerated} alt="Nomination card preview" className="rounded-lg border border-gray-800 max-h-48" />
                </div>
              )}
            </div>
          </div>
          <div id="make-card" className="rounded-xl border border-gray-800 bg-gray-900 p-4 md:order-2">
            <div className="font-semibold mb-2 text-lg">Create your own Jeet Card</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Your name or handle" value={myCard.name} onChange={(e) => setMyCard({ ...myCard, name: e.target.value })} />
              <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Wallet (optional)" value={myCard.wallet} onChange={(e) => setMyCard({ ...myCard, wallet: e.target.value })} />
              <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Biggest jeet coin (name or link)" value={myCard.coin} onChange={(e) => setMyCard({ ...myCard, coin: e.target.value })} />
              <textarea className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Note or roast line (optional)" value={myCard.note} onChange={(e) => setMyCard({ ...myCard, note: e.target.value })} />
            <select className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" value={myPreset || ""} onChange={(e)=>setMyPreset(e.target.value || null)} aria-label="Background preset">
              <option value="">No preset background</option>
              <option value="purple">Purple gradient</option>
              <option value="blue">Blue gradient</option>
              <option value="sunset">Sunset gradient</option>
            </select>
            <input className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/40 focus:border-indigo-500/40 transition" placeholder="Custom background image URL (optional)" value={myCard.bgUrl} onChange={(e) => setMyCard({ ...myCard, bgUrl: e.target.value })} />
            <label className="text-xs text-gray-400">Or upload background image</label>
            <input type="file" accept="image/*" className="bg-gray-800 rounded px-3 py-2 outline-none" onChange={(e)=>{
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => setMyCard((prev)=>({ ...prev, bgDataUrl: String(reader.result||"") }));
              reader.readAsDataURL(f);
            }} />
              <div className="flex flex-wrap gap-2 items-center">
                <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition" onClick={generateOnly}>Generate</button>
                <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" onClick={exportMyCard}>Download</button>
                <button className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition" disabled={!generated} onClick={uploadAndShareLink}>Share</button>
              </div>
              {generated && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-1">Preview</div>
                  <img src={generated.previewUrl} alt="Jeet card preview" className="rounded-lg border border-gray-800 max-h-48" />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Top Nominations preview (always below the two blocks) */}
        {noms.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-4" aria-label="Top nominations">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Top nominations</div>
              <a href="#" className="text-sm underline text-blue-300">View all</a>
            </div>
            <div className="divide-y divide-gray-800">
              {noms
                .slice()
                .sort((a,b)=> (b.votesUp-b.votesDown) - (a.votesUp-a.votesDown))
                .slice(0,5)
                .map(n => (
                <div key={n.id} className="py-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    <button className="text-green-400" aria-label="Upvote" onClick={()=>voteNom(n.id, 1)}>▲</button>
                    <div className="text-xs text-gray-300 font-semibold w-8 text-center">{n.votesUp - n.votesDown}</div>
                    <button className="text-red-400" aria-label="Downvote" onClick={()=>voteNom(n.id, -1)}>▼</button>
                  </div>
                  <div className="flex-1 truncate">
                    <span className="font-medium">{n.name}</span>
                    {n.wallet && <span className="text-xs text-gray-500 ml-2">{n.wallet.slice(0,6)}…{n.wallet.slice(-4)}</span>}
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700" aria-label="Open nomination card" onClick={()=>{ setNomModal(n); setNomGenerated(null); setNomBg({ url:"", dataUrl:"", preset: null }); }}>Card</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {nomModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={()=>setNomModal(null)}>
          <div className="bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full p-5" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center mb-3">
              <div className="font-semibold text-lg">Nomination card: {nomModal.name}</div>
              <button className="ml-auto text-sm px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700" onClick={()=>setNomModal(null)} aria-label="Close nomination card">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm mb-2">
              <select className="bg-gray-800 rounded px-3 py-2 outline-none" value={nomBg.preset || ""} onChange={(e)=>setNomBg({ ...nomBg, preset: e.target.value || null })} aria-label="Background preset">
                <option value="">No preset</option>
                <option value="purple">Purple gradient</option>
                <option value="blue">Blue gradient</option>
                <option value="sunset">Sunset gradient</option>
              </select>
              <input className="bg-gray-800 rounded px-3 py-2 outline-none" placeholder="Background image URL (optional)" value={nomBg.url} onChange={(e)=>setNomBg({ ...nomBg, url: e.target.value })} aria-label="Background URL" />
              <label className="text-xs text-gray-400">Or upload background image</label>
              <input type="file" accept="image/*" className="bg-gray-800 rounded px-3 py-2 outline-none" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setNomBg(prev=>({ ...prev, dataUrl: String(r.result||"") })); r.readAsDataURL(f); }} aria-label="Upload background" />
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" onClick={async()=>{ const url = await renderNomCard(nomModal); setNomGenerated(url); }} aria-label="Generate nomination card">Generate</button>
                <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50" disabled={!nomGenerated} onClick={()=>{ if(!nomGenerated) return; const a=document.createElement('a'); a.href=nomGenerated; a.download=`${nomModal.name}-nomination.png`; a.click(); }} aria-label="Download nomination card">Download</button>
                <button className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50" disabled={!nomGenerated} onClick={async()=>{ if(!nomGenerated) return; const res=await fetch(nomGenerated); const blob=await res.blob(); const file=new File([blob], 'nomination.png', {type:'image/png'}); const fd=new FormData(); fd.append('file', file); const up=await fetch('/api/jeet-cards',{method:'POST', body: fd}); if(up.ok){ const { url } = await up.json(); const site=(process.env.NEXT_PUBLIC_SITE_URL as string) || window.location.origin; const absolute = url?.startsWith('http')?url:`${site}${url}`; const intent=`https://twitter.com/intent/tweet?text=${encodeURIComponent('Nomination for the Jeet Leaderboard')}&url=${encodeURIComponent(absolute)}`; window.open(intent,'_blank'); } }} aria-label="Share nomination card">Share</button>
              </div>
              {nomGenerated && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-1">Preview</div>
                  <img src={nomGenerated} alt="Nomination card preview" className="rounded-lg border border-gray-800 max-h-48" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
            <div className="bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <img src={selected.pfpUrl} alt={selected.name} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-lg">{selected.name}</div>
                <div className="text-xs text-gray-400 font-mono">{selected.wallet}</div>
              </div>
                {typeof selected.jeetScore === "number" && (
                  <div className="ml-auto mr-3 text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-700/40">Jeet Score: {selected.jeetScore}</div>
                )}
              <button className="ml-auto text-sm px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="mb-3">
              <button className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500" onClick={() => exportProfileCard(selected)}>Export card</button>
            </div>
            {/* Description */}
            <div className="mb-3 text-sm whitespace-pre-wrap text-gray-300">
              {selected.description && selected.description.trim().length > 0 ? (
                selected.description
              ) : (
                <span className="text-gray-500">No description yet.</span>
              )}
            </div>
            {/* Tabs */}
            <div className="flex gap-2 mb-3 text-sm">
              <button className="px-3 py-1 rounded bg-gray-800">Most jeeted coins</button>
              <button className="px-3 py-1 rounded bg-gray-800">Roasts</button>
              <button className="px-3 py-1 rounded bg-gray-800">Predictions</button>
            </div>
            {/* Simple roast placeholder */}
            {selected.roastTopQuote && (
              <div className="mb-3 text-xs text-gray-400">Top roast: “{selected.roastTopQuote}”</div>
            )}
            <div className="text-sm text-muted-foreground mb-2">Most jeeted coins</div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Token</th>
                    <th className="text-left p-3">Side</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Price (USD)</th>
                    <th className="text-right p-3">Value (USD)</th>
                    <th className="text-left p-3">When</th>
                    <th className="text-left p-3">Note</th>
                    <th className="text-left p-3">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.worstTrades.map((t, i) => (
                    <tr key={i} className={`border-t border-gray-800 ${i % 2 ? "bg-gray-900" : "bg-gray-950"}`}>
                      <td className="p-3">{t.tokenSymbol || t.tokenMint.slice(0, 6)}</td>
                      <td className="p-3 capitalize">{t.side}</td>
                      <td className="p-3 text-right">{t.qty.toLocaleString()}</td>
                      <td className="p-3 text-right">{t.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                      <td className="p-3 text-right">{t.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="p-3">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-gray-400">{t.note || ""}</td>
                      <td className="p-3 text-xs">
                        {t.txUrl && (<a href={t.txUrl} target="_blank" className="underline mr-2">Tx</a>)}
                        {t.tokenUrl && (<a href={t.tokenUrl} target="_blank" className="underline">Token</a>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


