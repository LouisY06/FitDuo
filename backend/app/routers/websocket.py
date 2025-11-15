from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models import GameSession, Exercise
from app.services.game_logic import handle_rep_increment, handle_round_end, start_next_round
from app.services.connection_manager import ConnectionManager
from app.services.llm_service import llm_service
import json

router = APIRouter()


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: int):
    """
    WebSocket endpoint for real-time game communication
    
    Query parameters:
    - player_id: ID of the player connecting (required)
    """
    player_id = None
    try:
        # Get player_id from query params
        query_params = websocket.query_params
        player_id_str = query_params.get("player_id")
        
        if not player_id_str:
            await websocket.close(code=1008, reason="player_id required in query params")
            return
        
        try:
            player_id = int(player_id_str)
        except ValueError:
            await websocket.close(code=1008, reason="player_id must be an integer")
            return

        # Verify game exists
        session = next(get_session())
        game_session = session.get(GameSession, game_id)
        if not game_session:
            await websocket.close(code=1008, reason="Game not found")
            return

        # Verify player is part of this game
        if player_id not in [game_session.player_a_id, game_session.player_b_id]:
            await websocket.close(code=1008, reason="Player not part of this game")
            return

        # Connect
        await manager.connect(websocket, game_id, player_id)

        # Send initial game state
        await websocket.send_json({
            "type": "GAME_STATE",
            "payload": {
                "gameId": game_id,
                "playerA": {
                    "id": game_session.player_a_id,
                    "score": game_session.player_a_score,
                },
                "playerB": {
                    "id": game_session.player_b_id,
                    "score": game_session.player_b_score,
                },
                "currentRound": game_session.current_round,
                "status": game_session.status,
            },
        })

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await handle_websocket_message(message, game_id, player_id, session)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "ERROR", "payload": "Invalid JSON"})
            except Exception as e:
                print(f"Error handling message: {e}")
                await websocket.send_json({"type": "ERROR", "payload": str(e)})

    except WebSocketDisconnect:
        if player_id:
            manager.disconnect(game_id, player_id)
            print(f"Player {player_id} disconnected from game {game_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if player_id:
            manager.disconnect(game_id, player_id)


async def handle_websocket_message(message: dict, game_id: int, player_id: int, session: Session):
    """Handle incoming WebSocket messages"""
    message_type = message.get("type")
    payload = message.get("payload", {})

    if message_type == "PING":
        # Respond to ping with pong
        await manager.send_personal_message(
            {"type": "PONG", "payload": {}},
            game_id,
            player_id,
        )
    elif message_type == "REP_INCREMENT":
        # Handle rep increment with game logic
        rep_count = payload.get("repCount", 0)
        await handle_rep_increment(
            game_id=game_id,
            player_id=player_id,
            rep_count=rep_count,
            session=session,
            manager=manager,
        )
    elif message_type == "ROUND_END":
        # Handle round end
        await handle_round_end(
            game_id=game_id,
            session=session,
            manager=manager,
        )
    elif message_type == "ROUND_START":
        # Handle round start
        exercise_id = payload.get("exerciseId")
        await start_next_round(
            game_id=game_id,
            exercise_id=exercise_id,
            session=session,
            manager=manager,
        )
    elif message_type == "EXERCISE_SELECTED":
        # Handle exercise selection and send form rules
        exercise_id = payload.get("exerciseId")
        if exercise_id:
            exercise = session.get(Exercise, exercise_id)
            if exercise:
                form_rules = await llm_service.generate_form_rules(exercise.name)
                # Send form rules to all players in the game
                await manager.broadcast_to_game(
                    {
                        "type": "FORM_RULES",
                        "payload": {
                            "exercise_id": exercise_id,
                            "exercise_name": exercise.name,
                            "form_rules": form_rules,
                        },
                    },
                    game_id,
                )
    else:
        # Echo back unknown message types for testing
        await manager.send_personal_message(
            {
                "type": "ECHO",
                "payload": {"original": message},
            },
            game_id,
            player_id,
        )

