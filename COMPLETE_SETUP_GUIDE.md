# 🚀 Complete Database & Auth Setup Guide

## Quick Start (5 Minutes)

### 1️⃣ Run Setup Script
```bash
chmod +x SUPABASE_SETUP.sh
./SUPABASE_SETUP.sh
```

This will:
- ✅ Check dependencies
- ✅ Install Supabase libraries
- ✅ Create environment files
- ✅ Generate SQL schema file

### 2️⃣ Create Supabase Project

1. **Sign up at [Supabase.com](https://supabase.com)**
   - Use your GitHub account (with Education Pack)
   - It's completely free, no credit card needed

2. **Create New Project**
   ```
   Project Name: crypto-l2ob
   Database Password: [Click Generate] 
   Region: [Choose closest to you]
   ```
   **⚠️ SAVE YOUR DATABASE PASSWORD!**

3. **Wait 2 minutes** for project to initialize

### 3️⃣ Get Your API Keys

1. In Supabase Dashboard, go to **Settings → API**
2. You'll see three keys:
   
   | Key | Where to Use | Safe to Share? |
   |-----|--------------|----------------|
   | **Project URL** | Both frontend & backend | ✅ Yes |
   | **anon (public)** | Frontend only | ✅ Yes |
   | **service_role** | Backend only | ❌ Keep Secret! |

### 4️⃣ Update Environment Files

#### Frontend: `client/.env.local`
```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Backend: `python_server/.env`
```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-random-secret-key-here
```

### 5️⃣ Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy ALL content from `supabase_schema.sql`
4. Paste and click **Run**
5. You should see "Success. No rows returned"

### 6️⃣ Enable Authentication

1. Go to **Authentication → Settings**
2. Enable these providers:
   - ✅ Email (already enabled)
   - ✅ GitHub (optional)
   - ✅ Google (optional)

For OAuth providers:
- **GitHub**: Settings → Developer settings → OAuth Apps → New
  - Callback URL: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- **Google**: [Console](https://console.cloud.google.com) → Create OAuth 2.0 Client
  - Authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

### 7️⃣ Restart Your App

```bash
# Terminal 1: Python Backend
cd python_server
python3 server.py

# Terminal 2: React Frontend
cd client
npm start
```

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] API keys added to .env files
- [ ] Database tables created (check Table Editor in Supabase)
- [ ] Dependencies installed (`@supabase/supabase-js`)
- [ ] App restarts without errors

## 🎯 Testing Authentication

1. Open http://localhost:3000
2. You'll see a login screen
3. Click "Sign up" to create account
4. Check email for verification (if enabled)
5. Login with credentials

## 📊 What You Get

### Database Tables
- **user_profiles**: User accounts with paper trading balance
- **strategies**: Saved trading strategies per user
- **paper_trades**: All simulated trades
- **trading_performance**: Daily performance metrics
- **watchlists**: User's favorite symbols

### Security Features
- **Row Level Security**: Users only see their own data
- **JWT Authentication**: Secure token-based auth
- **OAuth Support**: Login with GitHub/Google
- **Email Verification**: Optional email confirmation

### Real-time Features
- Live strategy updates
- Real-time trade notifications
- Instant balance updates

## 🔧 Troubleshooting

### "Module not found: @supabase/supabase-js"
```bash
cd client
npm install @supabase/supabase-js
```

### "Invalid API key"
- Check you copied the complete key (they're long!)
- Make sure you're using `anon` key for frontend, not `service_role`

### "Permission denied" errors
- Check Row Level Security policies are created
- Verify user is logged in

### Can't see data in database
- Go to Table Editor in Supabase
- Check RLS is enabled but policies exist
- Try using service_role key for debugging (backend only!)

## 🎓 GitHub Education Benefits

Your education pack includes:
- **MongoDB Atlas**: $200 credits (alternative to Supabase)
- **DigitalOcean**: $200 credits (for hosting)
- **Namecheap**: Free domain name
- **Auth0**: Upgraded free account

## 🚀 Next Steps

1. **Test Paper Trading**: Create strategies and watch them execute
2. **Customize Auth**: Add profile pictures, settings
3. **Deploy**: Use Vercel (free) for frontend, Railway for backend
4. **Share Strategies**: Add public/private strategy sharing
5. **Leaderboard**: Compare performance with others

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Docs](https://supabase.com/docs/guides/auth)

## 💡 Pro Tips

1. **Free Limits**: 
   - 500MB database
   - 2GB bandwidth
   - 50,000 monthly active users
   - Unlimited API requests

2. **Backup Your Data**:
   ```sql
   -- Export strategies
   SELECT * FROM strategies WHERE user_id = 'your-user-id';
   ```

3. **Monitor Usage**:
   - Check Settings → Usage in Supabase
   - Set up alerts before limits

4. **Production Ready**:
   - Add rate limiting
   - Enable captcha for signups
   - Set up proper CORS headers
   - Use environment variables for all keys

---

**Need Help?** 
- Check `supabase_schema.sql` for database structure
- Review `DATABASE_SETUP_GUIDE.md` for detailed explanations
- Supabase Discord: https://discord.supabase.com
