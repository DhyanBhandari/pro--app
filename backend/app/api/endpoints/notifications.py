from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from app.schemas.notification_schema import (
    NotificationResponse, 
    FCMTokenUpdate,
    NotificationPreferences,
    NotificationMarkRead
)
from app.core.security import get_current_user
from app.services.notification_service import notification_service

router = APIRouter()

@router.post("/register-token")
async def register_fcm_token(
    token_data: FCMTokenUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Register or update user's FCM token for push notifications"""
    user_id = current_user["user_id"]
    
    success = await notification_service.register_device_token(
        user_id, 
        token_data.fcm_token
    )
    
    if success:
        return {"message": "FCM token registered successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to register FCM token")

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's notification history"""
    user_id = current_user["user_id"]
    
    notifications = await notification_service.get_user_notifications(user_id, limit)
    
    # Format response
    formatted_notifications = []
    for notif in notifications:
        formatted_notifications.append(NotificationResponse(
            notification_id=notif['notification_id'],
            user_id=notif['user_id'],
            intent_id=notif['intent_id'],
            matched_intent_id=notif['matched_intent_id'],
            match_score=notif['match_score'],
            notification_sent=notif['notification_sent'],
            created_at=notif['created_at'],
            sent_at=notif.get('sent_at'),
            read_at=notif.get('read_at'),
            intent_data=notif.get('intents_intent_id'),
            matched_intent_data=notif.get('intents_matched_intent_id')
        ))
    
    return formatted_notifications

@router.post("/mark-read")
async def mark_notification_read(
    read_data: NotificationMarkRead,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    user_id = current_user["user_id"]
    
    success = await notification_service.mark_notification_read(
        read_data.notification_id,
        user_id
    )
    
    if success:
        return {"message": "Notification marked as read"}
    else:
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.put("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification preferences"""
    user_id = current_user["user_id"]
    
    success = await notification_service.update_notification_preferences(
        user_id,
        preferences.dict()
    )
    
    if success:
        return {"message": "Notification preferences updated successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    user_id = current_user["user_id"]
    
    notifications = await notification_service.get_user_notifications(user_id)
    unread_count = sum(1 for n in notifications if not n.get('read_at'))
    
    return {"unread_count": unread_count}