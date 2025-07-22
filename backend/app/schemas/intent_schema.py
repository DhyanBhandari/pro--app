from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class PostType(str, Enum):
    demand = "demand"
    supply = "supply"

class Category(str, Enum):
    product = "product"
    service = "service"
    social = "social"
    travel = "travel"
    general = "general"

class IntentCreate(BaseModel):
    raw_query: str
    location_name: Optional[str] = None
    location: Optional[Dict] = None  # {lat: float, lng: float}

class IntentResponse(BaseModel):
    intent_id: str
    user_id: str
    post_type: PostType
    category: Category
    raw_query: str
    parsed_data: Optional[Dict] = None
    embedding: Optional[List[float]] = None
    location_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    valid_until: datetime
    
    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    intent_id: str
    user_id: Optional[str] = None
    user_name: str
    location_name: str
    raw_query: str
    category: str
    post_type: str
    similarity: Optional[float] = None
    distance_km: Optional[float] = None
    combined_score: float
    created_at: datetime
    scores: Optional[Dict[str, float]] = None  # Detailed scores breakdown
    parsed_data: Optional[Dict] = None

class QueryParseResponse(BaseModel):
    structured_query: Dict
    follow_up_questions: List[str]
    is_complete: bool
    query_type: str  # "transactional" or "knowledge"