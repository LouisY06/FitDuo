# Deployment Checklist

Use this checklist when deploying to Railway + Vercel.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] Firebase credentials ready

## Railway (Backend) Setup

- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] PostgreSQL database added
- [ ] Environment variables set:
  - [ ] `ENVIRONMENT=production`
  - [ ] `CORS_ORIGINS` (will update after Vercel deploy)
  - [ ] `FIREBASE_CREDENTIALS`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `OPENROUTER_MODEL`
- [ ] Backend deployed successfully
- [ ] Database migrations run: `railway run alembic upgrade head`
- [ ] Backend URL noted: `https://your-app.up.railway.app`
- [ ] Health check works: `curl https://your-app.up.railway.app/health`

## Vercel (Frontend) Setup

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Build settings configured (auto-detected Vite)
- [ ] Environment variables set:
  - [ ] `VITE_API_URL` (Railway backend URL)
  - [ ] `VITE_WS_URL` (Railway WebSocket URL with wss://)
  - [ ] All Firebase config variables
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted: `https://your-app.vercel.app`

## Post-Deployment Configuration

- [ ] Update Railway `CORS_ORIGINS` with Vercel domain
- [ ] Redeploy Railway backend
- [ ] Update Firebase authorized domains:
  - [ ] Go to Firebase Console → Authentication → Settings
  - [ ] Add: `your-app.vercel.app`
  - [ ] Add custom domain if using one

## Testing

- [ ] Backend health endpoint works
- [ ] Frontend loads without errors
- [ ] Login/signup works
- [ ] API calls work (check browser network tab)
- [ ] WebSocket connection works:
  ```javascript
  const ws = new WebSocket('wss://your-app.up.railway.app/ws/1?player_id=1');
  ws.onopen = () => console.log('✅ Connected!');
  ```
- [ ] Create match works
- [ ] Real-time updates work (test with two browsers)

## Production Readiness

- [ ] Custom domains configured (if using)
- [ ] SSL certificates active (automatic on Railway/Vercel)
- [ ] Error monitoring set up (optional)
- [ ] Logs accessible and monitored
- [ ] Database backups configured (Railway Pro plan)

## Notes

- **WebSocket Support**: ✅ Railway fully supports WebSockets
- **Database**: PostgreSQL on Railway (auto-configured)
- **Cost**: ~$5-25/month depending on plan
- **Scaling**: Both platforms auto-scale

---

## Quick Commands

### Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# Run migrations
railway run alembic upgrade head

# View logs
railway logs

# Open shell
railway shell
```

### Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

