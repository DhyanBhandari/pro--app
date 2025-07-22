import re
from typing import Dict, List, Optional

class NLPService:
    def __init__(self):
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            print("[NLPService] Initialized with spaCy en_core_web_sm")
        except ImportError:
            print("[NLPService] Warning: spaCy not available, using rule-based parsing")
            self.nlp = None
        except IOError:
            print("[NLPService] Warning: en_core_web_sm not found, using rule-based parsing")
            self.nlp = None
    
    def parse_query(self, text: str) -> Dict:
        """Parse query locally without external APIs"""
        text_lower = text.lower()
        
        # Intent patterns
        sell_patterns = [r'\b(sell|selling|offer|available)\b', r'\bfor sale\b']
        buy_patterns = [r'\b(buy|need|want|looking for|require)\b', r'\bwant to buy\b']
        service_patterns = [r'\b(plumber|electrician|repair|fix|service|help)\b']
        travel_patterns = [r'\b(trip|travel|going to|visit)\b']
        social_patterns = [r'\b(friend|meet|date|hangout|connect)\b']
        
        # Extract intent
        intent = 'demand'  # default
        category = 'general'
        
        for pattern in sell_patterns:
            if re.search(pattern, text, re.I):
                intent = 'supply'
                break
        
        # Detect category
        if any(re.search(p, text, re.I) for p in service_patterns):
            category = 'service'
        elif any(re.search(p, text, re.I) for p in travel_patterns):
            category = 'travel'
        elif any(re.search(p, text, re.I) for p in social_patterns):
            category = 'social'
        elif any(word in text_lower for word in ['car', 'bike', 'phone', 'laptop', 'iphone']):
            category = 'product'
        
        # Extract locations (simple pattern matching)
        locations = []
        location_patterns = [
            r'\b(whitefield|koramangala|hsr layout|indiranagar|electronic city|marathahalli|jayanagar|btm layout|banashankari|rajajinagar)\b'
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text, re.I)
            locations.extend(matches)
        
        # Price extraction (supports ₹ and k/L suffixes)
        prices = []
        price_patterns = [
            r'₹\s*(\d+)([kKlL]?)',
            r'\b(\d+)([kKlL]?)\s*(?:rupees?|rs|₹)',
            r'\$\s*(\d+)',
            r'\b(\d+)\s*(?:thousand|k|K)',
            r'\b(\d+)\s*(?:lakh|L|l)'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.I)
            for match in matches:
                if isinstance(match, tuple):
                    number, suffix = match
                    prices.append(f"{number}{suffix}")
                else:
                    prices.append(match)
        
        # Extract entities (simple version without spaCy)
        entities = []
        if self.nlp:
            try:
                doc = self.nlp(text_lower)
                entities = [(ent.text, ent.label_) for ent in doc.ents]
                # Update locations from spaCy if available
                for ent in doc.ents:
                    if ent.label_ in ["GPE", "LOC"]:
                        locations.append(ent.text)
            except:
                pass
        
        return {
            'intent': intent,
            'category': category,
            'locations': locations,
            'prices': prices,
            'entities': entities,
            'keywords': self._extract_keywords(text)
        }
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text"""
        if self.nlp:
            try:
                doc = self.nlp(text.lower())
                keywords = []
                
                for token in doc:
                    if (not token.is_stop and 
                        not token.is_punct and 
                        not token.is_space and 
                        len(token.text) > 2 and
                        token.pos_ in ['NOUN', 'ADJ', 'VERB']):
                        keywords.append(token.lemma_)
                
                return list(set(keywords))[:10]  # Return top 10 unique keywords
            except:
                pass
        
        # Fallback: simple keyword extraction
        import string
        words = text.lower().split()
        stop_words = {'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 
                     'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 
                     'to', 'was', 'will', 'with', 'i', 'you', 'this', 'my', 'me'}
        
        keywords = []
        for word in words:
            word = word.strip(string.punctuation)
            if len(word) > 2 and word not in stop_words:
                keywords.append(word)
        
        return list(set(keywords))[:10]

# Global instance
nlp_service = NLPService()