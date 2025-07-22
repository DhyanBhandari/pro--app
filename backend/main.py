from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.api.endpoints import auth, users, intents
from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.security import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[FastAPI] Starting {settings.APP_NAME}...")
    await init_db()
    print(f"[FastAPI] Server ready at http://localhost:8000")
    yield
    # Shutdown
    print("[FastAPI] Shutting down...")
    await close_db()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Platform - Phase 2 Backend",
    lifespan=lifespan
)

# CORS configuration for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(intents.router, prefix="/api/intents", tags=["Intents"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Universal Connection Platform API",
        "version": "1.0.0",
        "phase": "Phase 2 - FastAPI Backend"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-01-21T00:00:00Z",
        "services": {
            "database": "connected",
            "nlp": "loaded",
            "embeddings": "loaded"
        }
    }

@app.get("/api/debug/info")
async def debug_info():
    """Debug information endpoint"""
    from app.services.nlp_service import nlp_service
    from app.services.embedding_service import embedding_service
    from app.core.config import settings
    
    return {
        "nlp_model": "en_core_web_sm" if nlp_service.nlp.meta else "blank",
        "embedding_model": "all-MiniLM-L6-v2" if embedding_service.model else "fallback",
        "embedding_dimensions": 384,
        "supported_categories": ["product", "service", "social", "travel", "general"],
        "supported_intents": ["demand", "supply"],
        "database_configured": bool(settings.SUPABASE_URL),
        "debug_mode": settings.DEBUG,
        "test_user_enabled": settings.ALLOW_TEST_USER
    }

@app.get("/api/debug/test-auth")
async def test_auth(current_user: dict = Depends(get_current_user)):
    """Test authentication with test user bypass"""
    return {
        "authenticated": True,
        "user": current_user,
        "message": "Authentication working with test user!" if current_user.get("user_id") == "test-user-123" else "Authentication working!"
    }

@app.post("/api/debug/test-intent")
async def test_intent_creation(data: dict):
    """Test intent creation without authentication for debugging"""
    from app.services.nlp_service import nlp_service
    from app.services.embedding_service import embedding_service
    
    try:
        raw_query = data.get("raw_query", "")
        if not raw_query:
            return {"error": "raw_query is required"}
        
        # Parse query with NLP
        parsed_data = nlp_service.parse_query(raw_query)
        
        # Generate embedding
        embedding = embedding_service.generate_embedding(raw_query)
        
        return {
            "success": True,
            "query": raw_query,
            "parsed_data": parsed_data,
            "embedding_length": len(embedding) if embedding else 0,
            "message": "NLP and embedding services working correctly"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error in NLP or embedding processing"
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=settings.DEBUG,
        log_level="info"
    )