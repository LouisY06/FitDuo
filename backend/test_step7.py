#!/usr/bin/env python3
"""
Test script for Step 7: LLM Service Integration
Run this to verify LLM service works correctly (with or without API key).
"""

import requests
import sys
import asyncio
from app.services.llm_service import llm_service

BASE_URL = "http://localhost:8000"


def test_llm_service_initialization():
    """Test that LLM service initializes correctly"""
    try:
        # Service should initialize even without API key (uses fallbacks)
        assert llm_service is not None
        print(f"✅ LLM service initialized (enabled: {llm_service.enabled})")
        return True
    except Exception as e:
        print(f"❌ LLM service initialization failed: {e}")
        return False


async def test_form_rules_fallback():
    """Test form rules generation (will use fallback if no API key)"""
    try:
        rules = await llm_service.generate_form_rules("push-up")
        assert isinstance(rules, dict)
        assert len(rules) > 0
        print(f"✅ Form rules generation test passed")
        print(f"   Rules: {list(rules.keys())}")
        return True
    except Exception as e:
        print(f"❌ Form rules generation test failed: {e}")
        return False


async def test_strategy_fallback():
    """Test strategy recommendation (will use fallback if no API key)"""
    try:
        strategy = await llm_service.recommend_strategy(
            player_a_score=10,
            player_b_score=5,
            player_b_weakness=None,
            available_exercises=["push-ups", "squats", "planks"],
        )
        assert "exercise_id" in strategy
        assert "rationale" in strategy
        print(f"✅ Strategy recommendation test passed")
        print(f"   Recommended: {strategy['exercise_id']}")
        return True
    except Exception as e:
        print(f"❌ Strategy recommendation test failed: {e}")
        return False


async def test_narrative_fallback():
    """Test narrative generation (will use fallback if no API key)"""
    try:
        round_result = {
            "winner": "Player A",
            "loser": "Player B",
            "winner_score": 15,
            "loser_score": 8,
            "round": 1,
        }
        narrative = await llm_service.generate_narrative(round_result)
        assert isinstance(narrative, str)
        assert len(narrative) > 0
        print(f"✅ Narrative generation test passed")
        print(f"   Narrative: {narrative[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Narrative generation test failed: {e}")
        return False


def test_form_rules_endpoint():
    """Test the form rules API endpoint"""
    try:
        response = requests.post(f"{BASE_URL}/api/llm/form-rules/push-up")
        assert response.status_code == 200
        data = response.json()
        assert "exercise_name" in data
        assert "form_rules" in data
        print("✅ Form rules endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Form rules endpoint test failed: {e}")
        return False


def test_strategy_endpoint():
    """Test the strategy API endpoint"""
    try:
        payload = {
            "player_a_score": 12,
            "player_b_score": 7,
            "available_exercises": ["push-ups", "squats", "planks"]
        }
        response = requests.post(f"{BASE_URL}/api/llm/strategy", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "exercise_id" in data
        assert "rationale" in data
        print("✅ Strategy endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Strategy endpoint test failed: {e}")
        return False


def test_narrative_endpoint():
    """Test the narrative API endpoint"""
    try:
        payload = {
            "winner": "Player A",
            "loser": "Player B",
            "winner_score": 15,
            "loser_score": 8,
            "round": 1
        }
        response = requests.post(f"{BASE_URL}/api/llm/narrative", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "narrative" in data
        assert len(data["narrative"]) > 0
        print("✅ Narrative endpoint test passed")
        return True
    except Exception as e:
        print(f"❌ Narrative endpoint test failed: {e}")
        return False


if __name__ == "__main__":
    print("Testing Step 7: LLM Service Integration\n")
    
    # Check if API key is configured
    if llm_service.enabled:
        print("✅ OpenRouter API key configured - will use real LLM")
    else:
        print("⚠️  OpenRouter API key not configured - will use fallbacks")
        print("   Set OPENROUTER_API_KEY in .env to enable LLM features\n")
    
    init_ok = test_llm_service_initialization()
    
    # Test async functions
    form_rules_ok = asyncio.run(test_form_rules_fallback())
    strategy_ok = asyncio.run(test_strategy_fallback())
    narrative_ok = asyncio.run(test_narrative_fallback())
    
    # Test API endpoints
    form_rules_endpoint_ok = test_form_rules_endpoint()
    strategy_endpoint_ok = test_strategy_endpoint()
    narrative_endpoint_ok = test_narrative_endpoint()
    
    if all([init_ok, form_rules_ok, strategy_ok, narrative_ok, 
            form_rules_endpoint_ok, strategy_endpoint_ok, narrative_endpoint_ok]):
        print("\n🎉 All tests passed! Step 7 is complete.")
        if not llm_service.enabled:
            print("\n💡 To enable real LLM features:")
            print("   1. Get API key from https://openrouter.ai/")
            print("   2. Add OPENROUTER_API_KEY to backend/.env")
            print("   3. Restart the server")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Make sure the server is running:")
        print("   cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)

