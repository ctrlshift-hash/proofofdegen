# Getting Started with DegenHub 🚀

Welcome to DegenHub! This guide will help you set up and run the crypto degen social media platform locally.

## Quick Start

### 1. Prerequisites

Make sure you have the following installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### 2. Database Setup

1. **Install PostgreSQL** and create a new database:
   ```sql
   CREATE DATABASE degenhub;
   ```

2. **Update your environment variables** in `.env.local`:
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/degenhub"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXT_PUBLIC_SOLANA_NETWORK="devnet"
   NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
   ```

### 3. Install and Run

```bash
# Install dependencies
npm install

# Set up the database
npm run db:migrate

# Start the development server
npm run dev
```

### 4. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000) and start using DegenHub!

## 🎯 What You Can Do

### Authentication
- **Wallet Login**: Connect with Phantom, Solflare, or other Solana wallets
- **Email Signup**: Create an account with email and username
- **Verified Status**: Wallet users get verified badges

### Social Features
- **Create Posts**: Share text and images with the community
- **Token Tagging**: Mention tokens like $SOL, $BONK, $RAY
- **Interact**: Like, comment, and repost posts
- **Real-time Feed**: See updates as they happen

### User Profiles
- **Customize Profile**: Add bio, profile picture, and settings
- **View Stats**: See followers, following, and post counts
- **Portfolio Display**: Show SOL balance (wallet users)

### Channels
- **Browse Channels**: Discover communities
- **Token-Gated Access**: Join exclusive channels with token requirements
- **Create Channels**: Build your own community

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Code Quality
npm run lint         # Run ESLint
```

## 🎨 Customization

### Themes
The app uses a dark theme by default. You can customize colors in `tailwind.config.ts`:

```typescript
colors: {
  degen: {
    purple: "#8B5CF6",  // Primary brand color
    pink: "#EC4899",    // Secondary brand color
    blue: "#3B82F6",    // Accent color
    green: "#10B981",   // Success color
    orange: "#F59E0B",  // Warning color
  }
}
```

### Adding New Features
1. Create components in `src/components/`
2. Add pages in `src/app/`
3. Update database schema in `prisma/schema.prisma`
4. Run migrations: `npm run db:migrate`

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Check your PostgreSQL is running
- Verify DATABASE_URL in `.env.local`
- Ensure database exists

**Wallet Connection Issues**
- Make sure you have a Solana wallet installed
- Check you're on the correct network (devnet)
- Try refreshing the page

**Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run lint`
- Clear Next.js cache: `rm -rf .next`

### Getting Help

1. Check the [README.md](README.md) for detailed documentation
2. Look at the code examples in the components
3. Check the Prisma schema for database structure
4. Review the Tailwind classes for styling

## 🚀 Next Steps

Once you have the basic setup running, you can:

1. **Connect a Real Wallet**: Test with Phantom or Solflare
2. **Set Up Real Database**: Use a production PostgreSQL instance
3. **Add Real-time Features**: Implement Socket.io for live updates
4. **Deploy**: Deploy to Vercel, Netlify, or your preferred platform
5. **Customize**: Modify the UI and add your own features

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Happy Building! 🚀**

If you run into any issues, don't hesitate to check the code or create an issue in the repository.

