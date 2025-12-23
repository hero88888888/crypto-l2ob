# 🚀 L2 Orderbook Analyzer - Master Setup Guide

This comprehensive guide consolidates ALL setup steps to transform your L2 Orderbook Analyzer into a production-ready application with professional monitoring, deployment, and development tools.

## 📋 Prerequisites Checklist

- [ ] GitHub account with verified student status
- [ ] Node.js 18+ and npm installed
- [ ] Python 3.8+ installed
- [ ] Git configured with GitHub
- [ ] GitHub Student Developer Pack activated

---

## 🎯 Quick Start (15 minutes)

### Step 1: Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/yourusername/crypto-L2OB.git
cd crypto-L2OB

# Install backend dependencies (choose one)
# Option A: Python backend (RECOMMENDED)
cd python_server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Option B: Node.js backend
npm install

# Install frontend dependencies
cd client
npm install
```

### Step 2: Environment Configuration

Create `.env` files:

```bash
# Backend: crypto-L2OB/.env (or python_server/.env)
NODE_ENV=development
PORT=3001

# Frontend: crypto-L2OB/client/.env.local
REACT_APP_API_URL=http://localhost:3001
```

### Step 3: Run the Application

```bash
# Start everything with one command
./start_python.sh  # or ./start.sh for Node.js
```

Access at: http://localhost:3000

---

## 🛠️ Development Environment Setup

### 1. GitHub Copilot (FREE for students)
**AI pair programming assistant**

```bash
# Install VS Code extension
code --install-extension GitHub.copilot

# Activate in GitHub account settings
# Go to: https://github.com/settings/copilot
# Enable for free with student account
```

### 2. GitHub Codespaces (FREE for students)
**Cloud development environment**

```bash
# Create .devcontainer/devcontainer.json
mkdir .devcontainer
```

Create `.devcontainer/devcontainer.json`:
```json
{
  "name": "L2 Orderbook Dev",
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/python:1": {}
  },
  "postCreateCommand": "npm install && cd client && npm install",
  "forwardPorts": [3000, 3001],
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

### 3. Git Configuration

```bash
# Configure Git with GPG signing
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global commit.gpgsign true
```

---

## 🗄️ Database Setup

### Option A: Supabase (Recommended - Free tier)

```bash
# 1. Create account at https://supabase.com
# 2. Create new project "crypto-l2ob"
# 3. Get API keys from Settings > API
```

Add to `client/.env.local`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Run database migrations:
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  name TEXT NOT NULL,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Option B: MongoDB (FREE $50 credits)

```bash
# 1. Sign up at https://www.mongodb.com/students
# 2. Create cluster (M0 Free tier + $50 credits)
# 3. Get connection string
```

Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/l2orderbook
```

---

## 🚀 Deployment Options

### Option 1: DigitalOcean (FREE $200 credits)

```bash
# 1. Sign up with GitHub Student Pack
# https://www.digitalocean.com/github-students

# 2. Install doctl CLI
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# 3. Create App Platform deployment
doctl apps create --spec .do/app.yaml
```

Create `.do/app.yaml`:
```yaml
name: l2-orderbook-analyzer
region: nyc
services:
  - name: backend
    github:
      repo: yourusername/crypto-L2OB
      branch: main
      deploy_on_push: true
    source_dir: python_server
    environment_slug: python
    run_command: python server_async.py
    envs:
      - key: PYTHON_VERSION
        value: "3.11"
    http_port: 3001
    
  - name: frontend
    github:
      repo: yourusername/crypto-L2OB
      branch: main
    source_dir: client
    environment_slug: node-js
    build_command: npm run build
    envs:
      - key: REACT_APP_API_URL
        value: ${backend.PUBLIC_URL}
```

### Option 2: Heroku (FREE $13/month for 24 months)

```bash
# 1. Sign up at https://www.heroku.com/github-students
# 2. Install Heroku CLI
brew install heroku/brew/heroku  # macOS

# 3. Create apps
heroku create l2-orderbook-backend
heroku create l2-orderbook-frontend

# 4. Deploy
git push heroku main
```

Create `Procfile`:
```
web: cd python_server && python server_async.py
```

### Option 3: Netlify (Frontend) + Railway (Backend)

```bash
# Frontend on Netlify
npm install -g netlify-cli
cd client
npm run build
netlify deploy --prod --dir=build

# Backend on Railway
# Sign up at https://railway.app
# Connect GitHub repo and deploy
```

---

## 📊 Monitoring & Analytics

### 1. Sentry (Error Tracking - FREE for students)

```bash
# Sign up at https://sentry.io/for/students/
npm install @sentry/react @sentry/node
```

Add to `client/src/index.tsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Datadog (Infrastructure Monitoring - FREE 2 years)

```bash
# Sign up at https://www.datadoghq.com/students/
# Install agent
DD_API_KEY=your_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)"
```

Add to `python_server/server_async.py`:
```python
from ddtrace import tracer
tracer.configure(
    hostname='localhost',
    port=8126,
)
```

### 3. New Relic (Performance Monitoring - FREE $300/month)

```bash
# Sign up at https://newrelic.com/students
npm install newrelic
```

Create `newrelic.js`:
```javascript
exports.config = {
  app_name: ['L2 Orderbook Analyzer'],
  license_key: 'YOUR_LICENSE_KEY',
  logging: {
    level: 'info'
  }
};
```

