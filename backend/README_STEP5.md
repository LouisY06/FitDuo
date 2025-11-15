# Step 5: WebSocket Setup ✅

## What We Built

1. **WebSocket Router** (`app/routers/websocket.py`)
   - WebSocket endpoint: `/ws/{game_id}`
   - Connection manager for managing active connections
   - Message routing and broadcasting

2. **Connection Manager**
   - Tracks active WebSocket connections per game
   - Supports sending messages to specific players
   - Broadcasts messages to all players in a game
   - Handles connection cleanup on disconnect

3. **Message Types**
   - `GAME_STATE` - Initial game state sent on connection
   - `PING/PONG` - Keep-alive mechanism
   - `REP_INCREMENT` - Rep count updates (broadcast to opponent)
   - `ERROR` - Error messages

## How to Test

### 1. Start the server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test WebSocket Connection:

**Using Python (websockets library):**
```python
import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/1?player_id=1"
    async with websockets.connect(uri) as websocket:
        # Receive initial GAME_STATE
        message = await websocket.recv()
        data = json.loads(message)
        print(data)
        
        # Send PING
        await websocket.send(json.dumps({"type": "PING", "payload": {}}))
        pong = await websocket.recv()
        print(json.loads(pong))

asyncio.run(test())
```

**Using JavaScript (Browser Console):**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/1?player_id=1');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));

// Send PING
ws.send(JSON.stringify({type: 'PING', payload: {}}));
```

### 3. Test Message Broadcasting:

Connect two players to the same game and verify messages are broadcast:

```python
# Player A sends REP_INCREMENT
await ws_a.send(json.dumps({
    "type": "REP_INCREMENT",
    "payload": {"repCount": 5}
}))

# Player B should receive the broadcast
```

### 4. Run Automated Tests:

```bash
cd backend
source venv/bin/activate
pip install websockets  # if not already installed
python test_step5.py
```

## WebSocket Endpoint

**URL:** `ws://localhost:8000/ws/{game_id}?player_id={player_id}`

**Query Parameters:**
- `player_id` (required): ID of the player connecting

**Connection Flow:**
1. Client connects with game_id and player_id
2. Server verifies game exists and player is part of the game
3. Server sends initial `GAME_STATE` message
4. Client can send messages (PING, REP_INCREMENT, etc.)
5. Server handles messages and broadcasts to other players

## Message Protocol

### Client → Server Messages

**PING:**
```json
{
  "type": "PING",
  "payload": {}
}
```

**REP_INCREMENT:**
```json
{
  "type": "REP_INCREMENT",
  "payload": {
    "repCount": 10
  }
}
```

### Server → Client Messages

**GAME_STATE (on connection):**
```json
{
  "type": "GAME_STATE",
  "payload": {
    "gameId": 1,
    "playerA": {
      "id": 1,
      "score": 0
    },
    "playerB": {
      "id": 2,
      "score": 0
    },
    "currentRound": 1,
    "status": "waiting"
  }
}
```

**PONG (response to PING):**
```json
{
  "type": "PONG",
  "payload": {}
}
```

**REP_INCREMENT (broadcast):**
```json
{
  "type": "REP_INCREMENT",
  "payload": {
    "playerId": 1,
    "repCount": 10
  }
}
```

**ERROR:**
```json
{
  "type": "ERROR",
  "payload": "Error message"
}
```

## Error Handling

The WebSocket endpoint handles various error cases:

- **Missing player_id**: Connection closed with code 1008
- **Invalid game_id**: Connection closed if game doesn't exist
- **Player not in game**: Connection closed if player_id doesn't match game players
- **Invalid JSON**: Error message sent back to client
- **Connection errors**: Automatic cleanup on disconnect

## Connection Manager Methods

- `connect(websocket, game_id, player_id)` - Register a connection
- `disconnect(game_id, player_id)` - Remove a connection
- `send_personal_message(message, game_id, player_id)` - Send to specific player
- `broadcast_to_game(message, game_id, exclude_player)` - Broadcast to all players
- `get_connected_players(game_id)` - Get list of connected players

## Files Created

- `backend/app/routers/websocket.py` - WebSocket router and connection manager
- `backend/test_step5.py` - Test script

## Files Modified

- `backend/app/main.py` - Added WebSocket router
- `backend/requirements.txt` - Added websockets dependency (for testing)

## Next Step

Once this is working, we'll move to Step 6: Game logic service for handling rep increments and round management.

