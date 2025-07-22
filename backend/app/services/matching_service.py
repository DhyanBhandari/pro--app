from typing import List, Dict, Optional
import asyncpg
from app.core.database import get_supabase
from app.services.embedding_service import embedding_service
import math

class MatchingService:
    
    async def find_matches(self, intent_data: Dict) -> List[Dict]:
        """Find matches using similarity and location proximity (simplified version)"""
        supabase = get_supabase()
        
        # Get opposite intent type for matching
        opposite_intent = 'supply' if intent_data['post_type'] == 'demand' else 'demand'
        
        try:
            # Query for potential matches
            query = supabase.table('intents')\
                .select('*, users(name, location_name)')\
                .eq('post_type', opposite_intent)\
                .eq('category', intent_data['category'])\
                .eq('is_active', True)
                # Note: Removed date filter for now due to potential SQL issues
            
            response = query.execute()
            
            if not response.data:
                print(f"[Matching] No potential matches found for category: {intent_data['category']}")
                return []
            
            # Calculate similarity scores
            matches_with_scores = []
            user_embedding = intent_data.get('embedding', [])
            user_location_name = intent_data.get('location_name', '')
            
            # Also try to get embedding from parsed_data
            if not user_embedding and intent_data.get('parsed_data'):
                user_embedding = intent_data['parsed_data'].get('embedding', [])
            
            for match in response.data:
                try:
                    # Compute embedding similarity if both have embeddings
                    similarity = 0.5  # Default similarity
                    
                    # Get match embedding from parsed_data or direct field
                    match_embedding = match.get('embedding')
                    if not match_embedding and match.get('parsed_data'):
                        match_embedding = match['parsed_data'].get('embedding')
                    
                    if user_embedding and match_embedding:
                        # Only compute if we have both embeddings
                        if isinstance(match_embedding, list) and len(match_embedding) > 0:
                            similarity = embedding_service.compute_similarity(
                                user_embedding, 
                                match_embedding
                            )
                    
                    # Compute location proximity score
                    location_score = 0.5  # Default location score
                    distance_km = 0.0
                    
                    if user_location_name and match.get('location_name'):
                        # Simple string matching for location proximity
                        if user_location_name.lower() == match['location_name'].lower():
                            location_score = 1.0
                            distance_km = 0.0
                        elif user_location_name.lower() in match['location_name'].lower() or \
                             match['location_name'].lower() in user_location_name.lower():
                            location_score = 0.7
                            distance_km = 5.0
                        else:
                            location_score = 0.2
                            distance_km = 20.0
                    
                    # Combined score (70% similarity, 30% location)
                    combined_score = (similarity * 0.7) + (location_score * 0.3)
                    
                    # Include matches with reasonable scores
                    if combined_score > 0.3:
                        match_result = {
                            'intent_id': match['intent_id'],
                            'user_name': match['users']['name'] if match.get('users') else 'Unknown',
                            'location_name': match.get('location_name', ''),
                            'raw_query': match['raw_query'],
                            'category': match['category'],
                            'post_type': match['post_type'],
                            'similarity': round(similarity, 3),
                            'distance_km': round(distance_km, 2),
                            'combined_score': round(combined_score, 3),
                            'created_at': match['created_at']
                        }
                        matches_with_scores.append(match_result)
                        
                except Exception as e:
                    print(f"[Matching] Error processing match {match.get('intent_id', 'unknown')}: {e}")
                    continue
            
            # Sort by combined score
            matches_with_scores.sort(key=lambda x: x['combined_score'], reverse=True)
            
            print(f"[Matching] Found {len(matches_with_scores)} relevant matches")
            return matches_with_scores[:10]  # Return top 10 matches
            
        except Exception as e:
            print(f"[Matching] Error finding matches: {e}")
            return []
    
    def _calculate_distance(self, location1: str, location2: str) -> float:
        """Calculate distance between two location strings (simplified)"""
        # This is a simplified version. In production, you'd parse the 
        # POINT geometries and calculate actual distance
        try:
            # Extract coordinates from POINT(lng lat) format
            import re
            
            coords1 = re.findall(r'POINT\(([^)]+)\)', location1)
            coords2 = re.findall(r'POINT\(([^)]+)\)', location2)
            
            if not coords1 or not coords2:
                return 50.0  # Default distance if parsing fails
            
            lng1, lat1 = map(float, coords1[0].split())
            lng2, lat2 = map(float, coords2[0].split())
            
            # Haversine formula for distance
            R = 6371  # Earth's radius in kilometers
            
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            
            a = (math.sin(dlat/2) ** 2 + 
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
                 math.sin(dlng/2) ** 2)
            
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            return distance
            
        except Exception as e:
            print(f"[Matching] Error calculating distance: {e}")
            return 50.0  # Default fallback
    
    def _location_proximity_score(self, distance_km: float) -> float:
        """Convert distance to proximity score (0-1)"""
        if distance_km <= 5:
            return 1.0
        elif distance_km <= 10:
            return 0.8
        elif distance_km <= 20:
            return 0.5
        elif distance_km <= 50:
            return 0.2
        else:
            return 0.0
    
    async def create_match_record(self, intent1_id: str, intent2_id: str, similarity_score: float):
        """Create a match record in the database"""
        supabase = get_supabase()
        
        match_data = {
            'intent1_id': intent1_id,
            'intent2_id': intent2_id,
            'similarity_score': similarity_score,
            'status': 'pending'
        }
        
        response = supabase.table('matches').insert(match_data).execute()
        return response.data[0] if response.data else None

# Global instance
matching_service = MatchingService()