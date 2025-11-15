"""
Test script for Player Database endpoints
Tests player stats, workout history, and preferences
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test user token (you'll need to replace this with a real Firebase token)
# For testing, you can use the /api/auth/sync endpoint first to create a user
TEST_TOKEN = None


def test_player_stats(token):
    """Test GET /api/player/stats"""
    print("\n=== Testing Player Stats ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/player/stats", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats retrieved successfully!")
            print(f"   Total Games: {data.get('total_games')}")
            print(f"   Games Won: {data.get('games_won')}")
            print(f"   Win Rate: {data.get('win_rate')}")
            print(f"   Total Workouts: {data.get('total_workouts')}")
            print(f"   Level: {data.get('level')}")
            print(f"   XP: {data.get('experience_points')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_create_workout(token):
    """Test POST /api/player/workouts"""
    print("\n=== Testing Create Workout ===")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    workout_data = {
        "exercise_name": "Push-up",
        "exercise_category": "push",
        "reps": 30,
        "score": 30,
        "workout_type": "solo",
        "form_rating": 0.85
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/player/workouts",
            headers=headers,
            json=workout_data
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workout created successfully!")
            print(f"   Workout ID: {data.get('workout_id')}")
            return data.get('workout_id')
        else:
            print(f"❌ Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def test_workout_history(token):
    """Test GET /api/player/workouts"""
    print("\n=== Testing Workout History ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/player/workouts?limit=10",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workout history retrieved successfully!")
            print(f"   Found {len(data)} workouts")
            if data:
                print(f"   Latest workout: {data[0].get('exercise_name')} - {data[0].get('reps')} reps")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_player_preferences(token):
    """Test GET /api/player/preferences"""
    print("\n=== Testing Player Preferences ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/player/preferences", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Preferences retrieved successfully!")
            print(f"   Difficulty Level: {data.get('difficulty_level')}")
            print(f"   Theme: {data.get('theme')}")
            print(f"   CV Detection: {data.get('enable_cv_detection')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_update_preferences(token):
    """Test PUT /api/player/preferences"""
    print("\n=== Testing Update Preferences ===")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    update_data = {
        "difficulty_level": "hard",
        "theme": "dark",
        "enable_cv_detection": True
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/player/preferences",
            headers=headers,
            json=update_data
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Preferences updated successfully!")
            print(f"   New Difficulty: {data.get('difficulty_level')}")
            print(f"   New Theme: {data.get('theme')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_health():
    """Test if backend is running"""
    print("\n=== Testing Backend Health ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure the backend is running: uvicorn app.main:app --reload")
        return False


def main():
    """Run all tests"""
    print("=" * 50)
    print("Player Database API Tests")
    print("=" * 50)
    
    # Test backend health
    if not test_health():
        print("\n❌ Backend is not running. Please start it first:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        return
    
    # Check if we have a token
    print("\n" + "=" * 50)
    print("NOTE: These tests require a valid Firebase authentication token.")
    print("To get a token:")
    print("1. Sign in through the frontend")
    print("2. Get the token from localStorage.getItem('auth_token')")
    print("3. Set TEST_TOKEN in this script or pass as argument")
    print("=" * 50)
    
    # For now, test without auth to see error messages
    print("\n\nTesting endpoints without authentication (should return 401):")
    test_player_stats("invalid_token")
    
    print("\n" + "=" * 50)
    print("To test with authentication:")
    print("1. Get a Firebase token from the frontend")
    print("2. Run: python test_player_database.py <your_token>")
    print("=" * 50)
    
    # If token provided as argument, run full tests
    import sys
    if len(sys.argv) > 1:
        token = sys.argv[1]
        print(f"\n\nRunning full tests with provided token...")
        test_player_stats(token)
        workout_id = test_create_workout(token)
        if workout_id:
            test_workout_history(token)
            test_player_preferences(token)
            test_update_preferences(token)
            # Check stats again to see if they updated
            print("\n=== Checking Updated Stats ===")
            test_player_stats(token)


if __name__ == "__main__":
    main()

