"""
Test script to verify backend server is accessible
"""
import requests
import sys

def test_backend():
    urls_to_test = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://192.168.1.40:8000',
    ]
    
    print("Testing backend server connectivity...\n")
    
    for base_url in urls_to_test:
        print(f"Testing {base_url}...")
        
        # Test root endpoint
        try:
            response = requests.get(f"{base_url}/", timeout=5)
            print(f"  ✓ Root endpoint: {response.status_code}")
            print(f"    Response: {response.json()}")
        except Exception as e:
            print(f"  ✗ Root endpoint failed: {e}")
            continue
        
        # Test health endpoint
        try:
            response = requests.get(f"{base_url}/api/health", timeout=5)
            print(f"  ✓ Health endpoint: {response.status_code}")
            print(f"    Response: {response.json()}")
        except Exception as e:
            print(f"  ✗ Health endpoint failed: {e}")
        
        # Test debug info endpoint
        try:
            response = requests.get(f"{base_url}/api/debug/info", timeout=5)
            print(f"  ✓ Debug endpoint: {response.status_code}")
            print(f"    Response: {response.json()}")
        except Exception as e:
            print(f"  ✗ Debug endpoint failed: {e}")
        
        print()
    
    print("\nTest complete!")
    print("\nIf all tests failed, make sure the backend is running:")
    print("  cd backend")
    print("  .\\venv\\Scripts\\Activate.ps1")
    print("  python main.py")

if __name__ == "__main__":
    test_backend()