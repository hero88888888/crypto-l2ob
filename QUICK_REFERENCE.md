# 🚀 L2 Orderbook Analyzer - Quick Reference

## 🎯 Start Here

```bash
# First time setup (15 minutes)
git clone https://github.com/yourusername/crypto-L2OB.git
cd crypto-L2OB
./setup.sh  # Interactive setup script

# Quick start (daily use)
./start_python.sh  # Starts everything
```

## 📍 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:3001 | - |
| **Mobile App** | http://localhost:3000 | Auto-detects mobile |
| **Grafana** | http://localhost:3003 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |

## 🔑 Essential Commands

### Development
```bash
# Python backend
cd python_server
source venv/bin/activate
python server_async.py

# Node.js frontend
cd client
npm start

# Run tests
pytest python_server/tests/
npm test --prefix client

# Generate mobile icons
python3 generate_icons.py
```

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all
docker-compose down

# Reset everything
docker-compose down -v
```

### Deployment
```bash
# Deploy to DigitalOcean
doctl apps create-deployment $DO_APP_ID

# Deploy to Heroku
git push heroku main

# Deploy to Netlify
netlify deploy --prod --dir=client/build
```

## 🎓 GitHub Student Pack Services

### Must-Have (Setup These First)
1. **GitHub Copilot** → VS Code → Extensions → GitHub.copilot
2. **MongoDB Atlas** → https://mongodb.com/students → Get $50 credit
3. **Sentry** → https://sentry.io/students → Add DSN to .env
4. **DigitalOcean** → https://digitalocean.com/github-students → $200 credit

### Quick Integration Code

#### Sentry (Error Tracking)
```javascript
// client/src/index.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ 
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: "production"
});
```

#### Datadog (Monitoring)
```python
# python_server/server_async.py
from ddtrace import tracer
tracer.configure(hostname='localhost', port=8126)
```

#### Stripe (Payments)
```javascript
// server/payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const payment = await stripe.paymentIntents.create({
  amount: 999,
  currency: 'usd'
});
```

## 📊 Environment Variables

### Required
```bash
# Backend
PORT=3001
NODE_ENV=production

# Database (pick one)
MONGODB_URI=mongodb+srv://...
SUPABASE_URL=https://...
DATABASE_URL=postgresql://...

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

### Monitoring (Optional but Recommended)
```bash
SENTRY_DSN=https://...@sentry.io/...
DD_API_KEY=...
NEW_RELIC_LICENSE_KEY=...
```

## 🔧 Troubleshooting

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Port already in use** | `lsof -i :3001` then `kill -9 <PID>` |
| **WebSocket not connecting** | Check firewall, use `ws://` not `wss://` locally |
| **Database connection failed** | Check .env, verify credentials, check network |
| **Module not found** | `npm install` or `pip install -r requirements.txt` |
| **Permission denied** | `chmod +x script.sh` |
| **Docker issues** | `docker system prune -a` |

### Quick Fixes
```bash
# Reset Python environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Reset Node modules
rm -rf node_modules package-lock.json
npm install

# Clear all caches
npm cache clean --force
pip cache purge
docker system prune -a
```

## 📈 Performance Optimization

### Backend
```python
# Use uvloop for 2-4x speed
import uvloop
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
```

### Frontend
```javascript
// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));

// Memoize expensive calculations
const metrics = useMemo(() => calculateMetrics(data), [data]);
```

### Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_orderbook_timestamp ON orderbooks(timestamp);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

## 🚀 Production Checklist

- [ ] Environment variables set
- [ ] SSL certificate configured
- [ ] Database backups enabled
- [ ] Monitoring active (Sentry/Datadog)
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Secrets in 1Password
- [ ] CI/CD pipeline working
- [ ] Domain configured
- [ ] CDN enabled

## 📱 Mobile PWA

### Install on iPhone
1. Open in Safari
2. Share → Add to Home Screen
3. Name: "L2 Orderbook"

### Install on Android
1. Open in Chrome
2. Menu → Install App

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **GitHub Student Pack** | https://education.github.com/pack |
| **Project Repo** | https://github.com/yourusername/crypto-L2OB |
| **Live Demo** | https://l2orderbook.app |
| **Documentation** | See MASTER_SETUP_GUIDE.md |
| **Support Discord** | https://discord.gg/github-education |

## 💡 Pro Tips

1. **Use GitHub Copilot** - It knows this codebase
2. **Monitor with Datadog** - Free for 2 years
3. **Deploy on DigitalOcean** - $200 free credits
4. **Store secrets in 1Password** - Free for students
5. **Test with BrowserStack** - Free for 1 year

## 🆘 Emergency Contacts

- **Critical Issues**: Create GitHub issue with `urgent` label
- **GitHub Education**: education@github.com
- **Sentry Support**: support@sentry.io (priority for students)
- **DigitalOcean**: support@digitalocean.com

---

**Remember**: All these services are FREE with your student account! 🎓

*Keep this guide handy - it has everything you need to run, deploy, and maintain your L2 Orderbook Analyzer*
