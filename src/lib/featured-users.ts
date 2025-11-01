export type FeaturedSuggestion = {
  id: string;
  username: string;
  profileImage: string;
  bio?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  followersCount?: number;
  isGoldVerified?: boolean;
};

export const FEATURED_SUGGESTIONS: FeaturedSuggestion[] = [
  {
    id: "featured-alon",
    username: "Alon",
    profileImage: "https://pbs.twimg.com/profile_images/1875434258426187776/XUJTdd67_400x400.jpg",
    bio: "co-founder · @pumpdotfun",
    email: "featured@degenhub.local",
    walletAddress: null,
    followersCount: 0,
    isGoldVerified: true,
  },
];


