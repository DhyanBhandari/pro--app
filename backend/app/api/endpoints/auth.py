from fastapi import APIRouter, HTTPException, status
from app.schemas.user_schema import UserCreate, UserLogin, Token, UserResponse
from app.core.security import create_access_token
from app.core.database import get_supabase
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register new user with Supabase auth and create profile"""
    print(f"[Auth] Registering user: {user_data.email}")
    
    try:
        supabase = get_supabase()
        
        # Create auth user
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if hasattr(auth_response, 'error') and auth_response.error:
            print(f"[Auth] Supabase auth error: {auth_response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(auth_response.error)
            )
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        user_id = auth_response.user.id
        
        # Create user profile
        profile_data = {
            "user_id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone,
            "interests": user_data.interests or [],
            "location_name": user_data.location_name,
            "bio": user_data.bio,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add location geometry if provided
        if user_data.location:
            profile_data["location"] = f"POINT({user_data.location.lng} {user_data.location.lat})"
        
        profile_response = supabase.table("users").insert(profile_data).execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user profile"
            )
        
        # Create access token
        access_token = create_access_token({"sub": user_id})
        
        user_profile = profile_response.data[0]
        user_response = UserResponse(
            user_id=user_profile["user_id"],
            name=user_profile["name"],
            email=user_profile["email"],
            phone=user_profile.get("phone"),
            interests=user_profile.get("interests", []),
            location_name=user_profile.get("location_name"),
            bio=user_profile.get("bio"),
            created_at=datetime.fromisoformat(user_profile["created_at"].replace('Z', '+00:00'))
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user with Supabase auth"""
    print(f"[Auth] Login attempt: {credentials.email}")
    
    try:
        supabase = get_supabase()
        
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if hasattr(auth_response, 'error') and auth_response.error:
            print(f"[Auth] Login failed: {auth_response.error}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_id = auth_response.user.id
        
        # Get user profile
        profile_response = supabase.table("users")\
            .select("*")\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Create access token
        access_token = create_access_token({"sub": user_id})
        
        user_profile = profile_response.data
        user_response = UserResponse(
            user_id=user_profile["user_id"],
            name=user_profile["name"],
            email=user_profile["email"],
            phone=user_profile.get("phone"),
            interests=user_profile.get("interests", []),
            location_name=user_profile.get("location_name"),
            bio=user_profile.get("bio"),
            created_at=datetime.fromisoformat(user_profile["created_at"].replace('Z', '+00:00'))
        )
        
        print(f"[Auth] Login successful for user: {user_id}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/logout")
async def logout():
    """Logout user (token invalidation would be handled client-side)"""
    print("[Auth] User logout")
    return {"message": "Logged out successfully"}