# Matchmaking Debug Guide

## Issues Fixed

1. **Match threshold too strict** - Increased from 50.0 to 100.0 for easier matching
2. **Better logging** - Added queue size and match score logging
3. **Periodic matching** - Added `_try_match_all_players()` to check all players when queue has 2+ players
4. **WebSocket warnings** - Better logging when WebSocket not connected

## Testing Matchmaking

### Step 1: Check Queue Status

After joining queue, check Railway logs:
```
Player X added to matchmaking queue (total in queue: 2)
```

### Step 2: Check Matching

Look for these log messages:
```
Match found! Player X vs Player Y (score: 45.23)
Match notification sent to player X
```

### Step 3: Check WebSocket Connection

Make sure you see:
```
Player X connected to matchmaking WebSocket
```

If you see warnings like:
```
Player X not connected to matchmaking WebSocket
```

This means the WebSocket isn't connected properly.

## Common Issues

### Issue 1: Players Not Matching

**Symptoms:** Players in queue but no matches found

**Check:**
1. Railway logs - are players being added?
2. Match scores - are they below threshold (100.0)?
3. WebSocket connections - are they established?

**Fix:**
- Check match scores in logs
- If scores are too high, threshold might need adjustment
- Ensure WebSocket connections are working

### Issue 2: WebSocket Not Connected

**Symptoms:** "Player X not connected to matchmaking WebSocket"

**Check:**
1. Frontend WebSocket connection code
2. Railway WebSocket endpoint working
3. CORS for WebSocket connections

**Fix:**
- Check `frontend/src/services/matchmaking.ts` WebSocket connection
- Verify Railway WebSocket endpoint is accessible
- Check CORS settings for WebSocket

### Issue 3: 404 on /api/matchmaking/queue

**Symptoms:** 404 error when joining queue

**Check:**
1. Route is registered in `main.py`
2. Authentication is working
3. Request body is correct

**Fix:**
- Verify route exists: `POST /api/matchmaking/queue`
- Check authentication token
- Ensure request has proper body: `{}` or `{"exercise_id": 1}`

## Debug Commands

### Check Queue Size
```bash
curl https://fitduo-production.up.railway.app/api/matchmaking/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Railway Logs
1. Railway Dashboard → Your Service → Logs
2. Look for:
   - "Player X added to matchmaking queue"
   - "Match found!"
   - "Match notification sent"

## Next Steps

1. **Test with 2 players:**
   - Both join queue
   - Check Railway logs for matching
   - Verify WebSocket notifications

2. **Check match scores:**
   - If scores are high (>100), players might be too different
   - Consider adjusting threshold or matching algorithm

3. **Verify WebSocket:**
   - Check frontend WebSocket connection
   - Verify Railway WebSocket endpoint
   - Test WebSocket notifications

