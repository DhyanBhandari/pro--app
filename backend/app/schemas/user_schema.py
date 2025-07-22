from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

class LocationCreate(BaseModel):
    lat: float
    lng: float

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    interests: Optional[List[str]] = []
    location_name: Optional[str] = None
    location: Optional[LocationCreate] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    interests: Optional[List[str]] = []
    location_name: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None