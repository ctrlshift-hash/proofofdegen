export const GOLD_VERIFIED_WALLETS = new Set<string>([
  "H61rKATwp2W8AJpZQLarzXyt8Rpho3UzyRhRpkMgAhY".toLowerCase(),
]);

export const GOLD_VERIFIED_USERNAMES = new Set<string>([
  "dev".toLowerCase(),
  "Alon".toLowerCase(),
]);

export function isGoldVerified(user: { username?: string | null; walletAddress?: string | null }): boolean {
  const name = (user.username || "").toLowerCase();
  const wallet = (user.walletAddress || "").toLowerCase();
  return GOLD_VERIFIED_USERNAMES.has(name) || (wallet && GOLD_VERIFIED_WALLETS.has(wallet));
}



