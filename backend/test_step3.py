#!/usr/bin/env python3
"""
Test script for Step 3: Database Setup and Models
Run this to verify database connection and models work correctly.
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

def test_database_endpoint():
    """Test the database test endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/db/test")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert data["database_connected"] == True
        assert data["tables_created"] == True
        assert "counts" in data
        
        print("✅ Database connection test passed")
        print(f"   Users: {data['counts']['users']}")
        print(f"   Exercises: {data['counts']['exercises']}")
        print(f"   Game Sessions: {data['counts']['game_sessions']}")
        
        if data.get("test_exercise_created"):
            print(f"   Test exercise created with ID: {data.get('test_exercise_id')}")
        
        return True
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "error":
                print(f"   Error: {data.get('error')}")
        return False

def test_health_still_works():
    """Test that health endpoint still works"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health endpoint still works")
        return True
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

def test_root_still_works():
    """Test that root endpoint still works"""
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        print("✅ Root endpoint still works")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Step 3: Database Setup and Models\n")
    
    health_ok = test_health_still_works()
    root_ok = test_root_still_works()
    db_ok = test_database_endpoint()
    
    if all([health_ok, root_ok, db_ok]):
        print("\n🎉 All tests passed! Step 3 is complete.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Make sure the server is running:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)

