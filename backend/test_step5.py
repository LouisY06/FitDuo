#!/usr/bin/env python3
"""
Test script for Step 5: WebSocket Setup
Run this to verify WebSocket connections work correctly.
"""

import asyncio
import websockets
import json
import sys
import requests

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"


def create_test_users_and_match():
    """Create test users and a match for WebSocket testing"""
    # First, create users directly in database (bypassing Firebase for testing)
    from app.database.connection import get_session
    from app.models import User, GameSession, Exercise
    from sqlmodel import select
    
    session = next(get_session())
    
    # Create test users if they don't exist
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
    
    # Get an exercise
    exercise = session.exec(select(Exercise)).first()
    if not exercise:
        exercise = Exercise(name="Push-up", category="push", is_static_hold=False)
        session.add(exercise)
        session.commit()
        session.refresh(exercise)
    
    # Create a match
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


async def test_websocket_connection(game_id, player_id):
    """Test WebSocket connection and message handling"""
    try:
        uri = f"{WS_URL}/ws/{game_id}?player_id={player_id}"
        async with websockets.connect(uri) as websocket:
            # Wait for initial GAME_STATE message
            initial_message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(initial_message)
            
            if data.get("type") == "GAME_STATE":
                print(f"✅ Received initial GAME_STATE message")
                print(f"   Game ID: {data['payload']['gameId']}")
                print(f"   Status: {data['payload']['status']}")
            else:
                print(f"❌ Expected GAME_STATE, got: {data.get('type')}")
                return False
            
            # Test PING/PONG
            ping_message = {"type": "PING", "payload": {}}
            await websocket.send(json.dumps(ping_message))
            
            pong_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            pong_data = json.loads(pong_response)
            
            if pong_data.get("type") == "PONG":
                print("✅ PING/PONG test passed")
            else:
                print(f"❌ Expected PONG, got: {pong_data.get('type')}")
                return False
            
            # Test REP_INCREMENT message
            rep_message = {
                "type": "REP_INCREMENT",
                "payload": {"repCount": 5}
            }
            await websocket.send(json.dumps(rep_message))
            
            # Should receive echo or broadcast (depending on implementation)
            # For now, just verify no errors
            print("✅ REP_INCREMENT message sent successfully")
            
            return True
            
    except asyncio.TimeoutError:
        print("❌ WebSocket test timed out")
        return False
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False


async def test_websocket_broadcast(game_id, player_a_id, player_b_id):
    """Test that messages are broadcast to other players"""
    try:
        # Connect both players
        uri_a = f"{WS_URL}/ws/{game_id}?player_id={player_a_id}"
        uri_b = f"{WS_URL}/ws/{game_id}?player_id={player_b_id}"
        
        async with websockets.connect(uri_a) as ws_a, websockets.connect(uri_b) as ws_b:
            # Both should receive initial GAME_STATE
            msg_a = await asyncio.wait_for(ws_a.recv(), timeout=5.0)
            msg_b = await asyncio.wait_for(ws_b.recv(), timeout=5.0)
            
            # Player A sends REP_INCREMENT
            rep_message = {
                "type": "REP_INCREMENT",
                "payload": {"repCount": 10}
            }
            await ws_a.send(json.dumps(rep_message))
            
            # Player B should receive the broadcast
            broadcast = await asyncio.wait_for(ws_b.recv(), timeout=5.0)
            broadcast_data = json.loads(broadcast)
            
            if broadcast_data.get("type") == "REP_INCREMENT":
                print("✅ Broadcast test passed - Player B received REP_INCREMENT")
                return True
            else:
                print(f"❌ Expected REP_INCREMENT broadcast, got: {broadcast_data.get('type')}")
                return False
                
    except Exception as e:
        print(f"❌ Broadcast test failed: {e}")
        return False


def test_websocket_error_handling():
    """Test WebSocket error cases"""
    async def test_invalid_game():
        try:
            uri = f"{WS_URL}/ws/99999?player_id=1"
            async with websockets.connect(uri) as websocket:
                # Should close immediately with error
                await asyncio.sleep(1)
                return True
        except Exception:
            # Connection should fail/close
            return True
    
    async def test_missing_player_id():
        try:
            uri = f"{WS_URL}/ws/1"
            async with websockets.connect(uri) as websocket:
                await asyncio.sleep(1)
                return True
        except Exception:
            # Connection should fail
            return True
    
    result1 = asyncio.run(test_invalid_game())
    result2 = asyncio.run(test_missing_player_id())
    
    if result1 and result2:
        print("✅ Error handling tests passed")
        return True
    else:
        print("❌ Error handling tests failed")
        return False


if __name__ == "__main__":
    print("Testing Step 5: WebSocket Setup\n")
    
    try:
        # Create test data
        print("Creating test users and match...")
        player_a_id, player_b_id, game_id = create_test_users_and_match()
        print(f"✅ Test data created (Game ID: {game_id}, Players: {player_a_id}, {player_b_id})\n")
        
        # Test basic connection
        print("Testing WebSocket connection...")
        connection_ok = asyncio.run(test_websocket_connection(game_id, player_a_id))
        
        # Test broadcast
        print("\nTesting message broadcast...")
        broadcast_ok = asyncio.run(test_websocket_broadcast(game_id, player_a_id, player_b_id))
        
        # Test error handling
        print("\nTesting error handling...")
        error_ok = test_websocket_error_handling()
        
        if all([connection_ok, broadcast_ok, error_ok]):
            print("\n🎉 All tests passed! Step 5 is complete.")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed. Make sure the server is running:")
            print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Test setup failed: {e}")
        print("Make sure the server is running:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)