---

## 🔒 Security & Authentication

### 1. 1Password (FREE for 1 year)

```bash
# Sign up at https://1password.com/students
# Store all API keys and credentials
```

### 2. Auth Setup with Auth0 (Alternative to Supabase Auth)

```bash
npm install @auth0/auth0-react
```

Create `client/src/auth/Auth0Provider.tsx`:
```javascript
import { Auth0Provider } from '@auth0/auth0-react';

export const Auth0ProviderWithHistory = ({ children }) => {
  return (
    <Auth0Provider
      domain="YOUR_DOMAIN.auth0.com"
      clientId="YOUR_CLIENT_ID"
      redirectUri={window.location.origin}
      audience="YOUR_API_IDENTIFIER"
    >
      {children}
    </Auth0Provider>
  );
};
```

---

## 🧪 Testing & CI/CD

### 1. GitHub Actions (FREE)

Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd python_server
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          cd python_server
          pytest tests/ --cov=. --cov-report=xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to DigitalOcean
        run: |
          doctl apps create-deployment ${{ secrets.DO_APP_ID }}
```

### 2. BrowserStack (Cross-browser Testing - FREE)

```javascript
// browserstack.config.js
module.exports = {
  username: process.env.BROWSERSTACK_USERNAME,
  accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
  browsers: [
    { browser: 'chrome', browser_version: 'latest', os: 'Windows', os_version: '11' },
    { browser: 'firefox', browser_version: 'latest', os: 'OS X', os_version: 'Monterey' },
    { browser: 'safari', browser_version: 'latest', os: 'OS X', os_version: 'Monterey' },
    { device: 'iPhone 14 Pro', os_version: '16', real_mobile: true }
  ]
};
```

---

## 🌐 Domain & SSL

### 1. Get Free Domain

Choose one:
- **Namecheap**: Free .me domain for 1 year
- **Name.com**: Free .app, .dev, .live domain

```bash
# After getting domain, configure DNS:
# A Record: @ -> Your server IP
# CNAME: www -> yourdomain.com
```

### 2. SSL Certificate (FREE with Namecheap)

```bash
# Or use Let's Encrypt (always free)
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

---

## 📱 Mobile App Distribution

### TestFlight (iOS) / Play Console (Android)

```bash
# Build mobile app
cd client
npm run build:mobile

# iOS: Upload to App Store Connect
# Android: Upload to Google Play Console
```

---

## 💳 Monetization (Optional)

### Stripe Integration (FREE first $1000 processing)

```bash
npm install stripe @stripe/stripe-js
```

Create `server/payment.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 999, // $9.99
    currency: 'usd',
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});
```

---

## 📚 Learning Resources (FREE with Student Pack)

### 1. DataCamp (3 months FREE)
- Complete "Python for Finance" track
- Learn "Time Series Analysis"

### 2. Educative (6 months FREE)
- "System Design for Interviews"
- "Web Development with React"

### 3. FrontendMasters (6 months FREE)
- "Full Stack for Front-End Engineers"
- "AWS for Front-End Engineers"

---

## 🚨 Production Checklist

Before going live, ensure:

- [ ] **Security**
  - [ ] API keys in environment variables
  - [ ] HTTPS enabled
  - [ ] Rate limiting configured
  - [ ] CORS properly configured
  - [ ] SQL injection prevention
  - [ ] XSS protection

- [ ] **Performance**
  - [ ] Code minified and bundled
  - [ ] Images optimized
  - [ ] Gzip compression enabled
  - [ ] CDN configured
  - [ ] Database indexed

- [ ] **Monitoring**
  - [ ] Sentry error tracking active
  - [ ] Datadog monitoring configured
  - [ ] Uptime monitoring enabled
  - [ ] Log aggregation setup

- [ ] **Backup**
  - [ ] Database automated backups
  - [ ] Code in version control
  - [ ] Disaster recovery plan

- [ ] **Legal**
  - [ ] Privacy policy
  - [ ] Terms of service
  - [ ] Cookie consent
  - [ ] Data protection compliance

---

## 🆘 Support & Resources

### GitHub Education Community
- Discord: https://discord.gg/github-education
- Forum: https://github.community/c/education

### Project-Specific Help
- Sentry: https://sentry.io/support/
- DigitalOcean: https://www.digitalocean.com/support/
- MongoDB: https://www.mongodb.com/community/forums/

### Emergency Contacts
- GitHub Support: support@github.com
- Critical Issues: Create issue in repo with "urgent" label

---

## 📈 Next Steps

1. **Week 1**: Development environment + Database
2. **Week 2**: Deployment + Domain setup
3. **Week 3**: Monitoring + Error tracking
4. **Week 4**: Testing + CI/CD
5. **Month 2**: Performance optimization
6. **Month 3**: Scale and monetize

---

## 🎯 Pro Tips

1. **Use GitHub Projects** for task management
2. **Enable GitHub Dependabot** for security updates
3. **Set up GitHub Environments** for staging/production
4. **Use GitHub Packages** for Docker images
5. **Enable GitHub Advanced Security** (free for students)

---

**Remember**: All these services are FREE with your GitHub Student Pack. Take advantage of them to build a professional-grade application!

Last Updated: December 2024
Version: 1.0.0
