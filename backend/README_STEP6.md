# Step 6: Game Logic Service ✅

## What We Built

1. **Game Logic Service** (`app/services/game_logic.py`)
   - `handle_rep_increment()` - Updates database scores and broadcasts to opponent
   - `handle_round_end()` - Determines winner/loser and updates game status
   - `start_next_round()` - Starts a new round with score reset
   - `broadcast_game_state()` - Broadcasts current game state to all players

2. **Connection Manager** (`app/services/connection_manager.py`)
   - Moved to separate module to avoid circular imports
   - Manages WebSocket connections per game
   - Handles message broadcasting

3. **Integration**
   - WebSocket router integrated with game logic
   - Database updates on rep increments
   - Real-time score synchronization

## How to Test

### 1. Start the server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Rep Increment:

**Using WebSocket:**
```python
import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/1?player_id=1"
    async with websockets.connect(uri) as ws:
        # Receive initial GAME_STATE
        await ws.recv()
        
        # Send REP_INCREMENT
        await ws.send(json.dumps({
            "type": "REP_INCREMENT",
            "payload": {"repCount": 10}
        }))
        
        # Should receive updated GAME_STATE
        response = await ws.recv()
        print(json.loads(response))

asyncio.run(test())
```

### 3. Test Round End:

```python
# Send ROUND_END message
await ws.send(json.dumps({
    "type": "ROUND_END",
    "payload": {}
}))

# Should receive ROUND_END with winner/loser
response = await ws.recv()
data = json.loads(response)
print(f"Winner: {data['payload']['winnerId']}")
print(f"Loser: {data['payload']['loserId']}")
```

### 4. Run Automated Tests:

```bash
cd backend
source venv/bin/activate
python test_step6.py
```

## Game Logic Functions

### handle_rep_increment()

Updates player score in database and broadcasts to opponent.

**Parameters:**
- `game_id`: ID of the game session
- `player_id`: ID of the player whose rep count increased
- `rep_count`: New rep count
- `session`: Database session
- `manager`: WebSocket connection manager

**Actions:**
1. Updates player score in database
2. Updates game status to "active" if still "waiting"
3. Broadcasts REP_INCREMENT to opponent
4. Broadcasts updated GAME_STATE to all players

### handle_round_end()

Determines winner/loser and updates game status.

**Parameters:**
- `game_id`: ID of the game session
- `session`: Database session
- `manager`: WebSocket connection manager

**Actions:**
1. Compares player scores
2. Determines winner and loser (or tie)
3. Updates game status to "round_end"
4. Broadcasts ROUND_END message with results
5. Broadcasts updated GAME_STATE

### start_next_round()

Starts a new round of the game.

**Parameters:**
- `game_id`: ID of the game session
- `exercise_id`: ID of exercise for this round (optional)
- `session`: Database session
- `manager`: WebSocket connection manager

**Actions:**
1. Increments round number
2. Resets player scores to 0
3. Updates exercise if provided
4. Sets status to "active"
5. Broadcasts ROUND_START message
6. Broadcasts updated GAME_STATE

## Message Flow

### Rep Increment Flow:
1. Frontend CV detects rep → sends `REP_INCREMENT` via WebSocket
2. Backend receives message → calls `handle_rep_increment()`
3. Database updated with new score
4. `REP_INCREMENT` broadcast to opponent
5. `GAME_STATE` broadcast to all players

### Round End Flow:
1. Player/System sends `ROUND_END` message
2. Backend calls `handle_round_end()`
3. Winner/loser determined
4. Game status updated to "round_end"
5. `ROUND_END` message broadcast with results
6. `GAME_STATE` broadcast to all players

## Database Updates

The game logic service ensures:
- Scores are persisted to database
- Game status is updated correctly
- Timestamps are maintained (`updated_at`)
- Game state transitions are tracked

## Files Created

- `backend/app/services/game_logic.py` - Game logic functions
- `backend/app/services/connection_manager.py` - Connection manager (moved from websocket.py)
- `backend/test_step6.py` - Test script

## Files Modified

- `backend/app/routers/websocket.py` - Integrated game logic handlers

## Next Step

Once this is working, we'll move to Step 7: LLM Service integration with OpenRouter for form rules, strategy, and narrative generation.

