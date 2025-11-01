# Deployment Guide for Vercel

This guide will help you deploy DegenHub to Vercel with all necessary environment variables.

## Prerequisites

1. **GitHub Repository** ✅ (You already have: https://github.com/ctrlshift-hash/DegenHub)
2. **Cloud Database** (PostgreSQL) - Choose one:
   - [PlanetScale](https://planetscale.com) (recommended)
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)
   - [Railway](https://railway.app)

## Step 1: Set Up Database

### Option A: PlanetScale (Recommended)

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Copy the connection string (will look like: `mysql://...`)
4. **Note**: PlanetScale uses MySQL. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

### Option B: Supabase/Neon/Railway (PostgreSQL)

1. Sign up and create a new PostgreSQL database
2. Copy the connection string (will look like: `postgresql://...`)
3. Your schema already uses PostgreSQL ✅

## Step 2: Run Database Migrations

Once you have your database connection string:

```bash
# Set DATABASE_URL locally (or in your terminal)
export DATABASE_URL="your-connection-string-here"

# Generate Prisma Client
npx prisma generate

# Push schema to database (or migrate)
npx prisma db push
# OR for production:
npx prisma migrate deploy
```

## Step 3: Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 4: Deploy to Vercel

### Via Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository: `ctrlshift-hash/DegenHub`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Environment Variables in Vercel:

Add these in **Settings → Environment Variables**:

#### Required Variables:

```
DATABASE_URL=your-database-connection-string
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

#### Optional but Recommended:

```
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

#### For Development (Devnet):

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### After Setting Environment Variables:

1. Click "Deploy"
2. Wait for build to complete
3. Once deployed, go to project settings
4. Run database migrations:
   - Go to **Settings → Environment Variables**
   - Copy your `DATABASE_URL`
   - In your local terminal, set it and run:
   ```bash
   export DATABASE_URL="your-vercel-database-url"
   npx prisma migrate deploy
   ```

## Step 5: Update Database Schema (if needed)

If you need to update your database after deployment:

```bash
# Set DATABASE_URL to your production database
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

## Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | Database connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | ✅ Yes | Secret for JWT signing | Generated 32-char string |
| `NEXTAUTH_URL` | ✅ Yes | Your app's public URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | For sharing links | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | ⚠️ Optional | Solana network | `mainnet-beta` or `devnet` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | ⚠️ Optional | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |

## Important Notes

1. **Database**: Do NOT use local SQLite for production. Always use a cloud database.
2. **Secrets**: Never commit secrets to GitHub. Use Vercel environment variables.
3. **Build Settings**: Vercel auto-detects Next.js, but verify:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **File Uploads**: The `/api/jeet-cards` route saves to `public/jeet-cards/`. This works locally but **won't persist on Vercel** (serverless). Consider:
   - Using Vercel Blob Storage
   - Using Cloudinary/Supabase Storage
   - Using S3/Cloudflare R2

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Verify `DATABASE_URL` is correct
- Ensure Prisma Client is generated: `npx prisma generate`

### Database Connection Issues

- Verify `DATABASE_URL` format is correct
- Check database allows connections from Vercel IPs
- For PlanetScale, ensure you're using the MySQL provider

### Image Uploads Don't Persist

- This is expected on Vercel (serverless functions)
- Implement cloud storage (see above)

## Next Steps

1. Set up a custom domain in Vercel
2. Configure production RPC endpoints (Helius, QuickNode, etc.)
3. Set up image storage (Cloudinary, Supabase Storage)
4. Configure monitoring (Vercel Analytics)

---

**Need help?** Check the [Vercel Docs](https://vercel.com/docs) or [Prisma Docs](https://www.prisma.io/docs)

