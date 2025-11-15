"""
Test Player Database Models directly (without API)
Tests that models can be created and queried correctly
"""
import sys
from sqlmodel import Session, select
from app.database.connection import get_session, engine
from app.models import (
    User,
    PlayerStats,
    PlayerWorkout,
    PlayerPreferences,
    Exercise,
)

def test_user_creation():
    """Test creating a user with new fields"""
    print("\n=== Testing User Model ===")
    session = next(get_session())
    
    try:
        # Create a test user
        test_user = User(
            firebase_uid="test_firebase_uid_123",
            username="test_player",
            email="test@example.com",
            display_name="Test Player",
            level=1,
            experience_points=0,
            is_active=True,
            is_online=False,
        )
        session.add(test_user)
        session.commit()
        session.refresh(test_user)
        
        print(f"✅ User created: ID={test_user.id}, Level={test_user.level}, XP={test_user.experience_points}")
        return test_user
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        # Check if user already exists
        existing_user = session.exec(
            select(User).where(User.firebase_uid == "test_firebase_uid_123")
        ).first()
        if existing_user:
            print(f"✅ User already exists: ID={existing_user.id}")
            return existing_user
        return None


def test_player_stats(user):
    """Test creating and querying PlayerStats"""
    print("\n=== Testing PlayerStats Model ===")
    session = next(get_session())
    
    try:
        # Check if stats already exist
        existing_stats = session.exec(
            select(PlayerStats).where(PlayerStats.user_id == user.id)
        ).first()
        
        if existing_stats:
            print(f"✅ Stats already exist: Total Games={existing_stats.total_games}, Total Workouts={existing_stats.total_workouts}")
            return existing_stats
        
        # Create new stats
        stats = PlayerStats(
            user_id=user.id,
            total_games=0,
            games_won=0,
            games_lost=0,
            games_tied=0,
            win_rate=0.0,
            total_reps=0,
            total_workouts=0,
        )
        session.add(stats)
        session.commit()
        session.refresh(stats)
        
        print(f"✅ PlayerStats created: ID={stats.id}, User ID={stats.user_id}")
        return stats
    except Exception as e:
        print(f"❌ Error creating stats: {e}")
        return None


def test_player_workout(user):
    """Test creating a PlayerWorkout"""
    print("\n=== Testing PlayerWorkout Model ===")
    session = next(get_session())
    
    try:
        # Create a workout
        workout = PlayerWorkout(
            user_id=user.id,
            exercise_name="Push-up",
            exercise_category="push",
            reps=30,
            score=30,
            workout_type="solo",
            form_rating=0.85,
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)
        
        print(f"✅ Workout created: ID={workout.id}, Exercise={workout.exercise_name}, Reps={workout.reps}")
        
        # Update stats
        stats = session.exec(
            select(PlayerStats).where(PlayerStats.user_id == user.id)
        ).first()
        
        if stats:
            stats.total_workouts += 1
            stats.total_reps += workout.reps
            if workout.reps > stats.best_pushups:
                stats.best_pushups = workout.reps
            session.add(stats)
            session.commit()
            print(f"✅ Stats updated: Total Workouts={stats.total_workouts}, Total Reps={stats.total_reps}, Best Pushups={stats.best_pushups}")
        
        return workout
    except Exception as e:
        print(f"❌ Error creating workout: {e}")
        return None


def test_player_preferences(user):
    """Test creating and querying PlayerPreferences"""
    print("\n=== Testing PlayerPreferences Model ===")
    session = next(get_session())
    
    try:
        # Check if preferences already exist
        existing_prefs = session.exec(
            select(PlayerPreferences).where(PlayerPreferences.user_id == user.id)
        ).first()
        
        if existing_prefs:
            print(f"✅ Preferences already exist: Theme={existing_prefs.theme}, Difficulty={existing_prefs.difficulty_level}")
            # Update them
            existing_prefs.difficulty_level = "hard"
            existing_prefs.theme = "dark"
            session.add(existing_prefs)
            session.commit()
            print(f"✅ Preferences updated: Theme={existing_prefs.theme}, Difficulty={existing_prefs.difficulty_level}")
            return existing_prefs
        
        # Create new preferences
        prefs = PlayerPreferences(
            user_id=user.id,
            difficulty_level="medium",
            theme="dark",
            enable_cv_detection=True,
        )
        session.add(prefs)
        session.commit()
        session.refresh(prefs)
        
        print(f"✅ PlayerPreferences created: ID={prefs.id}, Theme={prefs.theme}, Difficulty={prefs.difficulty_level}")
        return prefs
    except Exception as e:
        print(f"❌ Error creating preferences: {e}")
        return None


def test_workout_history(user):
    """Test querying workout history"""
    print("\n=== Testing Workout History Query ===")
    session = next(get_session())
    
    try:
        workouts = session.exec(
            select(PlayerWorkout)
            .where(PlayerWorkout.user_id == user.id)
            .order_by(PlayerWorkout.completed_at.desc())
            .limit(10)
        ).all()
        
        print(f"✅ Found {len(workouts)} workouts for user {user.id}")
        for workout in workouts[:3]:  # Show first 3
            print(f"   - {workout.exercise_name}: {workout.reps} reps (Score: {workout.score})")
        return True
    except Exception as e:
        print(f"❌ Error querying workouts: {e}")
        return False


def test_stats_query(user):
    """Test querying player stats"""
    print("\n=== Testing Stats Query ===")
    session = next(get_session())
    
    try:
        stats = session.exec(
            select(PlayerStats).where(PlayerStats.user_id == user.id)
        ).first()
        
        if stats:
            win_rate = stats.games_won / stats.total_games if stats.total_games > 0 else 0.0
            print(f"✅ Stats retrieved:")
            print(f"   Total Games: {stats.total_games}")
            print(f"   Games Won: {stats.games_won}")
            print(f"   Win Rate: {win_rate:.2%}")
            print(f"   Total Workouts: {stats.total_workouts}")
            print(f"   Total Reps: {stats.total_reps}")
            print(f"   Best Pushups: {stats.best_pushups}")
            return True
        else:
            print("❌ No stats found")
            return False
    except Exception as e:
        print(f"❌ Error querying stats: {e}")
        return False


def cleanup_test_data():
    """Optional: Clean up test data"""
    print("\n=== Cleanup (Optional) ===")
    print("Test data left in database. To clean up:")
    print("  DELETE FROM playerworkout WHERE user_id IN (SELECT id FROM user WHERE firebase_uid = 'test_firebase_uid_123');")
    print("  DELETE FROM playerpreferences WHERE user_id IN (SELECT id FROM user WHERE firebase_uid = 'test_firebase_uid_123');")
    print("  DELETE FROM playerstats WHERE user_id IN (SELECT id FROM user WHERE firebase_uid = 'test_firebase_uid_123');")
    print("  DELETE FROM user WHERE firebase_uid = 'test_firebase_uid_123';")


def main():
    """Run all model tests"""
    print("=" * 60)
    print("Player Database Models Test")
    print("=" * 60)
    
    # Test user creation
    user = test_user_creation()
    if not user:
        print("\n❌ Cannot proceed without user")
        return
    
    # Test stats
    stats = test_player_stats(user)
    
    # Test preferences
    prefs = test_player_preferences(user)
    
    # Test workout
    workout = test_player_workout(user)
    
    # Test queries
    test_workout_history(user)
    test_stats_query(user)
    
    # Cleanup info
    cleanup_test_data()
    
    print("\n" + "=" * 60)
    print("✅ All model tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()

