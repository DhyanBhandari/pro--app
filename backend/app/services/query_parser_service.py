from typing import Dict, List, Optional, Tuple
import re
from datetime import datetime

# Optional imports with fallback
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("[QueryParser] spaCy not available - install with: pip install spacy")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    print("[QueryParser] Google Generative AI not available - install with: pip install google-generativeai")

from app.core.config import settings

class QueryParserService:
    """
    Advanced query parsing service that:
    - Uses Gemini for conversational understanding
    - Uses spaCy for entity extraction
    - Generates follow-up questions for missing parameters
    - Structures queries for matching
    """
    
    def __init__(self):
        # Initialize spaCy
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                print("[QueryParser] spaCy model not found. Install with: python -m spacy download en_core_web_sm")
                self.nlp = None
        else:
            self.nlp = None
        
        # Initialize Gemini
        if GEMINI_AVAILABLE and hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
        else:
            if not GEMINI_AVAILABLE:
                print("[QueryParser] Gemini not available - using fallback parsing")
            else:
                print("[QueryParser] Gemini API key not configured")
            self.gemini_model = None
    
    async def parse_query(self, query: str, user_location: Optional[str] = None) -> Dict:
        """
        Parse user query and extract structured parameters
        Returns structured data and follow-up questions if needed
        """
        # First, use Gemini to understand intent and structure
        gemini_result = await self._parse_with_gemini(query, user_location)
        
        # Then use spaCy for additional entity extraction
        spacy_entities = self._extract_entities_spacy(query) if self.nlp else {}
        
        # Merge results
        structured_data = self._merge_parsing_results(gemini_result, spacy_entities)
        
        # Generate follow-up questions for missing params
        follow_ups = self._generate_follow_ups(structured_data, user_location)
        
        return {
            'structured_query': structured_data,
            'follow_up_questions': follow_ups,
            'is_complete': len(follow_ups) == 0,
            'query_type': self._determine_query_type(structured_data)
        }
    
    async def _parse_with_gemini(self, query: str, user_location: Optional[str] = None) -> Dict:
        """Use Gemini to parse and structure the query"""
        if not self.gemini_model:
            return self._fallback_parsing(query)
        
        prompt = f"""
        Parse this user query and extract structured information.
        User query: "{query}"
        User location: {user_location or "Unknown"}
        
        Extract the following if present:
        1. Intent (buy, sell, rent, meet, learn, ask, etc.)
        2. Category (laptop, car, tutor, plumber, etc.)
        3. Sub-category (specific model/type)
        4. Brand/Model
        5. Location mentioned in query
        6. Budget/Price
        7. Time preference (immediate/future)
        8. Specifications (list of features)
        9. Year (for vehicles/electronics)
        10. Fuel type (for vehicles)
        
        Return as JSON format. If it's a knowledge question rather than a transaction, 
        set intent as "knowledge" and provide a brief answer.
        
        Example response format:
        {{
            "intent": "buy",
            "category": "laptop",
            "sub_category": "gaming laptop",
            "brand": "HP",
            "model": "Pavilion",
            "location": "Whitefield, Bangalore",
            "budget": "50000",
            "time_preference": "immediate",
            "specs": ["16GB RAM", "512GB SSD", "RTX 3060"],
            "knowledge_response": null
        }}
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            
            # Parse JSON from response
            import json
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return self._fallback_parsing(query)
                
        except Exception as e:
            print(f"[QueryParser] Gemini parsing error: {e}")
            return self._fallback_parsing(query)
    
    def _extract_entities_spacy(self, query: str) -> Dict:
        """Extract entities using spaCy NER"""
        entities = {
            'locations': [],
            'money': [],
            'dates': [],
            'organizations': [],
            'products': []
        }
        
        try:
            doc = self.nlp(query)
            
            for ent in doc.ents:
                if ent.label_ == "GPE":  # Geopolitical entity
                    entities['locations'].append(ent.text)
                elif ent.label_ == "MONEY":
                    entities['money'].append(ent.text)
                elif ent.label_ == "DATE":
                    entities['dates'].append(ent.text)
                elif ent.label_ == "ORG":
                    entities['organizations'].append(ent.text)
                elif ent.label_ == "PRODUCT":
                    entities['products'].append(ent.text)
            
            # Also extract custom patterns
            entities.update(self._extract_custom_patterns(query))
            
        except Exception as e:
            print(f"[QueryParser] spaCy extraction error: {e}")
        
        return entities
    
    def _extract_custom_patterns(self, query: str) -> Dict:
        """Extract custom patterns not caught by spaCy"""
        patterns = {}
        
        # Price patterns
        price_patterns = [
            r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|k|thousand)?',
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|k|thousand)?\s*(?:rupees|rs|inr)',
            r'under\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|lac)?'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, query, re.IGNORECASE)
            if matches:
                patterns['price'] = matches[0]
                break
        
        # Year patterns (especially for vehicles)
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', query)
        if year_match:
            patterns['year'] = year_match.group(1)
        
        # Fuel type patterns
        fuel_types = ['petrol', 'diesel', 'cng', 'electric', 'hybrid']
        for fuel in fuel_types:
            if fuel in query.lower():
                patterns['fuel_type'] = fuel
                break
        
        # Intent patterns
        intent_keywords = {
            'buy': ['buy', 'buying', 'purchase', 'looking for', 'want to buy', 'need'],
            'sell': ['sell', 'selling', 'sale', 'for sale'],
            'rent': ['rent', 'renting', 'lease', 'for rent'],
            'meet': ['meet', 'date', 'friend', 'companion'],
            'learn': ['learn', 'tutor', 'class', 'course', 'training'],
            'hire': ['hire', 'hiring', 'employee', 'freelancer']
        }
        
        query_lower = query.lower()
        for intent, keywords in intent_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                patterns['intent'] = intent
                break
        
        return patterns
    
    def _merge_parsing_results(self, gemini_result: Dict, spacy_entities: Dict) -> Dict:
        """Merge results from Gemini and spaCy"""
        merged = gemini_result.copy()
        
        # Enhance with spaCy entities
        if spacy_entities.get('locations') and not merged.get('location'):
            merged['location'] = spacy_entities['locations'][0]
        
        if spacy_entities.get('money') and not merged.get('budget'):
            merged['budget'] = spacy_entities['money'][0]
        
        if spacy_entities.get('organizations') and not merged.get('brand'):
            # Check if org might be a brand
            orgs = spacy_entities['organizations']
            common_brands = ['hp', 'dell', 'lenovo', 'asus', 'apple', 'samsung', 
                           'honda', 'toyota', 'maruti', 'hyundai']
            for org in orgs:
                if org.lower() in common_brands:
                    merged['brand'] = org
                    break
        
        # Override with custom patterns if more accurate
        if spacy_entities.get('price'):
            merged['budget'] = spacy_entities['price']
        
        if spacy_entities.get('year'):
            merged['year'] = spacy_entities['year']
        
        if spacy_entities.get('fuel_type'):
            merged['fuel_type'] = spacy_entities['fuel_type']
        
        return merged
    
    def _generate_follow_ups(self, structured_data: Dict, user_location: Optional[str] = None) -> List[str]:
        """Generate conversational follow-up questions for missing parameters"""
        follow_ups = []
        
        # Check intent type
        intent = structured_data.get('intent', 'looking')
        category = structured_data.get('category', '')
        
        # Skip follow-ups for knowledge queries
        if intent == 'knowledge' or structured_data.get('knowledge_response'):
            return []
        
        # Location follow-up
        if not structured_data.get('location'):
            if user_location:
                follow_ups.append(f"Are you looking in {user_location}?")
            else:
                follow_ups.append("Where are you looking? Please share your location or city name.")
        
        # Category-specific follow-ups
        if category in ['laptop', 'computer', 'phone', 'electronics']:
            if not structured_data.get('brand'):
                follow_ups.append("Do you have a preferred brand like HP, Dell, Lenovo, or Apple?")
            
            if not structured_data.get('specs'):
                follow_ups.append("Any specific features you need? (e.g., RAM, storage, processor)")
            
            if not structured_data.get('budget'):
                follow_ups.append("What's your budget range?")
        
        elif category in ['car', 'bike', 'vehicle']:
            if not structured_data.get('brand'):
                follow_ups.append("Which brand are you interested in? (Honda, Toyota, Maruti, etc.)")
            
            if not structured_data.get('year'):
                follow_ups.append("Any preference for the model year?")
            
            if not structured_data.get('fuel_type'):
                follow_ups.append("Fuel type preference? (Petrol, Diesel, CNG, Electric)")
            
            if not structured_data.get('budget'):
                follow_ups.append("What's your budget range?")
        
        elif category in ['tutor', 'teacher', 'course']:
            if not structured_data.get('sub_category'):
                follow_ups.append("What subject or skill do you want to learn?")
            
            if not structured_data.get('time_preference'):
                follow_ups.append("When do you want to start? (Immediate/This week/Flexible)")
        
        elif intent in ['meet', 'date', 'friend']:
            if not structured_data.get('sub_category'):
                follow_ups.append("What kind of activity or interest? (Coffee, Sports, Movies, etc.)")
            
            if not structured_data.get('time_preference'):
                follow_ups.append("When are you free to meet? (Weekends/Evenings/Flexible)")
        
        # Limit to 4 follow-ups max
        return follow_ups[:4]
    
    def _determine_query_type(self, structured_data: Dict) -> str:
        """Determine if query is transactional or knowledge-based"""
        if structured_data.get('intent') == 'knowledge' or structured_data.get('knowledge_response'):
            return 'knowledge'
        
        if structured_data.get('intent') in ['buy', 'sell', 'rent', 'hire', 'meet', 'learn']:
            return 'transactional'
        
        # Check for question patterns
        knowledge_indicators = ['how to', 'what is', 'explain', 'why', 'when', 'can you']
        raw_query = structured_data.get('raw_query', '').lower()
        
        if any(indicator in raw_query for indicator in knowledge_indicators):
            return 'knowledge'
        
        return 'transactional'
    
    def _fallback_parsing(self, query: str) -> Dict:
        """Fallback parsing when Gemini is not available"""
        parsed = {
            'raw_query': query,
            'intent': None,
            'category': None,
            'sub_category': None,
            'brand': None,
            'model': None,
            'location': None,
            'budget': None,
            'time_preference': None,
            'specs': []
        }
        
        # Basic keyword extraction
        query_lower = query.lower()
        
        # Extract intent
        if any(word in query_lower for word in ['buy', 'purchase', 'looking for', 'need']):
            parsed['intent'] = 'buy'
        elif any(word in query_lower for word in ['sell', 'selling']):
            parsed['intent'] = 'sell'
        elif any(word in query_lower for word in ['rent', 'lease']):
            parsed['intent'] = 'rent'
        
        # Extract category
        categories = {
            'laptop': ['laptop', 'notebook', 'macbook'],
            'car': ['car', 'vehicle', 'sedan', 'suv', 'hatchback'],
            'bike': ['bike', 'motorcycle', 'scooter'],
            'phone': ['phone', 'mobile', 'smartphone', 'iphone'],
            'tutor': ['tutor', 'teacher', 'coaching', 'class']
        }
        
        for category, keywords in categories.items():
            if any(keyword in query_lower for keyword in keywords):
                parsed['category'] = category
                break
        
        # Extract price
        price_match = re.search(r'(\d+)k|(\d+)\s*lakh|₹\s*(\d+)', query_lower)
        if price_match:
            parsed['budget'] = price_match.group(0)
        
        return parsed

# Global instance
query_parser_service = QueryParserService()