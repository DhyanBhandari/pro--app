from typing import List, Dict, Optional, Tuple
import asyncpg
from app.core.database import get_supabase
from app.services.embedding_service import embedding_service
import math
import re
from datetime import datetime, timedelta

class AdvancedMatchingService:
    """
    Advanced matching service with:
    - Semantic matching using embeddings
    - Intent inversion (buy ↔ sell)
    - Fuzzy parameter matching
    - Composite scoring system
    - Location-based proximity
    """
    
    # Intent mappings for buy/sell inversion
    INTENT_INVERSIONS = {
        'buy': 'sell',
        'sell': 'buy',
        'rent': 'rent_out',
        'rent_out': 'rent',
        'looking': 'offering',
        'offering': 'looking',
        'need': 'provide',
        'provide': 'need',
        'want': 'have',
        'have': 'want'
    }
    
    # Composite scoring weights
    SCORING_WEIGHTS = {
        'semantic_similarity': 0.4,
        'location_proximity': 0.2,
        'parameter_overlap': 0.3,
        'price_tolerance': 0.1
    }
    
    async def find_advanced_matches(self, intent_data: Dict) -> List[Dict]:
        """
        Find matches using advanced semantic and parameter matching
        """
        supabase = get_supabase()
        
        # Extract structured parameters from intent
        parsed_params = self._extract_parameters(intent_data)
        
        # Get inverse intent for matching
        user_intent = parsed_params.get('intent', 'buy')
        opposite_intent = self.INTENT_INVERSIONS.get(user_intent, user_intent)
        
        try:
            # Build advanced query with parameter filters
            query = supabase.table('intents')\
                .select('*, users(name, location_name, user_id)')\
                .eq('is_active', True)
            
            # Add category filter if available
            if parsed_params.get('category'):
                query = query.eq('category', parsed_params['category'])
            
            # Filter by opposite intent
            if opposite_intent:
                query = query.or_(
                    f"raw_query.ilike.%{opposite_intent}%,"
                    f"parsed_data->>intent.eq.{opposite_intent}"
                )
            
            response = query.execute()
            
            if not response.data:
                return []
            
            # Calculate comprehensive match scores
            matches_with_scores = []
            
            for match in response.data:
                try:
                    # Skip same user matches
                    if match.get('user_id') == intent_data.get('user_id'):
                        continue
                    
                    # Calculate individual scoring components
                    scores = await self._calculate_match_scores(
                        intent_data, 
                        match, 
                        parsed_params
                    )
                    
                    # Calculate composite score
                    composite_score = self._calculate_composite_score(scores)
                    
                    # Only include matches above threshold
                    if composite_score >= 0.75:
                        match_result = self._format_match_result(
                            match, 
                            scores, 
                            composite_score
                        )
                        matches_with_scores.append(match_result)
                        
                except Exception as e:
                    print(f"[AdvancedMatching] Error processing match: {e}")
                    continue
            
            # Sort by composite score and return top 7
            matches_with_scores.sort(key=lambda x: x['composite_score'], reverse=True)
            return matches_with_scores[:7]
            
        except Exception as e:
            print(f"[AdvancedMatching] Error finding matches: {e}")
            return []
    
    def _extract_parameters(self, intent_data: Dict) -> Dict:
        """Extract structured parameters from intent data"""
        params = {}
        
        # Extract from parsed_data if available
        if intent_data.get('parsed_data'):
            parsed = intent_data['parsed_data']
            params.update({
                'intent': parsed.get('intent'),
                'category': parsed.get('category'),
                'sub_category': parsed.get('sub_category'),
                'brand': parsed.get('brand'),
                'model': parsed.get('model'),
                'year': parsed.get('year'),
                'fuel_type': parsed.get('fuel_type'),
                'price': parsed.get('price'),
                'budget': parsed.get('budget'),
                'location': parsed.get('location'),
                'specs': parsed.get('specs', [])
            })
        
        # Fallback to direct fields
        params.update({
            'intent': params.get('intent') or self._extract_intent_from_query(intent_data.get('raw_query', '')),
            'category': params.get('category') or intent_data.get('category'),
            'location': params.get('location') or intent_data.get('location_name')
        })
        
        return params
    
    def _extract_intent_from_query(self, query: str) -> str:
        """Extract intent from raw query text"""
        query_lower = query.lower()
        
        # Check for common intent keywords
        intent_keywords = {
            'buy': ['buy', 'buying', 'purchase', 'looking for', 'want to buy', 'need'],
            'sell': ['sell', 'selling', 'sale', 'for sale', 'offering'],
            'rent': ['rent', 'renting', 'lease', 'for rent'],
            'rent_out': ['rent out', 'renting out', 'available for rent'],
            'looking': ['looking', 'searching', 'seeking', 'find'],
            'offering': ['offering', 'providing', 'available']
        }
        
        for intent, keywords in intent_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                return intent
        
        return 'looking'  # Default intent
    
    async def _calculate_match_scores(self, user_intent: Dict, match: Dict, user_params: Dict) -> Dict:
        """Calculate individual scoring components"""
        scores = {
            'semantic_similarity': 0.0,
            'location_proximity': 0.0,
            'parameter_overlap': 0.0,
            'price_tolerance': 0.0
        }
        
        # 1. Semantic similarity using embeddings
        user_embedding = user_intent.get('embedding', [])
        match_embedding = match.get('embedding', [])
        
        if not match_embedding and match.get('parsed_data'):
            match_embedding = match['parsed_data'].get('embedding', [])
        
        if user_embedding and match_embedding:
            scores['semantic_similarity'] = embedding_service.compute_similarity(
                user_embedding, 
                match_embedding
            )
        
        # 2. Location proximity
        scores['location_proximity'] = await self._calculate_location_score(
            user_intent.get('location_name'),
            match.get('location_name'),
            user_intent.get('location'),
            match.get('location')
        )
        
        # 3. Parameter overlap
        match_params = self._extract_parameters(match)
        scores['parameter_overlap'] = self._calculate_parameter_overlap(
            user_params, 
            match_params
        )
        
        # 4. Price tolerance
        scores['price_tolerance'] = self._calculate_price_tolerance(
            user_params, 
            match_params
        )
        
        return scores
    
    async def _calculate_location_score(
        self, 
        user_location_name: str, 
        match_location_name: str,
        user_coords: Optional[str] = None,
        match_coords: Optional[str] = None
    ) -> float:
        """Calculate location proximity score with PostGIS support"""
        
        # First try coordinate-based matching if available
        if user_coords and match_coords:
            distance = self._calculate_distance(user_coords, match_coords)
            if distance <= 10:
                return 1.0
            elif distance <= 20:
                return 0.8
            elif distance <= 50:
                return 0.5
            else:
                return 0.2
        
        # Fallback to name-based matching
        if not user_location_name or not match_location_name:
            return 0.5
        
        user_loc_lower = user_location_name.lower()
        match_loc_lower = match_location_name.lower()
        
        # Exact match
        if user_loc_lower == match_loc_lower:
            return 1.0
        
        # Partial match (same city/area)
        if user_loc_lower in match_loc_lower or match_loc_lower in user_loc_lower:
            return 0.8
        
        # Extract city names and compare
        user_city = self._extract_city(user_location_name)
        match_city = self._extract_city(match_location_name)
        
        if user_city and match_city and user_city.lower() == match_city.lower():
            return 0.6
        
        return 0.2
    
    def _calculate_parameter_overlap(self, user_params: Dict, match_params: Dict) -> float:
        """Calculate overlap score for structured parameters"""
        overlap_score = 0.0
        total_weight = 0.0
        
        # Define parameter weights
        param_weights = {
            'category': 0.3,
            'sub_category': 0.2,
            'brand': 0.2,
            'model': 0.15,
            'year': 0.1,
            'fuel_type': 0.05
        }
        
        for param, weight in param_weights.items():
            user_val = user_params.get(param)
            match_val = match_params.get(param)
            
            if user_val and match_val:
                total_weight += weight
                
                # Exact match
                if str(user_val).lower() == str(match_val).lower():
                    overlap_score += weight
                # Fuzzy match for year (±1 year tolerance)
                elif param == 'year':
                    try:
                        if abs(int(user_val) - int(match_val)) <= 1:
                            overlap_score += weight * 0.8
                    except:
                        pass
                # Partial match
                elif str(user_val).lower() in str(match_val).lower() or \
                     str(match_val).lower() in str(user_val).lower():
                    overlap_score += weight * 0.6
        
        # Normalize score
        return overlap_score / total_weight if total_weight > 0 else 0.5
    
    def _calculate_price_tolerance(self, user_params: Dict, match_params: Dict) -> float:
        """Calculate price match score with ±10% tolerance"""
        user_price = user_params.get('price') or user_params.get('budget')
        match_price = match_params.get('price') or match_params.get('budget')
        
        if not user_price or not match_price:
            return 0.5  # Neutral score if price not specified
        
        try:
            # Convert to float
            user_price_val = self._extract_price_value(str(user_price))
            match_price_val = self._extract_price_value(str(match_price))
            
            if user_price_val and match_price_val:
                # Check if within ±10% tolerance
                price_diff = abs(user_price_val - match_price_val)
                tolerance = user_price_val * 0.1
                
                if price_diff <= tolerance:
                    # Linear score based on closeness
                    return 1.0 - (price_diff / tolerance)
                else:
                    # Outside tolerance, but give some score for being in ballpark
                    return max(0.0, 1.0 - (price_diff / (user_price_val * 0.5)))
            
        except Exception as e:
            print(f"[AdvancedMatching] Error calculating price tolerance: {e}")
        
        return 0.5
    
    def _extract_price_value(self, price_str: str) -> Optional[float]:
        """Extract numeric price value from string"""
        # Remove common currency symbols and words
        price_str = re.sub(r'[₹$£€,]|lakh|lac|k|thousand', '', price_str, flags=re.IGNORECASE)
        
        # Extract first number
        numbers = re.findall(r'\d+\.?\d*', price_str)
        if numbers:
            value = float(numbers[0])
            
            # Convert lakhs/thousands if mentioned
            if 'lakh' in price_str.lower() or 'lac' in price_str.lower():
                value *= 100000
            elif 'k' in price_str.lower() or 'thousand' in price_str.lower():
                value *= 1000
            
            return value
        
        return None
    
    def _calculate_composite_score(self, scores: Dict) -> float:
        """Calculate weighted composite score"""
        composite = 0.0
        
        for component, weight in self.SCORING_WEIGHTS.items():
            composite += scores.get(component, 0.0) * weight
        
        return composite
    
    def _format_match_result(self, match: Dict, scores: Dict, composite_score: float) -> Dict:
        """Format match result with all relevant information"""
        return {
            'intent_id': match['intent_id'],
            'user_id': match.get('user_id'),
            'user_name': match['users']['name'] if match.get('users') else 'Unknown',
            'location_name': match.get('location_name', ''),
            'raw_query': match['raw_query'],
            'category': match['category'],
            'post_type': match['post_type'],
            'scores': {
                'semantic': round(scores['semantic_similarity'], 3),
                'location': round(scores['location_proximity'], 3),
                'parameters': round(scores['parameter_overlap'], 3),
                'price': round(scores['price_tolerance'], 3)
            },
            'composite_score': round(composite_score, 3),
            'created_at': match['created_at'],
            'parsed_data': match.get('parsed_data', {})
        }
    
    def _extract_city(self, location_name: str) -> Optional[str]:
        """Extract city name from location string"""
        # Common patterns: "Area, City" or "City"
        parts = location_name.split(',')
        if len(parts) >= 2:
            return parts[-1].strip()
        return location_name.strip()
    
    def _calculate_distance(self, location1: str, location2: str) -> float:
        """Calculate distance between two POINT geometries"""
        try:
            # Extract coordinates from POINT(lng lat) format
            coords1 = re.findall(r'POINT\(([^)]+)\)', location1)
            coords2 = re.findall(r'POINT\(([^)]+)\)', location2)
            
            if not coords1 or not coords2:
                return 50.0
            
            lng1, lat1 = map(float, coords1[0].split())
            lng2, lat2 = map(float, coords2[0].split())
            
            # Haversine formula
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
            print(f"[AdvancedMatching] Error calculating distance: {e}")
            return 50.0
    
    async def save_intent_for_future_matching(self, intent_data: Dict) -> Dict:
        """Save user intent as active for 5 days for future matching"""
        supabase = get_supabase()
        
        # Set expiry date to 5 days from now
        expiry_date = (datetime.now() + timedelta(days=5)).isoformat()
        
        intent_data['is_active'] = True
        intent_data['expiry_date'] = expiry_date
        intent_data['match_notifications_enabled'] = True
        
        response = supabase.table('intents').upsert(intent_data).execute()
        return response.data[0] if response.data else None

# Global instance
advanced_matching_service = AdvancedMatchingService()