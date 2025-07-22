"""
Test script to verify test user authentication bypass
"""
import requests

BASE_URL = "http://localhost:8000"

def test_auth_bypass():
    print("Testing authentication bypass for development...\n")
    
    # Test 1: Debug info endpoint (no auth required)
    print("1. Testing debug info endpoint:")
    try:
        response = requests.get(f"{BASE_URL}/api/debug/info")
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Debug mode: {data.get('debug_mode')}")
        print(f"   ✓ Test user enabled: {data.get('test_user_enabled')}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 2: Test auth endpoint with test token
    print("\n2. Testing auth endpoint with test-token:")
    try:
        headers = {"Authorization": "Bearer test-token"}
        response = requests.get(f"{BASE_URL}/api/debug/test-auth", headers=headers)
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Authenticated: {data.get('authenticated')}")
        print(f"   ✓ User: {data.get('user')}")
        print(f"   ✓ Message: {data.get('message')}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 3: Test auth endpoint without token (should still work in dev mode)
    print("\n3. Testing auth endpoint without token:")
    try:
        response = requests.get(f"{BASE_URL}/api/debug/test-auth")
        data = response.json()
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Authenticated: {data.get('authenticated')}")
        print(f"   ✓ User: {data.get('user')}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Create intent with test user
    print("\n4. Testing intent creation with test user:")
    try:
        headers = {"Authorization": "Bearer test-token"}
        intent_data = {
            "raw_query": "Looking for a laptop under 50k",
            "location_name": "Bangalore"
        }
        response = requests.post(f"{BASE_URL}/api/intents", json=intent_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Intent ID: {data.get('intent_id')}")
            print(f"   ✓ User ID: {data.get('user_id')}")
            print(f"   ✓ Category: {data.get('category')}")
        else:
            print(f"   ✗ Status: {response.status_code}")
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\nTest complete!")
    print("\nIf authentication is still failing:")
    print("1. Restart the backend server")
    print("2. Make sure DEBUG=true and ALLOW_TEST_USER=true in .env")
    print("3. Check backend logs for '[Security] Using test user for development'")

if __name__ == "__main__":
    test_auth_bypass()