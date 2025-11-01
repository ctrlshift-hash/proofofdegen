# Comprehensive Trading Data API Setup

To get **all trades from all tokens with PnLs**, you need to set up API keys for comprehensive blockchain data providers.

## Quick Start

1. **Get Birdeye API Key:**
   - Visit: https://birdeye.so/data-services
   - Sign up → Login → Security tab → Generate Key
   - Copy your API key

2. **Add to `.env.local`:**
   ```bash
   BIRDEYE_API_KEY=your_api_key_here
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

## Recommended: Birdeye API (Best for Solana)

**Why Birdeye:**
- ✅ Covers ALL Solana DEXes (Raydium, Jupiter, Orca, Pump.fun, etc.)
- ✅ Real-time trading data
- ✅ Built-in PnL calculations (realized & unrealized)
- ✅ Token prices and USD values
- ✅ Token names and symbols (human-readable)
- ✅ Free tier: 100 requests/day
- ✅ Then $0.001 per request (very cheap)

**API Endpoints Used:**
- `/v1/wallet/txn_list` - Wallet transaction history (all trades)
- `/v1/wallet/pnl_summary` - PnL summary with win rate
- See full docs: https://docs.birdeye.so/

### Setup Steps:

1. **Sign up at Birdeye:**
   - Go to https://birdeye.so/
   - Create account and get API key

2. **Add to `.env.local`:**
   ```
   BIRDEYE_API_KEY=your_api_key_here
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Alternative: Solscan API (Free)

**Why Solscan:**
- ✅ Free tier available
- ✅ Good for basic transaction data
- ❌ Less comprehensive than Birdeye

### Setup:

1. **Get API key:**
   - Go to https://solscan.io/
   - Sign up and get API token

2. **Add to `.env.local`:**
   ```
   SOLSCAN_API_KEY=your_token_here
   ```

## Alternative: Bitquery (Enterprise)

**Why Bitquery:**
- ✅ Very comprehensive
- ✅ GraphQL API
- ✅ Real-time subscriptions
- ❌ More complex setup
- ❌ Paid plans

## What You'll Get:

✅ **All traded tokens** - Not just connected wallets
✅ **Real-time data** - Up-to-date trades
✅ **PnL calculations** - Built-in profit/loss
✅ **USD values** - Automatic price conversions
✅ **All DEXes** - Pump.fun, Raydium, Jupiter, etc.
✅ **Token symbols** - Human-readable names

## Cost Estimate:

- **Free tier (Birdeye):** 100 wallets/day
- **Paid:** ~$0.10 per 100 wallets (very cheap)
- For 1000 active users: ~$1/day

## Next Steps:

1. Sign up for Birdeye API
2. Add API key to `.env.local`
3. Restart server
4. View trades will now show comprehensive data!

The app will automatically use Birdeye if available, or fall back to our parser if not.

