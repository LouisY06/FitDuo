from sqlmodel import Session, select
from app.models import GameSession, GameStatus, Exercise
from app.services.connection_manager import ConnectionManager
from app.services.llm_service import llm_service
from datetime import datetime


async def handle_rep_increment(
    game_id: int,
    player_id: int,
    rep_count: int,
    session: Session,
    manager: ConnectionManager,
):
    """
    Handle rep increment: update database and broadcast to opponent
    
    Args:
        game_id: ID of the game session
        player_id: ID of the player whose rep count increased
        rep_count: New rep count for the player
        session: Database session
        manager: WebSocket connection manager
    """
    game_session = session.get(GameSession, game_id)
    if not game_session:
        return

    # Update score based on player
    if game_session.player_a_id == player_id:
        game_session.player_a_score = rep_count
    elif game_session.player_b_id == player_id:
        game_session.player_b_score = rep_count
    else:
        return  # Invalid player

    # Update timestamp
    game_session.updated_at = datetime.utcnow()
    
    # Update status to active if still waiting
    if game_session.status == GameStatus.WAITING.value:
        game_session.status = GameStatus.ACTIVE.value

    session.add(game_session)
    session.commit()
    session.refresh(game_session)

    # Broadcast to opponent
    opponent_id = (
        game_session.player_b_id
        if player_id == game_session.player_a_id
        else game_session.player_a_id
    )

    await manager.broadcast_to_game(
        {
            "type": "REP_INCREMENT",
            "payload": {
                "playerId": player_id,
                "repCount": rep_count,
            },
        },
        game_id,
        exclude_player=player_id,
    )

    # Send updated game state to all players
    await broadcast_game_state(game_session, manager, game_id)


async def handle_round_end(
    game_id: int,
    session: Session,
    manager: ConnectionManager,
):
    """
    Handle round end: determine winner/loser and update game state
    
    Args:
        game_id: ID of the game session
        session: Database session
        manager: WebSocket connection manager
    """
    game_session = session.get(GameSession, game_id)
    if not game_session:
        return

    # Determine winner and loser
    if game_session.player_a_score > game_session.player_b_score:
        winner_id = game_session.player_a_id
        loser_id = game_session.player_b_id
        winner_score = game_session.player_a_score
        loser_score = game_session.player_b_score
        game_session.player_a_rounds_won += 1
    elif game_session.player_b_score > game_session.player_a_score:
        winner_id = game_session.player_b_id
        loser_id = game_session.player_a_id
        winner_score = game_session.player_b_score
        loser_score = game_session.player_a_score
        game_session.player_b_rounds_won += 1
    else:
        # Tie - both players tied
        winner_id = None
        loser_id = None
        winner_score = game_session.player_a_score
        loser_score = game_session.player_b_score

    # Check if game is over (best of 3: first to win 2 rounds)
    game_over = False
    match_winner_id = None
    if game_session.player_a_rounds_won >= 2:
        game_over = True
        match_winner_id = game_session.player_a_id
    elif game_session.player_b_rounds_won >= 2:
        game_over = True
        match_winner_id = game_session.player_b_id

    # Update game status
    if game_over:
        game_session.status = GameStatus.FINISHED.value
    else:
        game_session.status = GameStatus.ROUND_END.value
    game_session.updated_at = datetime.utcnow()
    
    session.add(game_session)
    session.commit()
    session.refresh(game_session)

    # Generate narrative using LLM
    round_result = {
        "winner": str(winner_id) if winner_id else "Tie",
        "loser": str(loser_id) if loser_id else "Tie",
        "winner_score": winner_score,
        "loser_score": loser_score,
        "round": game_session.current_round,
    }
    narrative = await llm_service.generate_narrative(round_result)

    # Get available exercises for strategy recommendation
    exercises = session.exec(select(Exercise)).all()
    available_exercises = [ex.name for ex in exercises] if exercises else ["push-ups", "pull-ups", "planks", "squats"]

    # Determine player weakness for strategy (simplified - could use battle history)
    player_b_weakness = None
    if loser_id == game_session.player_b_id and winner_score > loser_score * 1.3:
        player_b_weakness = "endurance"  # Could be determined from battle history
    
    # Generate strategy recommendation for next round
    strategy = await llm_service.recommend_strategy(
        player_a_score=game_session.player_a_score,
        player_b_score=game_session.player_b_score,
        player_b_weakness=player_b_weakness,
        available_exercises=available_exercises,
    )
    
    # Apply dynamic difficulty (handicap for dominant player)
    if game_session.player_a_score > game_session.player_b_score * 1.5:
        strategy["difficulty_modifier"] = "harder"
    elif game_session.player_b_score > game_session.player_a_score * 1.5:
        strategy["difficulty_modifier"] = "harder"

    # Broadcast round end with narrative and strategy
    await manager.broadcast_to_game(
        {
            "type": "ROUND_END",
            "payload": {
                "gameId": game_id,
                "winnerId": winner_id,
                "loserId": loser_id,
                "playerAScore": game_session.player_a_score,
                "playerBScore": game_session.player_b_score,
                "playerARoundsWon": game_session.player_a_rounds_won,
                "playerBRoundsWon": game_session.player_b_rounds_won,
                "currentRound": game_session.current_round,
                "gameOver": game_over,
                "matchWinnerId": match_winner_id,
                "narrative": narrative,
                "strategy": strategy,
            },
        },
        game_id,
    )

    # Broadcast updated game state
    await broadcast_game_state(game_session, manager, game_id)


async def start_next_round(
    game_id: int,
    exercise_id: int | None,
    session: Session,
    manager: ConnectionManager,
):
    """
    Start the next round of a game
    
    Args:
        game_id: ID of the game session
        exercise_id: ID of the exercise for this round (optional)
        session: Database session
        manager: WebSocket connection manager
    """
    game_session = session.get(GameSession, game_id)
    if not game_session:
        return

    # Increment round
    game_session.current_round += 1
    
    # Reset scores for new round
    game_session.player_a_score = 0
    game_session.player_b_score = 0
    
    # Update exercise if provided
    if exercise_id:
        game_session.current_exercise_id = exercise_id
    
    # Set status to active
    game_session.status = GameStatus.ACTIVE.value
    game_session.updated_at = datetime.utcnow()
    
    session.add(game_session)
    session.commit()
    session.refresh(game_session)

    # Broadcast round start
    await manager.broadcast_to_game(
        {
            "type": "ROUND_START",
            "payload": {
                "gameId": game_id,
                "currentRound": game_session.current_round,
                "exerciseId": game_session.current_exercise_id,
            },
        },
        game_id,
    )

    # Broadcast updated game state
    await broadcast_game_state(game_session, manager, game_id)


async def broadcast_game_state(
    game_session: GameSession,
    manager: ConnectionManager,
    game_id: int,
):
    """
    Broadcast current game state to all connected players
    
    Args:
        game_session: The game session object
        manager: WebSocket connection manager
        game_id: ID of the game session
    """
    await manager.broadcast_to_game(
        {
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
                "exerciseId": game_session.current_exercise_id,
            },
        },
        game_id,
    )

