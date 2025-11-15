#!/usr/bin/env python3
"""
Test script for Step 2: CORS and Configuration Management
Run this to verify CORS headers and configuration are working correctly.
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

def test_root_with_config():
    """Test the root endpoint includes configuration info"""
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "environment" in data
        print("✅ Root endpoint with config test passed")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}")
        return False

def test_cors_headers():
    """Test that CORS headers are present"""
    try:
        # Simulate a cross-origin request
        response = requests.options(
            f"{BASE_URL}/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Check for CORS headers (case-insensitive)
        response_headers_lower = {k.lower(): v for k, v in response.headers.items()}
        
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods",
        ]
        
        headers_present = all(
            header in response_headers_lower for header in cors_headers
        )
        
        if headers_present:
            print("✅ CORS headers test passed")
            print(f"   Allowed Origin: {response_headers_lower.get('access-control-allow-origin', 'N/A')}")
            print(f"   Allowed Methods: {response_headers_lower.get('access-control-allow-methods', 'N/A')}")
            return True
        else:
            print("❌ CORS headers test failed - missing headers")
            print(f"   Response headers: {list(response.headers.keys())}")
            return False
    except Exception as e:
        print(f"❌ CORS headers test failed: {e}")
        return False

def test_config_endpoint():
    """Test the config endpoint (development only)"""
    try:
        response = requests.get(f"{BASE_URL}/config")
        assert response.status_code == 200
        data = response.json()
        assert "environment" in data
        assert "cors_origins" in data
        print("✅ Config endpoint test passed")
        print(f"   Environment: {data.get('environment')}")
        print(f"   CORS Origins: {data.get('cors_origins')}")
        return True
    except Exception as e:
        print(f"❌ Config endpoint test failed: {e}")
        return False

def test_health():
    """Test the health endpoint still works"""
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
    print("Testing Step 2: CORS and Configuration Management\n")
    
    root_ok = test_root_with_config()
    cors_ok = test_cors_headers()
    config_ok = test_config_endpoint()
    health_ok = test_health()
    
    if all([root_ok, cors_ok, config_ok, health_ok]):
        print("\n🎉 All tests passed! Step 2 is complete.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Make sure the server is running:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)

