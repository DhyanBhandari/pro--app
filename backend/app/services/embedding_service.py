import re
import hashlib
from typing import List
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("[EmbeddingService] Model loaded: all-MiniLM-L6-v2")
        except ImportError:
            print("[EmbeddingService] Warning: sentence-transformers not available, using fallback embeddings")
            self.model = None
        except Exception as e:
            print(f"[EmbeddingService] Error loading model: {e}, using fallback")
            self.model = None
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding with privacy protection"""
        if not self.model:
            # Fallback: simple hash-based embedding for testing
            return self._generate_fallback_embedding(text)
        
        # Sanitize PII
        clean_text = self._sanitize_text(text)
        
        # Generate embedding
        embedding = self.model.encode(clean_text)
        
        # Add differential privacy noise
        noise_scale = settings.EMBEDDING_NOISE_SCALE
        try:
            import numpy as np
            noise = np.random.laplace(0, noise_scale, embedding.shape)
            private_embedding = embedding + noise
            return private_embedding.tolist()
        except ImportError:
            # If numpy not available, return without noise
            return embedding.tolist()
    
    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """Generate a deterministic embedding based on text features"""
        # Sanitize text
        clean_text = self._sanitize_text(text)
        
        # Create a hash-based embedding
        text_hash = hashlib.md5(clean_text.encode()).hexdigest()
        
        # Convert hash to float values
        embedding = []
        for i in range(0, len(text_hash), 2):
            hex_val = text_hash[i:i+2]
            float_val = int(hex_val, 16) / 255.0  # Normalize to 0-1
            embedding.append(float_val)
        
        # Pad or truncate to 384 dimensions
        while len(embedding) < 384:
            embedding.extend(embedding[:min(384-len(embedding), len(embedding))])
        
        embedding = embedding[:384]
        
        # Add some text-based features
        word_count = len(clean_text.split())
        char_count = len(clean_text)
        
        # Modify first few dimensions based on text features
        if len(embedding) > 0:
            embedding[0] = word_count / 100.0  # Normalize word count
        if len(embedding) > 1:
            embedding[1] = char_count / 1000.0  # Normalize char count
        
        # Add some noise for similarity testing
        import random
        for i in range(2, min(10, len(embedding))):
            embedding[i] += random.uniform(-0.1, 0.1)
        
        return embedding
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embeddings"""
        try:
            import numpy as np
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except ImportError:
            # Fallback: simple dot product similarity
            if len(embedding1) != len(embedding2):
                return 0.0
            
            dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
            norm1 = sum(a * a for a in embedding1) ** 0.5
            norm2 = sum(b * b for b in embedding2) ** 0.5
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
    
    def _sanitize_text(self, text: str) -> str:
        """Remove PII from text before embedding"""
        # Remove phone numbers (10 digits)
        text = re.sub(r'\b\d{10}\b', '[PHONE]', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '[EMAIL]', text)
        
        # Remove Aadhaar-like numbers (12 digits)
        text = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[ID]', text)
        
        # Remove specific names (basic pattern)
        text = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[NAME]', text)
        
        # Remove credit card patterns
        text = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD]', text)
        
        return text

# Global instance
embedding_service = EmbeddingService()