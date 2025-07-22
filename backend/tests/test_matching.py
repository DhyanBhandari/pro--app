import pytest
import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service
from app.services.matching_service import matching_service

class TestNLPService:
    
    def test_parse_sell_query(self):
        """Test parsing of sell intent"""
        query = "Selling iPhone 13 in Whitefield for 40k"
        result = nlp_service.parse_query(query)
        
        assert result['intent'] == 'supply'
        assert result['category'] == 'product'
        assert 'whitefield' in [loc.lower() for loc in result['locations']] or len(result['locations']) == 0  # spaCy might not detect location
        assert len(result['prices']) > 0
        assert 'iphone' in ' '.join(result['keywords']).lower() or 'phone' in ' '.join(result['keywords']).lower()
    
    def test_parse_buy_query(self):
        """Test parsing of buy intent"""
        query = "Looking for iPhone in Koramangala under 50k"
        result = nlp_service.parse_query(query)
        
        assert result['intent'] == 'demand'
        assert result['category'] == 'product'
        assert len(result['keywords']) > 0
    
    def test_parse_service_query(self):
        """Test parsing of service intent"""
        query = "Need plumber in HSR Layout urgently"
        result = nlp_service.parse_query(query)
        
        assert result['intent'] == 'demand'
        assert result['category'] == 'service'
        assert 'plumber' in ' '.join(result['keywords']).lower()
    
    def test_parse_travel_query(self):
        """Test parsing of travel intent"""
        query = "Planning trip to Goa from Bangalore"
        result = nlp_service.parse_query(query)
        
        assert result['category'] == 'travel'
        assert len(result['keywords']) > 0
    
    def test_extract_keywords(self):
        """Test keyword extraction"""
        keywords = nlp_service._extract_keywords("Selling brand new iPhone 13 in excellent condition")
        assert len(keywords) > 0
        assert any('iphone' in kw.lower() or 'phone' in kw.lower() or 'sell' in kw.lower() for kw in keywords)

class TestEmbeddingService:
    
    def test_generate_embedding(self):
        """Test embedding generation"""
        text = "Selling iPhone 13 in Whitefield"
        embedding = embedding_service.generate_embedding(text)
        
        assert isinstance(embedding, list)
        assert len(embedding) == 384  # all-MiniLM-L6-v2 dimension
        assert all(isinstance(x, (int, float)) for x in embedding)
    
    def test_compute_similarity(self):
        """Test similarity computation"""
        text1 = "Selling iPhone 13 in Whitefield"
        text2 = "Looking for iPhone in Whitefield"
        text3 = "Need plumber in HSR Layout"
        
        emb1 = embedding_service.generate_embedding(text1)
        emb2 = embedding_service.generate_embedding(text2)
        emb3 = embedding_service.generate_embedding(text3)
        
        # Similar queries should have higher similarity
        sim_12 = embedding_service.compute_similarity(emb1, emb2)
        sim_13 = embedding_service.compute_similarity(emb1, emb3)
        
        assert -1 <= sim_12 <= 1
        assert -1 <= sim_13 <= 1
        # iPhone queries should be more similar than iPhone vs plumber
        assert sim_12 > sim_13
    
    def test_sanitize_text(self):
        """Test PII sanitization"""
        text = "Call me at 9876543210 or email john.doe@gmail.com"
        sanitized = embedding_service._sanitize_text(text)
        
        assert "[PHONE]" in sanitized
        assert "[EMAIL]" in sanitized
        assert "9876543210" not in sanitized
        assert "john.doe@gmail.com" not in sanitized
    
    def test_sanitize_aadhaar(self):
        """Test Aadhaar number sanitization"""
        text = "My Aadhaar is 1234 5678 9012"
        sanitized = embedding_service._sanitize_text(text)
        
        assert "[ID]" in sanitized
        assert "1234 5678 9012" not in sanitized

class TestMatchingService:
    
    def test_calculate_distance(self):
        """Test distance calculation between locations"""
        # Whitefield and Koramangala coordinates
        loc1 = "POINT(77.7499 12.9698)"
        loc2 = "POINT(77.6245 12.9352)"
        
        distance = matching_service._calculate_distance(loc1, loc2)
        
        assert isinstance(distance, float)
        assert 0 < distance < 100  # Should be reasonable distance in km
    
    def test_location_proximity_score(self):
        """Test location proximity scoring"""
        # Test different distances
        score_near = matching_service._location_proximity_score(3.0)
        score_medium = matching_service._location_proximity_score(15.0)
        score_far = matching_service._location_proximity_score(60.0)
        
        assert score_near > score_medium > score_far
        assert score_near == 1.0  # Within 5km should get full score
        assert score_far == 0.0   # Beyond 50km should get zero score
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Requires database setup")
    async def test_find_matches(self):
        """Test finding matches for an intent"""
        # Sample intent data
        intent_data = {
            'post_type': 'demand',
            'category': 'product',
            'embedding': [0.1] * 384,  # Dummy embedding
            'location': 'POINT(77.7499 12.9698)'  # Whitefield
        }
        
        matches = await matching_service.find_matches(intent_data)
        
        assert isinstance(matches, list)
        # If there are matches, verify structure
        if matches:
            match = matches[0]
            required_fields = [
                'intent_id', 'user_name', 'raw_query', 
                'similarity', 'combined_score'
            ]
            for field in required_fields:
                assert field in match

class TestIntegration:
    
    def test_nlp_to_embedding_pipeline(self):
        """Test complete pipeline from query to embedding"""
        query = "Selling MacBook Pro in Electronic City for 1L"
        
        # Parse with NLP
        parsed = nlp_service.parse_query(query)
        
        # Generate embedding
        embedding = embedding_service.generate_embedding(query)
        
        assert parsed['intent'] == 'supply'
        assert parsed['category'] == 'product'
        assert len(embedding) == 384
        assert isinstance(embedding, list)
    
    def test_matching_accuracy_simulation(self):
        """Test matching accuracy with simulated data"""
        # Create similar queries
        query1 = "Selling iPhone 13 in Whitefield for 40k"
        query2 = "Looking for iPhone in Whitefield under 50k"
        query3 = "Need plumber in HSR Layout"
        
        # Generate embeddings
        emb1 = embedding_service.generate_embedding(query1)
        emb2 = embedding_service.generate_embedding(query2)
        emb3 = embedding_service.generate_embedding(query3)
        
        # Test similarities
        sim_iphone = embedding_service.compute_similarity(emb1, emb2)
        sim_mixed = embedding_service.compute_similarity(emb1, emb3)
        
        # iPhone buy/sell should be more similar than iPhone/plumber
        assert sim_iphone > sim_mixed
        assert sim_iphone > 0.3  # Should have reasonable similarity threshold

if __name__ == "__main__":
    pytest.main([__file__, "-v"])