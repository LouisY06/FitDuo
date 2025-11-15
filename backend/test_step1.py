#!/usr/bin/env python3
"""
Test script for Step 1: Basic FastAPI App
Run this to verify the server is working correctly.
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

def test_root():
    """Test the root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✅ Root endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}")
        return False

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Step 1: Basic FastAPI App\n")
    
    root_ok = test_root()
    health_ok = test_health()
    
    if root_ok and health_ok:
        print("\n🎉 All tests passed! Step 1 is complete.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Make sure the server is running:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)

