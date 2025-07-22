from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from app.schemas.intent_schema import IntentCreate, IntentResponse, MatchResponse, QueryParseResponse
from app.core.security import get_current_user
from app.core.database import get_supabase
from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service
from app.services.matching_service import matching_service
from app.services.ml_matching_service import ml_matching_service
from app.services.advanced_matching_service import advanced_matching_service
from app.services.query_parser_service import query_parser_service
from datetime import datetime, timedelta
import uuid
import json

router = APIRouter()

@router.post("/parse", response_model=QueryParseResponse)
async def parse_query(
    query: str,
    location: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Parse a user query and return structured data with follow-up questions"""
    print(f"[Intents] Parsing query: {query}")
    
    try:
        # Parse query with advanced parser
        parse_result = await query_parser_service.parse_query(query, location)
        
        return QueryParseResponse(
            structured_query=parse_result['structured_query'],
            follow_up_questions=parse_result['follow_up_questions'],
            is_complete=parse_result['is_complete'],
            query_type=parse_result['query_type']
        )
        
    except Exception as e:
        print(f"[Intents] Error parsing query: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse query")

@router.post("", response_model=IntentResponse)
async def create_intent(
    intent_data: IntentCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new intent with advanced NLP parsing and embedding generation"""
    user_id = current_user["user_id"]
    print(f"[Intents] Creating intent for user: {user_id}")
    print(f"[Intents] Query: {intent_data.raw_query}")
    
    try:
        # Parse query with advanced parser
        parse_result = await query_parser_service.parse_query(
            intent_data.raw_query, 
            intent_data.location_name
        )
        
        parsed_data = parse_result['structured_query']
        
        # If query is not complete, include follow-up questions in response
        if not parse_result['is_complete']:
            print(f"[Intents] Query needs more info: {parse_result['follow_up_questions']}")
        
        # Generate embedding
        embedding = embedding_service.generate_embedding(intent_data.raw_query)
        
        # Determine post_type based on intent
        post_type = 'demand' if parsed_data.get('intent') in ['buy', 'rent', 'need', 'looking'] else 'supply'
        
        # Prepare intent record with advanced fields
        intent_record = {
            "intent_id": str(uuid.uuid4()),
            "user_id": user_id,
            "post_type": post_type,
            "category": parsed_data.get("category", "general"),
            "raw_query": intent_data.raw_query,
            "parsed_data": parsed_data,
            "location_name": intent_data.location_name,
            "embedding": embedding,  # Store directly if column exists
            "is_active": True,
            "expiry_date": (datetime.utcnow() + timedelta(days=5)).isoformat(),  # 5 days for live intents
            "match_notifications_enabled": True,
            "created_at": datetime.utcnow().isoformat(),
            "valid_until": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        # Also store embedding in parsed_data as fallback
        intent_record["parsed_data"]["embedding"] = embedding
        
        # Insert into database
        supabase = get_supabase()
        response = supabase.table("intents").insert(intent_record).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create intent")
        
        intent_result = response.data[0]
        
        print(f"[Intents] Created intent: {intent_result['intent_id']}")
        print(f"[Intents] Detected - Type: {parsed_data['intent']}, Category: {parsed_data['category']}")
        
        return IntentResponse(
            intent_id=intent_result["intent_id"],
            user_id=intent_result["user_id"],
            post_type=intent_result["post_type"],
            category=intent_result["category"],
            raw_query=intent_result["raw_query"],
            parsed_data=intent_result.get("parsed_data"),
            embedding=intent_result.get("embedding"),
            location_name=intent_result.get("location_name"),
            is_active=intent_result["is_active"],
            created_at=datetime.fromisoformat(intent_result["created_at"].replace('Z', '+00:00')),
            valid_until=datetime.fromisoformat(intent_result["valid_until"].replace('Z', '+00:00'))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Intents] Error creating intent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{intent_id}/matches", response_model=List[MatchResponse])
async def get_matches_for_intent(
    intent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get matches for a specific intent"""
    user_id = current_user["user_id"]
    print(f"[Intents] Getting matches for intent: {intent_id}")
    
    try:
        supabase = get_supabase()
        
        # Get the intent
        intent_response = supabase.table("intents")\
            .select("*")\
            .eq("intent_id", intent_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not intent_response.data:
            raise HTTPException(status_code=404, detail="Intent not found")
        
        intent_data = intent_response.data
        
        # Find matches using advanced matching service
        try:
            matches = await advanced_matching_service.find_advanced_matches(intent_data)
            print(f"[Intents] Advanced matching found {len(matches)} matches")
        except Exception as e:
            print(f"[Intents] Advanced matching failed, trying ML matching: {e}")
            try:
                matches = await ml_matching_service.find_advanced_matches(intent_data)
            except Exception as e2:
                print(f"[Intents] ML matching also failed, using basic fallback: {e2}")
                matches = await matching_service.find_matches(intent_data)
        
        print(f"[Intents] Found {len(matches)} matches for intent: {intent_id}")
        
        return [MatchResponse(**match) for match in matches]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Intents] Error getting matches: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my", response_model=List[IntentResponse])
async def get_my_intents(current_user: dict = Depends(get_current_user)):
    """Get current user's intents"""
    user_id = current_user["user_id"]
    print(f"[Intents] Getting intents for user: {user_id}")
    
    try:
        supabase = get_supabase()
        
        response = supabase.table("intents")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("is_active", True)\
            .order("created_at", desc=True)\
            .execute()
        
        intents = []
        for intent_data in response.data or []:
            intents.append(IntentResponse(
                intent_id=intent_data["intent_id"],
                user_id=intent_data["user_id"],
                post_type=intent_data["post_type"],
                category=intent_data["category"],
                raw_query=intent_data["raw_query"],
                parsed_data=intent_data.get("parsed_data"),
                location_name=intent_data.get("location_name"),
                is_active=intent_data["is_active"],
                created_at=datetime.fromisoformat(intent_data["created_at"].replace('Z', '+00:00')),
                valid_until=datetime.fromisoformat(intent_data["valid_until"].replace('Z', '+00:00'))
            ))
        
        print(f"[Intents] Found {len(intents)} intents for user")
        return intents
        
    except Exception as e:
        print(f"[Intents] Error getting user intents: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{intent_id}")
async def deactivate_intent(
    intent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate an intent"""
    user_id = current_user["user_id"]
    print(f"[Intents] Deactivating intent: {intent_id} for user: {user_id}")
    
    try:
        supabase = get_supabase()
        
        response = supabase.table("intents")\
            .update({"is_active": False})\
            .eq("intent_id", intent_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Intent not found")
        
        return {"message": "Intent deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Intents] Error deactivating intent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")