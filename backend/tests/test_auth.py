import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

class TestAuth:
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_debug_info(self):
        """Test debug information endpoint"""
        response = client.get("/api/debug/info")
        assert response.status_code == 200
        data = response.json()
        assert "embedding_model" in data
        assert "nlp_model" in data
        assert data["embedding_dimensions"] == 384
    
    @pytest.mark.skip(reason="Requires Supabase setup")
    def test_register_user(self):
        """Test user registration"""
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123",
            "phone": "9876543210",
            "interests": ["tech", "cricket"],
            "location_name": "Whitefield",
            "location": {"lat": 12.9698, "lng": 77.7499},
            "bio": "Test user bio"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["name"] == user_data["name"]
        assert data["user"]["email"] == user_data["email"]
    
    @pytest.mark.skip(reason="Requires Supabase setup")
    def test_login_user(self):
        """Test user login"""
        # First register a user
        user_data = {
            "name": "Login Test User",
            "email": "login@example.com",
            "password": "loginpassword123"
        }
        
        register_response = client.post("/api/auth/register", json=user_data)
        assert register_response.status_code == 200
        
        # Now test login
        login_data = {
            "email": "login@example.com",
            "password": "loginpassword123"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == login_data["email"]
    
    @pytest.mark.skip(reason="Requires Supabase setup")
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]
    
    def test_register_invalid_email(self):
        """Test registration with invalid email format"""
        user_data = {
            "name": "Test User",
            "email": "invalid-email",
            "password": "testpassword123"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 422  # Validation error
    
    def test_logout(self):
        """Test logout endpoint"""
        response = client.post("/api/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

if __name__ == "__main__":
    pytest.main([__file__])