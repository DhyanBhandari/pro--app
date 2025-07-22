from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import UserResponse
from app.core.security import get_current_user
from app.core.database import get_supabase
from datetime import datetime

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    user_id = current_user["user_id"]
    print(f"[Users] Getting profile for user: {user_id}")
    
    try:
        supabase = get_supabase()
        
        response = supabase.table("users")\
            .select("*")\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = response.data
        return UserResponse(
            user_id=user_data["user_id"],
            name=user_data["name"],
            email=user_data["email"],
            phone=user_data.get("phone"),
            interests=user_data.get("interests", []),
            location_name=user_data.get("location_name"),
            bio=user_data.get("bio"),
            created_at=datetime.fromisoformat(user_data["created_at"].replace('Z', '+00:00'))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Users] Error getting profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get another user's public profile"""
    print(f"[Users] Getting public profile for user: {user_id}")
    
    try:
        supabase = get_supabase()
        
        response = supabase.table("users")\
            .select("user_id, name, location_name, bio, interests, created_at")\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = response.data
        return UserResponse(
            user_id=user_data["user_id"],
            name=user_data["name"],
            email="",  # Don't expose email in public profile
            interests=user_data.get("interests", []),
            location_name=user_data.get("location_name"),
            bio=user_data.get("bio"),
            created_at=datetime.fromisoformat(user_data["created_at"].replace('Z', '+00:00'))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Users] Error getting public profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")