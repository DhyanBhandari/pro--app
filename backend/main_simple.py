from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[FastAPI] Starting {settings.APP_NAME}...")
    # Skip database initialization for simple testing
    print(f"[FastAPI] Server ready at http://localhost:8000")
    yield
    # Shutdown
    print("[FastAPI] Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Universal Connection Platform - Phase 2 Backend (Simple Test Mode)",
    lifespan=lifespan
)

# CORS configuration for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Universal Connection Platform API",
        "version": "1.0.0",
        "phase": "Phase 2 - FastAPI Backend",
        "status": "running",
        "mode": "simple_test"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-01-21T00:00:00Z",
        "services": {
            "server": "running",
            "nlp": "loaded",
            "embeddings": "loaded"
        }
    }

@app.get("/api/debug/info")
async def debug_info():
    """Debug information endpoint"""
    from app.services.nlp_service import nlp_service
    from app.services.embedding_service import embedding_service
    
    return {
        "nlp_model": "rule-based" if not nlp_service.nlp else "spacy",
        "embedding_model": "fallback" if not embedding_service.model else "sentence-transformers",
        "embedding_dimensions": 384,
        "supported_categories": ["product", "service", "social", "travel", "general"],
        "supported_intents": ["demand", "supply"],
        "mode": "simple_test"
    }

@app.post("/api/test/nlp")
async def test_nlp(query: dict):
    """Test NLP parsing"""
    from app.services.nlp_service import nlp_service
    
    text = query.get("text", "")
    if not text:
        return {"error": "No text provided"}
    
    result = nlp_service.parse_query(text)
    return {
        "input": text,
        "parsed": result,
        "status": "success"
    }

@app.post("/api/test/embedding")
async def test_embedding(query: dict):
    """Test embedding generation"""
    from app.services.embedding_service import embedding_service
    
    text = query.get("text", "")
    if not text:
        return {"error": "No text provided"}
    
    embedding = embedding_service.generate_embedding(text)
    return {
        "input": text,
        "embedding_length": len(embedding),
        "embedding_sample": embedding[:5],  # Show first 5 dimensions
        "status": "success"
    }

@app.post("/api/test/similarity")
async def test_similarity(query: dict):
    """Test similarity computation"""
    from app.services.embedding_service import embedding_service
    
    text1 = query.get("text1", "")
    text2 = query.get("text2", "")
    
    if not text1 or not text2:
        return {"error": "Both text1 and text2 must be provided"}
    
    embedding1 = embedding_service.generate_embedding(text1)
    embedding2 = embedding_service.generate_embedding(text2)
    similarity = embedding_service.compute_similarity(embedding1, embedding2)
    
    return {
        "text1": text1,
        "text2": text2,
        "similarity": similarity,
        "status": "success"
    }

@app.post("/api/test/auth/login")
async def test_login(credentials: dict):
    """Test authentication (mock)"""
    email = credentials.get("email", "")
    password = credentials.get("password", "")
    
    if not email or not password:
        return {"error": "Email and password required", "status": "error"}
    
    # Mock authentication - accept test@example.com with Test123!
    if email == "test@example.com" and password == "Test123!":
        return {
            "access_token": "mock_token_12345",
            "token_type": "bearer",
            "user": {
                "id": "test_user_1",
                "email": email,
                "name": "Test User"
            },
            "status": "success"
        }
    
    return {"error": "Invalid credentials", "status": "error"}

@app.post("/api/test/auth/register")
async def test_register(user_data: dict):
    """Test registration (mock)"""
    required_fields = ["name", "email", "password"]
    
    for field in required_fields:
        if not user_data.get(field):
            return {"error": f"{field} is required", "status": "error"}
    
    return {
        "access_token": "mock_token_67890",
        "token_type": "bearer",
        "user": {
            "id": "new_user_1",
            "email": user_data["email"],
            "name": user_data["name"]
        },
        "status": "success"
    }

@app.post("/api/intents")
async def create_intent(request: dict):
    """Create intent without authentication (test mode)"""
    from app.services.nlp_service import nlp_service
    from app.services.embedding_service import embedding_service
    import uuid
    from datetime import datetime, timedelta
    
    raw_query = request.get("raw_query", "")
    if not raw_query:
        return {"error": "raw_query is required", "status": "error"}
    
    try:
        # Parse query with NLP
        parsed_data = nlp_service.parse_query(raw_query)
        
        # Generate embedding
        embedding = embedding_service.generate_embedding(raw_query)
        
        # Create mock intent response
        intent_id = str(uuid.uuid4())
        
        return {
            "intent_id": intent_id,
            "user_id": "test_user",
            "post_type": parsed_data["intent"],
            "category": parsed_data["category"],
            "raw_query": raw_query,
            "parsed_data": parsed_data,
            "location_name": request.get("location_name"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "valid_until": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

@app.get("/api/intents/{intent_id}/matches")
async def get_matches(intent_id: str):
    """Get mock matches for testing"""
    from app.services.ml_matching_service import ml_matching_service
    
    # Mock matches for testing
    mock_matches = [
        {
            "intent_id": "mock1",
            "user_name": "John Doe",
            "location_name": "Bangalore",
            "raw_query": "Selling iPhone 13 in good condition",
            "category": "product",
            "post_type": "supply",
            "similarity": 0.95,
            "distance_km": 2.5,
            "combined_score": 0.92,
            "created_at": "2025-01-21T10:00:00Z"
        },
        {
            "intent_id": "mock2",
            "user_name": "Jane Smith",
            "location_name": "Bangalore",
            "raw_query": "iPhone 13 available for 45k negotiable",
            "category": "product", 
            "post_type": "supply",
            "similarity": 0.89,
            "distance_km": 1.2,
            "combined_score": 0.88,
            "created_at": "2025-01-21T09:30:00Z"
        }
    ]
    
    return mock_matches

@app.post("/api/test/ml-matching")
async def test_ml_matching(request: dict):
    """Test advanced ML-based matching"""
    from app.services.ml_matching_service import ml_matching_service
    from app.services.nlp_service import nlp_service
    from app.services.embedding_service import embedding_service
    
    query = request.get("query", "")
    if not query:
        return {"error": "Query is required", "status": "error"}
    
    # Create mock intent data for testing
    parsed_data = nlp_service.parse_query(query)
    embedding = embedding_service.generate_embedding(query)
    
    intent_data = {
        'raw_query': query,
        'post_type': parsed_data['intent'],
        'category': parsed_data['category'],
        'parsed_data': {
            **parsed_data,
            'embedding': embedding
        },
        'location_name': 'Bangalore',
        'created_at': '2025-01-21T00:00:00Z'
    }
    
    try:
        matches = await ml_matching_service.find_advanced_matches(intent_data)
        
        return {
            "query": query,
            "parsed_intent": parsed_data,
            "matches_found": len(matches),
            "matches": matches[:5],  # Return top 5 for testing
            "status": "success"
        }
    except Exception as e:
        return {
            "query": query,
            "error": str(e),
            "status": "error"
        }

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )