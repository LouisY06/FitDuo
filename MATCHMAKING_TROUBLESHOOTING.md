# Matchmaking Troubleshooting Guide

## Issue: Players Not Matching

If players join the queue but don't get matched, check these:

### Step 1: Check Railway Logs

Go to **Railway → Your Service → Logs** and look for:

#### ✅ Good Signs:
```
Player 1 added to matchmaking queue (total in queue: 1)
Player 2 added to matchmaking queue (total in queue: 2)
Trying to match all players in queue (size: 2)
Match found! Player 1 vs Player 2 (score: 45.23, threshold: 100.00)
Match notification sent to player 1
Match notification sent to player 2
```

#### ❌ Bad Signs:
```
Player 1 added to matchmaking queue (total in queue: 1)
Player 2 added to matchmaking queue (total in queue: 2)
No match yet for player 1. Best score: 250.50 (threshold: 200.00) - score too high!
```

**If you see "score too high":**
- The match score is above the threshold (100, or 200 with expansion)
- This means players are too different in skill
- **Solution**: The score weights have been reduced, so this should be less common now

#### ⚠️ WebSocket Issues:
```
Player 1 not connected to matchmaking WebSocket (has 0 connections)
```

**If you see this:**
- WebSocket connection isn't established
- Match notifications won't work
- **Solution**: Check frontend WebSocket connection code

### Step 2: Check Match Scores

The match score is calculated from:
- **Level difference**: 5 points per level difference
- **XP difference**: 0.5 points per 100 XP difference
- **Win rate difference**: 50 points per 0.1 win rate difference

**Example:**
- Player 1: Level 5, 1000 XP, 0.5 win rate
- Player 2: Level 3, 800 XP, 0.6 win rate
- Score: (2 levels × 5) + (200 XP / 200) + (0.1 win rate × 500) = 10 + 1 + 50 = **61 points** ✅ (below 100 threshold)

### Step 3: Check Queue Status

Both players should see:
- `in_queue: true`
- `queue_position: 1` or `2`
- `estimated_wait: 5` (seconds)

If one player shows `in_queue: false`, they're not actually in the queue.

### Step 4: Check WebSocket Connections

In Railway logs, look for:
```
Player X connected to matchmaking WebSocket
```

If you don't see this, the WebSocket isn't connecting.

### Step 5: Common Issues

#### Issue 1: Players Too Different
**Symptom**: "score too high" in logs

**Fix**: 
- Score weights have been reduced
- Threshold is 100 (expands to 200)
- Should match most players now

#### Issue 2: WebSocket Not Connected
**Symptom**: "Player X not connected to matchmaking WebSocket"

**Fix**:
- Check frontend WebSocket connection
- Verify Railway WebSocket endpoint is accessible
- Check CORS for WebSocket

#### Issue 3: Race Condition
**Symptom**: Both players in queue but no match

**Fix**: 
- Fixed by only trying to match first player in `_try_match_all_players`
- Prevents duplicate match attempts

#### Issue 4: Players Removed Too Quickly
**Symptom**: Players join but immediately leave queue

**Fix**:
- Check if `remove_player` is being called unexpectedly
- Check queue timeout (5 minutes)

## Testing

1. **Both players join queue**
2. **Check Railway logs** for matching attempts
3. **Look for match scores** - should be < 100
4. **Check WebSocket connections** - both should be connected
5. **Wait 5-10 seconds** - matching should happen quickly

## Debug Commands

### Check Queue Status (from frontend):
```javascript
// In browser console
fetch('https://fitduo-production.up.railway.app/api/matchmaking/status', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.json()).then(console.log)
```

### Check Railway Logs:
1. Railway Dashboard → Your Service → Logs
2. Filter for: "matchmaking", "Player", "Match found"
3. Look for queue size, match scores, WebSocket status

## Next Steps

If still not working:
1. Share Railway logs showing the matching attempts
2. Check if match scores are being calculated
3. Verify WebSocket connections are established
4. Check if players are being removed from queue unexpectedly

