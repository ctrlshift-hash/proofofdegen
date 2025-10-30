# DegenHub 🚀

A crypto degen social media platform built with Next.js 14, featuring dual authentication, token-gated channels, and SOL tipping functionality.

## ✨ Features

### 🔐 Dual Authentication System
- **Solana Wallet Login**: Connect with Phantom, Solflare, and other Solana wallets
- **Email/Username Signup**: Traditional authentication for casual users
- **Verified Badges**: Wallet-connected users get verified status

### 📱 Social Feed
- Create posts with text and images
- Like, comment, and repost functionality
- Real-time feed updates
- Token tagging system ($SOL, $BONK style)
- Mobile-responsive design

### 👤 User Profiles
- **Wallet Users**: Display wallet address, portfolio value, verified badge
- **Email Users**: Basic profile with "unverified" status
- Bio, profile pictures, followers/following
- Post history and engagement stats

### 🔒 Token-Gated Channels
- Create exclusive channels requiring specific token holdings
- Only wallet-connected users can access
- Minimum balance requirements
- Token verification system

### 💎 Tipping System
- Tip SOL directly to posts and users
- Wallet users only
- Transaction signature tracking
- Tip leaderboards

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth for email, Solana wallet adapter
- **Real-time**: Socket.io for live updates
- **UI**: Custom components with dark mode

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Solana wallet (Phantom/Solflare)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd degenhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/degenhub"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   NEXT_PUBLIC_SOLANA_NETWORK="devnet"
   NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
degenhub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── profile/           # User profile pages
│   │   ├── channels/          # Token-gated channels
│   │   └── settings/          # User settings
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   ├── posts/             # Post-related components
│   │   └── ui/                # Reusable UI components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utility functions
│   └── styles/                # Global styles
├── prisma/                    # Database schema and migrations
└── public/                    # Static assets
```

## 🎨 Design System

### Colors
- **Primary**: Degen Purple (#8B5CF6)
- **Secondary**: Degen Pink (#EC4899)
- **Accent**: Degen Blue (#3B82F6)
- **Success**: Degen Green (#10B981)
- **Warning**: Degen Orange (#F59E0B)

### Dark Mode
- Default dark theme optimized for crypto users
- High contrast for readability
- Glowing effects for premium features

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Run database migrations

## 🗄 Database Schema

### Core Tables
- **Users**: User accounts (wallet/email)
- **Posts**: Social media posts
- **Comments**: Post comments
- **Likes/Reposts**: Engagement data
- **Follows**: User relationships
- **Tips**: SOL tipping transactions
- **Channels**: Token-gated communities

## 🔐 Security Features

- Wallet signature verification
- Token balance validation
- Rate limiting on posts
- Input sanitization
- CSRF protection

## 🚧 Roadmap

### Phase 1 (MVP) ✅
- [x] Dual authentication system
- [x] Basic social feed
- [x] Post creation and interactions
- [x] User profiles
- [x] Dark mode UI

### Phase 2 (Coming Soon)
- [ ] Real-time updates with Socket.io
- [ ] Token-gated channel access
- [ ] SOL tipping functionality
- [ ] Advanced token tagging
- [ ] Mobile app

### Phase 3 (Future)
- [ ] NFT integration
- [ ] DeFi portfolio tracking
- [ ] Cross-chain support
- [ ] Advanced analytics
- [ ] API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation for the amazing blockchain
- Next.js team for the excellent framework
- Prisma team for the great ORM
- All the open-source contributors

---

**Built with ❤️ for the crypto degen community**