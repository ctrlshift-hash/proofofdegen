import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const seedUsers = [
  {
    username: "cryptodegen",
    bio: "DeFi maxi 🚀 | Building on Solana | $SOL $RAY $JUP",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=cryptodegen&backgroundColor=b6e3f4,ffd93d,c0aede,ff9a56",
    isVerified: true,
    posts: [
      "Just discovered this amazing new DeFi protocol! $SOL is pumping hard today 🚀",
      "The Solana ecosystem keeps growing. What are you building?",
      "GM degens! Another day, another opportunity 💎",
    ],
  },
  {
    username: "pumpsignal",
    bio: "Pump.fun enthusiast | Early alpha calls | Not financial advice",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=pumpsignal&backgroundColor=ffd93d,c0aede,ff9a56,a8d8ea",
    isVerified: true,
    posts: [
      "New token launching on pump.fun in 10 minutes! Watch this space 👀",
      "The $BONK community is absolutely insane! Love the energy here 💎🙌",
      "Research your tokens, degens. DYOR always!",
    ],
  },
  {
    username: "solbuilder",
    bio: "Solana developer | Rust enthusiast | Open source contributor",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=solbuilder&backgroundColor=c0aede,ff9a56,a8d8ea,b6e3f4",
    isVerified: false,
    posts: [
      "Building something cool on Solana. The ecosystem is growing so fast! $RAY $JUP $ORCA",
      "Just shipped a new feature. Community feedback welcome!",
      "The future is on-chain. Let's build it together 🛠️",
    ],
  },
  {
    username: "nftcollector",
    bio: "NFT collector & trader | Magic Eden regular | Always hunting gems",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=nftcollector&backgroundColor=ff9a56,a8d8ea,b6e3f4,ffd93d",
    isVerified: true,
    posts: [
      "Picked up a rare piece today. The floor is moving! 📈",
      "Which NFT collections are you watching? Drop your favorites",
      "The art on Solana NFTs is next level. Change my mind 🎨",
    ],
  },
  {
    username: "tradingalpha",
    bio: "Crypto trader | Technical analysis | Charts don't lie",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=tradingalpha&backgroundColor=a8d8ea,b6e3f4,ffd93d,c0aede",
    isVerified: false,
    posts: [
      "$SOL breaking resistance. Next target: $200 🎯",
      "Market is looking bullish. Time to accumulate?",
      "Remember: buy the dip, sell the rip 📊",
    ],
  },
  {
    username: "degenshark",
    bio: "Apex predator of DeFi | High risk, high reward | 🦈",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=degenshark&backgroundColor=b6e3f4,ffd93d,c0aede,ff9a56",
    isVerified: true,
    posts: [
      "Just YOLO'd into a new token. Wish me luck! 🦈",
      "The degen life chooses you. You don't choose it 😎",
      "Another day, another degen play. This is the way",
    ],
  },
  {
    username: "web3teacher",
    bio: "Educating the masses about Web3 | Threads & tutorials | Learn together",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=web3teacher&backgroundColor=c0aede,ff9a56,a8d8ea,b6e3f4",
    isVerified: false,
    posts: [
      "New tutorial coming soon: How to mint your first NFT on Solana",
      "Knowledge is power. Let's level up together 📚",
      "Ask me anything about Solana, DeFi, or Web3!",
    ],
  },
  {
    username: "memecoinking",
    bio: "King of memes | $DOGE $PEPE $BONK | Meme = money",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=memecoinking&backgroundColor=ff9a56,a8d8ea,b6e3f4,ffd93d",
    isVerified: true,
    posts: [
      "Memes > fundamentals. Change my mind 🐸",
      "New memecoin alert! This one's got potential 👑",
      "Diamond hands on memes only. HODL! 💎",
    ],
  },
  {
    username: "solstaker",
    bio: "Validator & staker | Securing the network | Earning passive yield",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=solstaker&backgroundColor=a8d8ea,b6e3f4,ffd93d,c0aede",
    isVerified: false,
    posts: [
      "Staking rewards are looking good this epoch 📈",
      "Validator update: Network health is excellent",
      "The more you stake, the more you make. Simple!",
    ],
  },
  {
    username: "artblockchain",
    bio: "On-chain artist | Digital creator | Pixels & code",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=artblockchain&backgroundColor=b6e3f4,ffd93d,c0aede,ff9a56",
    isVerified: true,
    posts: [
      "New generative art piece dropped! Check it out 🎨",
      "Art + blockchain = the future of creativity",
      "Supporting independent artists. Every purchase matters",
    ],
  },
];

export async function POST(request: NextRequest) {
  try {
    // Check if users already exist
    const existingUsers = await prisma.user.findMany({
      where: {
        username: {
          in: seedUsers.map((u) => u.username),
        },
      },
    });

    if (existingUsers.length > 0) {
      // Users already exist - just return them
      return NextResponse.json({
        message: "Users already seeded",
        count: existingUsers.length,
      });
    }

    // Create users and their posts
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          bio: userData.bio,
          profileImage: userData.profileImage,
          isVerified: userData.isVerified,
          email: null,
          password: null,
        },
      });

      // Create posts for this user
      for (const postContent of userData.posts) {
        await prisma.post.create({
          data: {
            content: postContent,
            userId: user.id,
          },
        });
      }

      createdUsers.push(user);
    }

    return NextResponse.json({
      message: "Users seeded successfully",
      count: createdUsers.length,
      users: createdUsers.map((u) => ({
        id: u.id,
        username: u.username,
      })),
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed users", detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          in: seedUsers.map((u) => u.username),
        },
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Seed users found",
      count: users.length,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        postsCount: u._count.posts,
      })),
    });
  } catch (error: any) {
    console.error("Get seed users error:", error);
    return NextResponse.json(
      { error: "Failed to get seed users", detail: error.message },
      { status: 500 }
    );
  }
}


