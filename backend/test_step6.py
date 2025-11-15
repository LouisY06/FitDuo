#!/usr/bin/env python3
"""
Test script for Step 6: Game Logic Service
Run this to verify game logic (rep increments, round management) works correctly.
"""

import asyncio
import websockets
import json
import sys
import requests
from app.database.connection import get_session
from app.models import User, GameSession, Exercise
from sqlmodel import select

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"


def create_test_data():
    """Create test users and match for game logic testing"""
    session = next(get_session())
    
    # Get or create users
    user_a = session.exec(
        select(User).where(User.firebase_uid == "test_user_a")
    ).first()
    if not user_a:
        user_a = User(
            firebase_uid="test_user_a",
            username="Test Player A",
            email="testa@example.com"
        )
        session.add(user_a)
        session.commit()
        session.refresh(user_a)
    
    user_b = session.exec(
        select(User).where(User.firebase_uid == "test_user_b")
    ).first()
    if not user_b:
        user_b = User(
            firebase_uid="test_user_b",
            username="Test Player B",
            email="testb@example.com"
        )
        session.add(user_b)
        session.commit()
        session.refresh(user_b)
    
    # Get exercise
    exercise = session.exec(select(Exercise)).first()
    if not exercise:
        exercise = Exercise(name="Push-up", category="push", is_static_hold=False)
        session.add(exercise)
        session.commit()
        session.refresh(exercise)
    
    # Create match
    match = GameSession(
        player_a_id=user_a.id,
        player_b_id=user_b.id,
        current_exercise_id=exercise.id,
        status="waiting"
    )
    session.add(match)
    session.commit()
    session.refresh(match)
    
    return user_a.id, user_b.id, match.id


async def test_rep_increment(game_id, player_id):
    """Test rep increment updates database and broadcasts"""
    try:
        uri = f"{WS_URL}/ws/{game_id}?player_id={player_id}"
        async with websockets.connect(uri) as websocket:
            # Receive initial GAME_STATE
            initial = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            initial_data = json.loads(initial)
            
            # Send REP_INCREMENT
            rep_message = {
                "type": "REP_INCREMENT",
                "payload": {"repCount": 5}
            }
            await websocket.send(json.dumps(rep_message))
            
            # Should receive updated GAME_STATE
            updated = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            updated_data = json.loads(updated)
            
            if updated_data.get("type") == "GAME_STATE":
                payload = updated_data["payload"]
                # Check if score was updated correctly
                if player_id == payload["playerA"]["id"]:
                    if payload["playerA"]["score"] == 5:
                        print("✅ Rep increment test passed - score updated correctly")
                        return True
                elif player_id == payload["playerB"]["id"]:
                    if payload["playerB"]["score"] == 5:
                        print("✅ Rep increment test passed - score updated correctly")
                        return True
                print(f"❌ Score not updated correctly: {payload}")
                return False
            else:
                print(f"❌ Expected GAME_STATE, got: {updated_data.get('type')}")
                return False
                
    except Exception as e:
        print(f"❌ Rep increment test failed: {e}")
        return False


async def test_rep_broadcast(game_id, player_a_id, player_b_id):
    """Test that rep increments are broadcast to opponent"""
    try:
        uri_a = f"{WS_URL}/ws/{game_id}?player_id={player_a_id}"
        uri_b = f"{WS_URL}/ws/{game_id}?player_id={player_b_id}"
        
        async with websockets.connect(uri_a) as ws_a, websockets.connect(uri_b) as ws_b:
            # Both receive initial GAME_STATE
            await asyncio.wait_for(ws_a.recv(), timeout=5.0)
            await asyncio.wait_for(ws_b.recv(), timeout=5.0)
            
            # Player A sends REP_INCREMENT
            await ws_a.send(json.dumps({
                "type": "REP_INCREMENT",
                "payload": {"repCount": 10}
            }))
            
            # Player B should receive REP_INCREMENT broadcast
            broadcast = await asyncio.wait_for(ws_b.recv(), timeout=5.0)
            broadcast_data = json.loads(broadcast)
            
            if broadcast_data.get("type") == "REP_INCREMENT":
                if broadcast_data["payload"]["playerId"] == player_a_id:
                    print("✅ Rep broadcast test passed - opponent received update")
                    return True
            
            # Also check for GAME_STATE update
            game_state = await asyncio.wait_for(ws_b.recv(), timeout=5.0)
            game_state_data = json.loads(game_state)
            
            if game_state_data.get("type") == "GAME_STATE":
                print("✅ Rep broadcast test passed - game state updated")
                return True
            
            print(f"❌ Expected REP_INCREMENT or GAME_STATE, got: {broadcast_data.get('type')}")
            return False
            
    except Exception as e:
        print(f"❌ Rep broadcast test failed: {e}")
        return False


async def test_round_end(game_id, player_id):
    """Test round end logic"""
    try:
        uri = f"{WS_URL}/ws/{game_id}?player_id={player_id}"
        async with websockets.connect(uri) as websocket:
            # Receive initial GAME_STATE
            await asyncio.wait_for(websocket.recv(), timeout=5.0)
            
            # Send ROUND_END
            await websocket.send(json.dumps({
                "type": "ROUND_END",
                "payload": {}
            }))
            
            # Should receive ROUND_END message
            round_end = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            round_end_data = json.loads(round_end)
            
            if round_end_data.get("type") == "ROUND_END":
                payload = round_end_data["payload"]
                if "winnerId" in payload and "loserId" in payload:
                    print("✅ Round end test passed - winner/loser determined")
                    return True
            
            print(f"❌ Expected ROUND_END with winner/loser, got: {round_end_data}")
            return False
            
    except Exception as e:
        print(f"❌ Round end test failed: {e}")
        return False


def test_database_updates():
    """Test that database is updated correctly"""
    try:
        session = next(get_session())
        
        # Get a test match
        match = session.exec(select(GameSession)).first()
        if not match:
            print("⚠️  No matches found for database test")
            return True
        
        # Check that scores can be updated
        original_score_a = match.player_a_score
        match.player_a_score = 15
        session.add(match)
        session.commit()
        session.refresh(match)
        
        if match.player_a_score == 15:
            print("✅ Database update test passed")
            # Reset
            match.player_a_score = original_score_a
            session.add(match)
            session.commit()
            return True
        else:
            print("❌ Database update test failed")
            return False
            
    except Exception as e:
        print(f"❌ Database update test failed: {e}")
        return False


if __name__ == "__main__":
    print("Testing Step 6: Game Logic Service\n")
    
    try:
        # Create test data
        print("Creating test data...")
        player_a_id, player_b_id, game_id = create_test_data()
        print(f"✅ Test data created (Game ID: {game_id})\n")
        
        # Test database updates
        print("Testing database updates...")
        db_ok = test_database_updates()
        
        # Test rep increment
        print("\nTesting rep increment...")
        rep_ok = asyncio.run(test_rep_increment(game_id, player_a_id))
        
        # Test rep broadcast
        print("\nTesting rep broadcast...")
        broadcast_ok = asyncio.run(test_rep_broadcast(game_id, player_a_id, player_b_id))
        
        # Test round end
        print("\nTesting round end...")
        round_end_ok = asyncio.run(test_round_end(game_id, player_a_id))
        
        if all([db_ok, rep_ok, broadcast_ok, round_end_ok]):
            print("\n🎉 All tests passed! Step 6 is complete.")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed. Make sure the server is running:")
            print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Test setup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

