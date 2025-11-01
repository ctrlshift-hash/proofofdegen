export type NewsArticle = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string; // ISO date
  source?: string;
  content: string[]; // paragraphs
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "solana-meme-coin-pvp-pumpfun",
    title: "Solana Meme Coin Traders Protest Rising PvP Tactics on Pump.fun",
    summary:
      "Community debates fair launches as sniping tools and copycat tokens intensify competition across Solana memecoins.",
    publishedAt: new Date().toISOString(),
    source: "DegenHub Newsdesk",
    content: [
      "Traders on X criticized the increasing player‑versus‑player dynamics in Solana's meme coin ecosystem, where sniping bots and rapid copycat launches make it harder for retail participants to compete.",
      "A post by uxento co‑founder Nuotrix warning about tools that may advantage larger players sparked backlash, with critics arguing that such tooling is already shaping launch meta across platforms like pump.fun.",
      "The KitKat token frenzy became a flashpoint as multiple copycats launched within minutes of each other. Order‑flow bots and pre‑liquidity routing briefly overwhelmed manual traders, widening spreads and increasing failed transactions.",
      "Developers and creators debated potential mitigations: time‑boxed warm‑ups before bonding curves open, randomized listing windows, and better disclosure of holder concentration at launch. Advocates say these guardrails could reduce extractive behavior without limiting permissionless access.",
      "On‑chain data over the past week shows shorter median token lifetimes and higher first‑hour volatility compared with earlier months, suggesting tighter competitive windows as automation intensifies.",
      "For retail participants, veteran builders recommend conservative sizing during first minutes, verifying mint authorities and freeze permissions, and waiting for early liquidity stabilization before chasing breakouts.",
    ],
  },
  {
    slug: "rug-pulls-surge-2025",
    title: "Rug Pulls Surge to Multi‑Year Highs; Calls Grow for Better Safeguards",
    summary:
      "On‑chain analytics show an uptick in liquidity‑removal scams across small‑cap tokens, prompting renewed focus on due diligence and tooling.",
    publishedAt: new Date().toISOString(),
    source: "DegenHub Research",
    content: [
      "Rug‑pull incidents have climbed to their highest levels in recent cycles, according to multiple community dashboards tracking token lifecycles and liquidity events.",
      "Analysts cite a mix of rapid token‑factory tooling, low launch costs, and aggressive social amplification as drivers behind the increase. Many tokens exhibit similar patterns: concentrated ownership at launch, opaque team wallets, and permissions allowing liquidity withdrawal or trading halts.",
      "Independent reviewers recommend practical safeguards: time‑locked liquidity, multi‑sig treasury controls, and where appropriate, renounced authorities on upgradeable contracts. Bonding‑curve projects benefit from transparent fee schedules and immutable parameters disclosed at launch.",
      "For everyday traders, due‑diligence steps include verifying creator history, checking mint and freeze authorities, confirming liquidity lock duration, and monitoring holder concentration and top‑10 wallet behavior during first hours.",
      "Tooling is improving as well: scanners flag repeat deployers, while wallet overlays highlight risky permissions before swaps finalize. Education remains the final mile—new entrants continue to over‑index on social buzz over verifiable token mechanics.",
      "Community‑run lists and reporting channels have helped surface repeat patterns quickly, but users are urged to rely on on‑chain facts rather than screenshots or unverifiable claims before allocating capital.",
    ],
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  const normalized = decodeURIComponent(slug).toLowerCase();
  return (
    NEWS_ARTICLES.find((a) => a.slug.toLowerCase() === normalized) ||
    NEWS_ARTICLES.find((a) => slugify(a.title) === normalized)
  );
}


