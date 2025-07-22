from typing import List, Dict, Optional
import asyncio
from datetime import datetime, timedelta
import logging

# Optional import for Firebase
try:
    from firebase_admin import messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    messaging = None
    print("[NotificationService] Firebase Admin SDK not available - install with: pip install firebase-admin")

from app.core.database import get_supabase
from app.services.advanced_matching_service import advanced_matching_service

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for managing real-time notifications for new matches
    """
    
    def __init__(self):
        self.supabase = get_supabase()
        self._notification_queue = asyncio.Queue()
        self._is_running = False
    
    async def start_notification_worker(self):
        """Start the background worker for processing notifications"""
        self._is_running = True
        logger.info("[NotificationService] Starting notification worker")
        
        while self._is_running:
            try:
                # Process notifications every 5 minutes
                await self._check_and_send_notifications()
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                logger.error(f"[NotificationService] Worker error: {e}")
                await asyncio.sleep(60)  # Retry after 1 minute on error
    
    async def stop_notification_worker(self):
        """Stop the notification worker"""
        self._is_running = False
        logger.info("[NotificationService] Stopping notification worker")
    
    async def _check_and_send_notifications(self):
        """Check for new matches and send notifications"""
        try:
            # Get all active intents that have notifications enabled
            response = self.supabase.table('intents')\
                .select('*, users(fcm_token, notification_preferences)')\
                .eq('is_active', True)\
                .eq('match_notifications_enabled', True)\
                .gte('expiry_date', datetime.utcnow().isoformat())\
                .execute()
            
            if not response.data:
                return
            
            logger.info(f"[NotificationService] Checking {len(response.data)} active intents")
            
            for intent in response.data:
                try:
                    await self._check_intent_for_new_matches(intent)
                except Exception as e:
                    logger.error(f"[NotificationService] Error checking intent {intent['intent_id']}: {e}")
        
        except Exception as e:
            logger.error(f"[NotificationService] Error in notification check: {e}")
    
    async def _check_intent_for_new_matches(self, intent: Dict):
        """Check if an intent has new matches since last check"""
        intent_id = intent['intent_id']
        user_id = intent['user_id']
        
        # Get last notification check timestamp
        last_check_response = self.supabase.table('match_notifications')\
            .select('created_at')\
            .eq('intent_id', intent_id)\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        last_check = None
        if last_check_response.data:
            last_check = datetime.fromisoformat(
                last_check_response.data[0]['created_at'].replace('Z', '+00:00')
            )
        
        # Find new matches
        new_matches = await advanced_matching_service.find_advanced_matches(intent)
        
        # Filter matches created after last check
        if last_check:
            new_matches = [
                m for m in new_matches 
                if datetime.fromisoformat(m['created_at'].replace('Z', '+00:00')) > last_check
            ]
        
        # Only notify for high-quality matches (>75% score)
        high_quality_matches = [m for m in new_matches if m['composite_score'] >= 0.75]
        
        if high_quality_matches:
            logger.info(f"[NotificationService] Found {len(high_quality_matches)} new matches for intent {intent_id}")
            
            # Record notifications in database
            for match in high_quality_matches:
                await self._record_notification(user_id, intent_id, match['intent_id'], match['composite_score'])
            
            # Send push notification if user has FCM token
            if intent.get('users') and intent['users'].get('fcm_token'):
                await self._send_push_notification(
                    intent['users']['fcm_token'],
                    intent,
                    high_quality_matches
                )
    
    async def _record_notification(
        self, 
        user_id: str, 
        intent_id: str, 
        matched_intent_id: str, 
        match_score: float
    ):
        """Record a notification in the database"""
        try:
            self.supabase.table('match_notifications').insert({
                'user_id': user_id,
                'intent_id': intent_id,
                'matched_intent_id': matched_intent_id,
                'match_score': match_score,
                'notification_sent': False,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"[NotificationService] Error recording notification: {e}")
    
    async def _send_push_notification(
        self, 
        fcm_token: str, 
        intent: Dict, 
        matches: List[Dict]
    ):
        """Send Firebase Cloud Messaging push notification"""
        if not FIREBASE_AVAILABLE:
            logger.warning("[NotificationService] Firebase not available - skipping push notification")
            return
            
        try:
            # Create notification message
            match_count = len(matches)
            best_match = max(matches, key=lambda m: m['composite_score'])
            
            title = f"🎯 {match_count} New Match{'es' if match_count > 1 else ''} Found!"
            body = f"Your search '{intent['raw_query']}' has new matches. Best match: {best_match['user_name']} ({round(best_match['composite_score'] * 100)}% match)"
            
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'intent_id': intent['intent_id'],
                    'match_count': str(match_count),
                    'best_match_id': best_match['intent_id'],
                    'click_action': 'OPEN_MATCHES'
                },
                token=fcm_token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        icon='ic_notification',
                        color='#6366F1',
                        sound='default'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(
                                title=title,
                                body=body
                            ),
                            badge=match_count,
                            sound='default'
                        )
                    )
                )
            )
            
            # Send the notification
            response = messaging.send(message)
            logger.info(f"[NotificationService] Push notification sent: {response}")
            
            # Mark notifications as sent
            for match in matches:
                self.supabase.table('match_notifications')\
                    .update({
                        'notification_sent': True,
                        'sent_at': datetime.utcnow().isoformat()
                    })\
                    .eq('intent_id', intent['intent_id'])\
                    .eq('matched_intent_id', match['intent_id'])\
                    .execute()
        
        except Exception as e:
            logger.error(f"[NotificationService] Error sending push notification: {e}")
    
    async def register_device_token(self, user_id: str, fcm_token: str):
        """Register or update user's FCM token"""
        try:
            response = self.supabase.table('users')\
                .update({'fcm_token': fcm_token})\
                .eq('user_id', user_id)\
                .execute()
            
            logger.info(f"[NotificationService] FCM token registered for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"[NotificationService] Error registering FCM token: {e}")
            return False
    
    async def get_user_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's notification history"""
        try:
            response = self.supabase.table('match_notifications')\
                .select('*, intents!intent_id(*), intents!matched_intent_id(*)')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"[NotificationService] Error fetching notifications: {e}")
            return []
    
    async def mark_notification_read(self, notification_id: str, user_id: str):
        """Mark a notification as read"""
        try:
            self.supabase.table('match_notifications')\
                .update({'read_at': datetime.utcnow().isoformat()})\
                .eq('notification_id', notification_id)\
                .eq('user_id', user_id)\
                .execute()
            
            return True
        except Exception as e:
            logger.error(f"[NotificationService] Error marking notification as read: {e}")
            return False
    
    async def update_notification_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, bool]
    ):
        """Update user's notification preferences"""
        try:
            self.supabase.table('users')\
                .update({'notification_preferences': preferences})\
                .eq('user_id', user_id)\
                .execute()
            
            logger.info(f"[NotificationService] Updated notification preferences for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"[NotificationService] Error updating preferences: {e}")
            return False

# Global instance
notification_service = NotificationService()

# Function to start the notification worker in the background
async def start_notification_worker():
    """Start the notification worker as a background task"""
    asyncio.create_task(notification_service.start_notification_worker())