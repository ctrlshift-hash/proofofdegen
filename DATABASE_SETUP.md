# Database Setup Guide

## Quick Setup (Using SQLite for Development)

If you want to get started quickly without setting up PostgreSQL, you can use SQLite for development:

### 1. Update Prisma Schema
Change the datasource in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 2. Update Environment Variables
In your `.env.local` file, add:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 3. Run Migrations
```bash
npm run db:migrate
```

## Production Setup (PostgreSQL)

For production, use PostgreSQL:

### 1. Install PostgreSQL
- Download from https://www.postgresql.org/download/
- Create a database called `degenhub`

### 2. Update Environment Variables
In your `.env.local` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/degenhub"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 3. Run Migrations
```bash
npm run db:migrate
```

## Next Steps

After setting up the database:

1. **Start the development server**: `npm run dev`
2. **Test registration**: Go to `/auth/login` and create an account
3. **Test posting**: Create your first post
4. **Test interactions**: Like and repost posts

## Troubleshooting

- **Database connection error**: Check your DATABASE_URL
- **Migration fails**: Make sure the database exists
- **Authentication fails**: Check NEXTAUTH_SECRET is set
