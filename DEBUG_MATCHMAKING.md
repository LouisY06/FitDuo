# Debug Matchmaking - "Finding a rival..." Issue

## The Problem

You're stuck on "Finding a rival..." and don't know if you matched.

## How to Debug

### Step 1: Open Browser Console

1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for these messages:

#### ✅ Good Signs:
```
🔌 Connecting to matchmaking WebSocket for player X
✅ Connected to matchmaking WebSocket for player X
✅ Matchmaking WebSocket connected successfully
📨 Matchmaking WebSocket message received: {type: "MATCH_FOUND", ...}
✅ Match found via WebSocket: {game_id: 123, ...}
🎯 Calling onMatchFound callback
🎮 Match found in BattleScreen!
🚀 Navigating to battle: 123
```

#### ❌ Bad Signs:
```
❌ Failed to connect to matchmaking WebSocket: ...
Matchmaking WebSocket error: ...
⚠️ No onMatchFound callback registered!
```

### Step 2: Check Railway Logs

Go to **Railway → Your Service → Logs** and look for:

#### ✅ Good Signs:
```
Player X added to matchmaking queue (total in queue: 2)
Match found! Player X vs Player Y (FIFO matching)
Match notification sent to player X
Match notification sent to player Y
```

#### ❌ Bad Signs:
```
Player X not connected to matchmaking WebSocket (has 0 connections)
Error sending match notification to player X: ...
```

### Step 3: Check WebSocket Connection

In browser console, you should see:
```
✅ Connected to matchmaking WebSocket for player X
```

If you don't see this, the WebSocket isn't connecting.

### Step 4: Check if Match is Found

In browser console, look for:
```
📨 Matchmaking WebSocket message received: {type: "MATCH_FOUND", ...}
```

If you see this, the match was found but the callback might not be working.

## Common Issues

### Issue 1: WebSocket Not Connecting

**Symptom**: No "✅ Connected to matchmaking WebSocket" message

**Possible Causes**:
- WebSocket URL is wrong
- CORS issue with WebSocket
- Railway WebSocket endpoint not accessible

**Fix**: Check Railway logs for WebSocket connection errors

### Issue 2: Match Found But No Notification

**Symptom**: See "Match found!" in Railway logs but not in browser

**Possible Causes**:
- WebSocket message format is wrong
- Callback not registered
- Frontend not handling message correctly

**Fix**: Check browser console for "📨 Matchmaking WebSocket message received"

### Issue 3: Callback Not Called

**Symptom**: See message received but no "🎯 Calling onMatchFound callback"

**Possible Causes**:
- `onMatchFound` callback not registered
- Message type is wrong

**Fix**: Check browser console for callback registration

## Quick Test

1. **Open browser console (F12)**
2. **Join matchmaking queue**
3. **Watch console for:**
   - WebSocket connection
   - Match found message
   - Callback execution
4. **Check Railway logs for:**
   - Players added to queue
   - Match created
   - Notifications sent

## What to Share

If still not working, share:
1. Browser console logs (all messages)
2. Railway logs (matching section)
3. Screenshot of the "Finding a rival..." screen

