# Live Server Matchmaking Implementation Plan

## Current State

### ✅ What Exists
- **Backend**: Basic match creation (`POST /api/matches`) - requires both players
- **Backend**: WebSocket infrastructure for real-time game communication
- **Backend**: Game session model and logic
- **Frontend**: Matchmaking UI (`BattleScreen.tsx`) - currently mocked with `setTimeout`
- **Frontend**: WebSocket client for game connections

### ❌ What's Missing
- **Backend**: Matchmaking queue system
- **Backend**: Automatic player matching logic
- **Backend**: Matchmaking API endpoints
- **Backend**: WebSocket for matchmaking updates
- **Frontend**: Real matchmaking service integration

---

## Implementation Plan

### Phase 1: Backend Matchmaking Service

#### 1.1 Create Matchmaking Queue Service
**File**: `backend/app/services/matchmaking.py`

**Features:**
- In-memory queue of players waiting for matches
- Skill-based matching algorithm
- Auto-match players when suitable opponent found
- Queue timeout handling (remove stale players)

**Key Functions:**
```python
class MatchmakingQueue:
    - add_player(player_id, skill_level, preferences)
    - remove_player(player_id)
    - find_match(player_id) -> Optional[MatchResult]
    - get_queue_status(player_id) -> QueueStatus
```

**Matching Algorithm:**
- Match by skill level (level, XP, win rate)
- Match by preferred exercise (if specified)
- Expand search range if no match found after X seconds
- Create game session when match found

#### 1.2 Create Matchmaking API Endpoints
**File**: `backend/app/routers/matchmaking.py` (new file)

**Endpoints:**
- `POST /api/matchmaking/queue` - Join matchmaking queue
  - Body: `{ "exercise_id": optional, "preferences": optional }`
  - Returns: `{ "status": "queued", "queue_position": number }`
  
- `DELETE /api/matchmaking/queue` - Leave queue
  - Returns: `{ "status": "removed" }`
  
- `GET /api/matchmaking/status` - Get queue status
  - Returns: `{ "in_queue": bool, "queue_position": number, "estimated_wait": seconds }`

#### 1.3 WebSocket for Matchmaking Updates
**File**: `backend/app/routers/matchmaking.py`

**WebSocket Endpoint:**
- `WS /ws/matchmaking/{player_id}` - Real-time matchmaking updates
  - Sends `MATCH_FOUND` message when opponent found
  - Includes: `{ game_id, opponent_id, opponent_name, exercise_id }`

---

### Phase 2: Frontend Integration

#### 2.1 Create Matchmaking Service
**File**: `frontend/src/services/matchmaking.ts` (new file)

**Functions:**
```typescript
- joinQueue(exerciseId?: number) -> Promise<QueueStatus>
- leaveQueue() -> Promise<void>
- getQueueStatus() -> Promise<QueueStatus>
- connectMatchmakingWebSocket(playerId, onMatchFound) -> WebSocketClient
```

#### 2.2 Update BattleScreen Component
**File**: `frontend/src/components/screens/BattleScreen.tsx`

**Changes:**
- Replace `setTimeout` mock with real API calls
- Connect to matchmaking WebSocket
- Handle `MATCH_FOUND` event
- Redirect to battle screen when match found
- Show real queue status (position, estimated wait)

#### 2.3 Create Matchmaking Hook
**File**: `frontend/src/hooks/useMatchmaking.ts` (new file)

**Features:**
- Manage matchmaking state (in queue, searching, matched)
- Auto-connect to matchmaking WebSocket
- Handle match found event
- Auto-create game session when matched

---

## Technical Details

### Skill-Based Matching Algorithm

```python
def calculate_match_score(player1, player2):
    # Level difference (closer = better)
    level_diff = abs(player1.level - player2.level)
    
    # XP difference (closer = better)
    xp_diff = abs(player1.experience_points - player2.experience_points)
    
    # Win rate similarity (closer = better)
    win_rate_diff = abs(player1.win_rate - player2.win_rate)
    
    # Combined score (lower = better match)
    score = (level_diff * 10) + (xp_diff / 100) + (win_rate_diff * 100)
    return score

def find_best_match(player, queue):
    best_match = None
    best_score = float('inf')
    
    for opponent in queue:
        if opponent.player_id == player.player_id:
            continue
        score = calculate_match_score(player, opponent)
        if score < best_score:
            best_score = score
            best_match = opponent
    
    return best_match if best_score < MATCH_THRESHOLD else None
```

### Queue Management

- **Add to queue**: When player clicks "Find Rival"
- **Remove from queue**: 
  - When match found
  - When player leaves/cancels
  - When player disconnects
  - After timeout (e.g., 5 minutes)
  
- **Match creation**: When two players matched, automatically:
  1. Create `GameSession` with both players
  2. Notify both players via WebSocket
  3. Remove both from queue

### WebSocket Message Types

**Matchmaking WebSocket:**
- `MATCH_FOUND`: `{ game_id, opponent_id, opponent_name, exercise_id }`
- `QUEUE_UPDATE`: `{ queue_position, estimated_wait }`
- `MATCH_CANCELLED`: `{ reason }`

---

## Implementation Steps

### Step 1: Backend Matchmaking Service
1. Create `backend/app/services/matchmaking.py`
2. Implement `MatchmakingQueue` class
3. Add skill-based matching algorithm
4. Add queue timeout handling

### Step 2: Backend API Endpoints
1. Create `backend/app/routers/matchmaking.py`
2. Add REST endpoints (join, leave, status)
3. Add WebSocket endpoint for matchmaking
4. Register router in `main.py`

### Step 3: Frontend Service
1. Create `frontend/src/services/matchmaking.ts`
2. Implement API calls (join, leave, status)
3. Create WebSocket client for matchmaking

### Step 4: Frontend Hook
1. Create `frontend/src/hooks/useMatchmaking.ts`
2. Manage matchmaking state
3. Handle WebSocket events

### Step 5: Update BattleScreen
1. Replace mock with real matchmaking
2. Connect to matchmaking service
3. Handle match found → redirect to battle

### Step 6: Testing
1. Test with 2 players
2. Test skill-based matching
3. Test queue timeout
4. Test WebSocket reconnection

---

## Database Considerations

**No new tables needed!** We can use:
- Existing `GameSession` table for matches
- In-memory queue (Redis optional for production scaling)
- `PlayerStats` table for skill matching

**Optional Enhancement:**
- Add `MatchmakingQueue` table for persistence (if needed for scaling)

---

## Files to Create/Modify

### Backend (New Files)
- `backend/app/services/matchmaking.py` - Queue service
- `backend/app/routers/matchmaking.py` - API endpoints

### Backend (Modify)
- `backend/app/main.py` - Register matchmaking router

### Frontend (New Files)
- `frontend/src/services/matchmaking.ts` - Matchmaking API service
- `frontend/src/hooks/useMatchmaking.ts` - Matchmaking hook

### Frontend (Modify)
- `frontend/src/components/screens/BattleScreen.tsx` - Use real matchmaking

---

## Next Steps

1. **Start with backend matchmaking service** - Core logic
2. **Add API endpoints** - REST + WebSocket
3. **Create frontend service** - API integration
4. **Update BattleScreen** - Replace mock
5. **Test end-to-end** - Two players matching

Ready to start implementing? Let me know which part you want to tackle first!

