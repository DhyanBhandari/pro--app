from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class FCMTokenUpdate(BaseModel):
    fcm_token: str

class NotificationPreferences(BaseModel):
    push_enabled: bool = True
    email_enabled: bool = False
    sms_enabled: bool = False
    match_notifications: bool = True
    chat_notifications: bool = True
    marketing_notifications: bool = False

class NotificationMarkRead(BaseModel):
    notification_id: str

class NotificationResponse(BaseModel):
    notification_id: str
    user_id: str
    intent_id: str
    matched_intent_id: str
    match_score: float
    notification_sent: bool
    created_at: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    intent_data: Optional[Dict] = None
    matched_intent_data: Optional[Dict] = None
    
    class Config:
        from_attributes = True