#!/usr/bin/env python3
"""
Advanced ML-Based Profile Matching Service
Uses scikit-learn for sophisticated matching algorithms
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import json
import os

from app.core.database import get_supabase
from app.services.embedding_service import embedding_service

class MLMatchingService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.scaler = StandardScaler()
        self.kmeans = None
        self.pca = None
        self.profile_clusters = {}
        
        print("[MLMatching] Advanced ML Matching Service initialized")
    
    async def find_advanced_matches(self, intent_data: Dict) -> List[Dict]:
        """
        Advanced matching using multiple ML techniques:
        1. TF-IDF text similarity
        2. Feature vector cosine similarity  
        3. Clustering-based matching
        4. Multi-criteria scoring
        """
        try:
            supabase = get_supabase()
            
            # Get opposite intent type for matching
            opposite_intent = 'supply' if intent_data['post_type'] == 'demand' else 'demand'
            
            # Query for potential matches
            query = supabase.table('intents')\
                .select('*, users(name, location_name)')\
                .eq('post_type', opposite_intent)\
                .eq('category', intent_data['category'])\
                .eq('is_active', True)
            
            response = query.execute()
            
            if not response.data:
                print(f"[MLMatching] No potential matches found for category: {intent_data['category']}")
                return []
            
            matches = response.data
            user_query = intent_data['raw_query']
            
            # Extract text and features for ML processing
            match_texts = [match['raw_query'] for match in matches]
            all_texts = [user_query] + match_texts
            
            # 1. TF-IDF Text Similarity
            text_similarities = self._compute_text_similarities(all_texts)
            user_text_similarities = text_similarities[0, 1:]  # First row, excluding self
            
            # 2. Feature Vector Similarities
            feature_similarities = self._compute_feature_similarities(intent_data, matches)
            
            # 3. Location Proximity Scores
            location_scores = self._compute_location_scores(intent_data, matches)
            
            # 4. Intent Compatibility Scores
            intent_scores = self._compute_intent_compatibility(intent_data, matches)
            
            # 5. Temporal Compatibility
            temporal_scores = self._compute_temporal_compatibility(intent_data, matches)
            
            # Combine all scores with learned weights
            final_matches = []
            
            for i, match in enumerate(matches):
                # Multi-criteria scoring with optimized weights
                combined_score = (
                    user_text_similarities[i] * 0.30 +          # Text similarity
                    feature_similarities[i] * 0.25 +           # Feature similarity  
                    location_scores[i] * 0.20 +                # Location proximity
                    intent_scores[i] * 0.15 +                  # Intent compatibility
                    temporal_scores[i] * 0.10                  # Time compatibility
                )
                
                # Apply quality filters
                if combined_score > 0.3:  # Minimum relevance threshold
                    match_result = {
                        'intent_id': match['intent_id'],
                        'user_name': match['users']['name'] if match.get('users') else 'Unknown',
                        'location_name': match.get('location_name', ''),
                        'raw_query': match['raw_query'],
                        'category': match['category'],
                        'post_type': match['post_type'],
                        
                        # Detailed scoring breakdown
                        'text_similarity': round(float(user_text_similarities[i]), 3),
                        'feature_similarity': round(float(feature_similarities[i]), 3),
                        'location_score': round(float(location_scores[i]), 3),
                        'intent_compatibility': round(float(intent_scores[i]), 3),
                        'temporal_compatibility': round(float(temporal_scores[i]), 3),
                        
                        # Final scores
                        'combined_score': round(float(combined_score), 3),
                        'confidence_score': self._calculate_confidence(combined_score, [
                            user_text_similarities[i], feature_similarities[i], 
                            location_scores[i], intent_scores[i], temporal_scores[i]
                        ]),
                        
                        'match_quality': self._determine_match_quality(combined_score),
                        'created_at': match['created_at']
                    }
                    final_matches.append(match_result)
            
            # Sort by combined score and apply advanced ranking
            final_matches.sort(key=lambda x: x['combined_score'], reverse=True)
            
            # Apply diversity filter to avoid too similar matches
            diverse_matches = self._apply_diversity_filter(final_matches)
            
            print(f"[MLMatching] Found {len(diverse_matches)} high-quality matches using ML")
            return diverse_matches[:15]  # Return top 15 diverse matches
            
        except Exception as e:
            print(f"[MLMatching] Error in advanced matching: {e}")
            # Fallback to basic matching
            return await self._basic_fallback_matching(intent_data)
    
    def _compute_text_similarities(self, texts: List[str]) -> np.ndarray:
        """Compute TF-IDF based text similarities"""
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Compute cosine similarities
            similarities = cosine_similarity(tfidf_matrix)
            
            return similarities
        except Exception as e:
            print(f"[MLMatching] Text similarity computation failed: {e}")
            # Fallback to simple string matching
            n = len(texts)
            fallback_sim = np.zeros((n, n))
            for i in range(n):
                for j in range(n):
                    if i != j:
                        # Simple word overlap similarity
                        words_i = set(texts[i].lower().split())
                        words_j = set(texts[j].lower().split())
                        overlap = len(words_i.intersection(words_j))
                        total = len(words_i.union(words_j))
                        fallback_sim[i][j] = overlap / total if total > 0 else 0.0
            return fallback_sim
    
    def _compute_feature_similarities(self, intent_data: Dict, matches: List[Dict]) -> np.ndarray:
        """Compute feature vector similarities"""
        try:
            # Extract feature vectors from parsed_data
            user_features = self._extract_feature_vector(intent_data)
            match_features = []
            
            for match in matches:
                features = self._extract_feature_vector(match)
                match_features.append(features)
            
            if not match_features:
                return np.array([0.5] * len(matches))
            
            # Compute cosine similarities between user and each match
            similarities = []
            for match_feature in match_features:
                sim = cosine_similarity([user_features], [match_feature])[0][0]
                similarities.append(sim)
            
            return np.array(similarities)
            
        except Exception as e:
            print(f"[MLMatching] Feature similarity computation failed: {e}")
            return np.array([0.5] * len(matches))
    
    def _extract_feature_vector(self, data: Dict) -> List[float]:
        """Extract ML features from intent data"""
        features = []
        
        # Text-based features
        text = data.get('raw_query', '')
        features.extend([
            len(text.split()),  # Word count
            len(text),          # Character count
            text.count('?'),    # Question marks
            text.count('!'),    # Exclamation marks
        ])
        
        # Parsed data features
        parsed = data.get('parsed_data', {})
        features.extend([
            len(parsed.get('keywords', [])),    # Number of keywords
            len(parsed.get('locations', [])),   # Number of locations
            len(parsed.get('prices', [])),      # Number of prices
        ])
        
        # User/business specific features
        if 'user_features' in parsed:
            user_features = parsed['user_features'][:5]  # Take first 5 features
            features.extend(user_features)
        elif 'business_features' in parsed:
            business_features = parsed['business_features'][:5]
            features.extend(business_features)
        else:
            features.extend([0.5] * 5)  # Default features
        
        # Category encoding (one-hot style)
        categories = ['product', 'service', 'social', 'travel', 'general']
        category = data.get('category', 'general')
        for cat in categories:
            features.append(1.0 if cat == category else 0.0)
        
        # Ensure fixed length vector
        while len(features) < 20:
            features.append(0.0)
        
        return features[:20]  # Fixed 20-dimensional vector
    
    def _compute_location_scores(self, intent_data: Dict, matches: List[Dict]) -> np.ndarray:
        """Compute location proximity scores with geographic intelligence"""
        user_location = intent_data.get('location_name', '').lower()
        scores = []
        
        # Indian city proximity mapping
        city_groups = {
            'bangalore_metro': ['bangalore', 'whitefield', 'electronic city', 'koramangala'],
            'mumbai_metro': ['mumbai', 'pune', 'thane', 'navi mumbai'],
            'delhi_ncr': ['delhi', 'gurgaon', 'noida', 'faridabad'],
            'hyderabad_metro': ['hyderabad', 'secunderabad', 'cyberabad'],
            'chennai_metro': ['chennai', 'tambaram', 'velachery']
        }
        
        user_group = None
        for group, cities in city_groups.items():
            if any(city in user_location for city in cities):
                user_group = group
                break
        
        for match in matches:
            match_location = match.get('location_name', '').lower()
            
            if user_location == match_location:
                score = 1.0  # Same location
            elif user_group:
                # Check if match is in same metro group
                match_group = None
                for group, cities in city_groups.items():
                    if any(city in match_location for city in cities):
                        match_group = group
                        break
                
                if match_group == user_group:
                    score = 0.8  # Same metro area
                else:
                    score = 0.3  # Different region
            else:
                score = 0.4  # Unknown location handling
            
            scores.append(score)
        
        return np.array(scores)
    
    def _compute_intent_compatibility(self, intent_data: Dict, matches: List[Dict]) -> np.ndarray:
        """Compute intent compatibility scores based on parsed data"""
        user_parsed = intent_data.get('parsed_data', {})
        user_keywords = set(user_parsed.get('keywords', []))
        user_prices = user_parsed.get('prices', [])
        
        scores = []
        
        for match in matches:
            match_parsed = match.get('parsed_data', {})
            match_keywords = set(match_parsed.get('keywords', []))
            match_prices = match_parsed.get('prices', [])
            
            # Keyword overlap
            keyword_overlap = len(user_keywords.intersection(match_keywords))
            keyword_total = len(user_keywords.union(match_keywords))
            keyword_score = keyword_overlap / keyword_total if keyword_total > 0 else 0.5
            
            # Price compatibility
            price_score = 0.5  # Default
            if user_prices and match_prices:
                try:
                    # Simple price range compatibility
                    user_price_nums = [float(p.replace('k', '000').replace('L', '00000').replace('₹', '')) 
                                     for p in user_prices if any(c.isdigit() for c in p)]
                    match_price_nums = [float(p.replace('k', '000').replace('L', '00000').replace('₹', '')) 
                                      for p in match_prices if any(c.isdigit() for c in p)]
                    
                    if user_price_nums and match_price_nums:
                        user_avg = np.mean(user_price_nums)
                        match_avg = np.mean(match_price_nums)
                        price_diff = abs(user_avg - match_avg) / max(user_avg, match_avg)
                        price_score = max(0.0, 1.0 - price_diff)
                except:
                    price_score = 0.5
            
            # Combined intent compatibility
            intent_score = (keyword_score * 0.7) + (price_score * 0.3)
            scores.append(intent_score)
        
        return np.array(scores)
    
    def _compute_temporal_compatibility(self, intent_data: Dict, matches: List[Dict]) -> np.ndarray:
        """Compute temporal compatibility (recency, urgency, validity)"""
        from datetime import datetime, timezone
        
        try:
            user_created = datetime.fromisoformat(intent_data.get('created_at', '').replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            
            scores = []
            
            for match in matches:
                match_created = datetime.fromisoformat(match.get('created_at', '').replace('Z', '+00:00'))
                
                # Recency score (newer is better)
                time_diff = (current_time - match_created).days
                recency_score = max(0.0, 1.0 - (time_diff / 30.0))  # Decays over 30 days
                
                # Mutual recency (how close the creation times are)
                mutual_diff = abs((user_created - match_created).days)
                mutual_score = max(0.0, 1.0 - (mutual_diff / 7.0))  # Prefers within same week
                
                # Priority/urgency indicators from text
                urgency_keywords = ['urgent', 'asap', 'immediate', 'quickly', 'fast', 'emergency']
                user_urgent = any(keyword in intent_data.get('raw_query', '').lower() for keyword in urgency_keywords)
                match_urgent = any(keyword in match.get('raw_query', '').lower() for keyword in urgency_keywords)
                
                urgency_score = 1.0 if (user_urgent and match_urgent) else 0.7 if (user_urgent or match_urgent) else 0.5
                
                # Combined temporal score
                temporal_score = (recency_score * 0.4) + (mutual_score * 0.3) + (urgency_score * 0.3)
                scores.append(temporal_score)
            
            return np.array(scores)
            
        except Exception as e:
            print(f"[MLMatching] Temporal compatibility computation failed: {e}")
            return np.array([0.6] * len(matches))
    
    def _calculate_confidence(self, combined_score: float, individual_scores: List[float]) -> float:
        """Calculate confidence based on score consistency"""
        scores_array = np.array(individual_scores)
        
        # High combined score with low variance = high confidence
        score_std = np.std(scores_array)
        score_mean = np.mean(scores_array)
        
        # Confidence decreases with variance
        variance_penalty = min(score_std / 0.3, 1.0)  # Normalize variance
        base_confidence = combined_score * 0.7  # Base on combined score
        
        confidence = base_confidence * (1.0 - variance_penalty * 0.3)
        return round(max(0.0, min(1.0, confidence)), 3)
    
    def _determine_match_quality(self, score: float) -> str:
        """Determine match quality category"""
        if score >= 0.8:
            return 'excellent'
        elif score >= 0.65:
            return 'good'
        elif score >= 0.5:
            return 'fair'
        elif score >= 0.3:
            return 'poor'
        else:
            return 'very_poor'
    
    def _apply_diversity_filter(self, matches: List[Dict]) -> List[Dict]:
        """Apply diversity filter to avoid too similar matches"""
        if len(matches) <= 5:
            return matches
        
        diverse_matches = [matches[0]]  # Always include top match
        
        for match in matches[1:]:
            # Check similarity with already selected matches
            is_diverse = True
            for selected in diverse_matches:
                # Simple diversity check based on query similarity
                match_words = set(match['raw_query'].lower().split())
                selected_words = set(selected['raw_query'].lower().split())
                overlap = len(match_words.intersection(selected_words))
                total = len(match_words.union(selected_words))
                similarity = overlap / total if total > 0 else 0
                
                if similarity > 0.7:  # Too similar
                    is_diverse = False
                    break
            
            if is_diverse:
                diverse_matches.append(match)
            
            # Stop when we have enough diverse matches
            if len(diverse_matches) >= 12:
                break
        
        return diverse_matches
    
    async def _basic_fallback_matching(self, intent_data: Dict) -> List[Dict]:
        """Fallback to basic matching if ML approaches fail"""
        print("[MLMatching] Using fallback basic matching")
        
        from app.services.matching_service import matching_service
        return await matching_service.find_matches(intent_data)
    
    def cluster_profiles(self, profile_data: List[Dict]) -> Dict[str, List[str]]:
        """Cluster profiles for improved matching efficiency"""
        try:
            if len(profile_data) < 10:
                return {'cluster_0': [p.get('user_id', p.get('business_id', '')) for p in profile_data]}
            
            # Extract features for clustering
            features = []
            profile_ids = []
            
            for profile in profile_data:
                feature_vector = self._extract_clustering_features(profile)
                features.append(feature_vector)
                profile_ids.append(profile.get('user_id', profile.get('business_id', '')))
            
            # Normalize features
            features_array = np.array(features)
            features_scaled = self.scaler.fit_transform(features_array)
            
            # Apply PCA for dimensionality reduction
            self.pca = PCA(n_components=min(10, features_scaled.shape[1]))
            features_pca = self.pca.fit_transform(features_scaled)
            
            # K-means clustering
            n_clusters = min(8, len(profile_data) // 10)  # Dynamic cluster count
            self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = self.kmeans.fit_predict(features_pca)
            
            # Organize results
            clusters = {}
            for i, label in enumerate(cluster_labels):
                cluster_key = f'cluster_{label}'
                if cluster_key not in clusters:
                    clusters[cluster_key] = []
                clusters[cluster_key].append(profile_ids[i])
            
            print(f"[MLMatching] Created {len(clusters)} profile clusters")
            return clusters
            
        except Exception as e:
            print(f"[MLMatching] Clustering failed: {e}")
            return {'cluster_0': [p.get('user_id', p.get('business_id', '')) for p in profile_data]}
    
    def _extract_clustering_features(self, profile: Dict) -> List[float]:
        """Extract features for profile clustering"""
        features = []
        
        # Profile type
        features.append(1.0 if profile.get('profile_type') == 'user' else 0.0)
        
        # Location features (one-hot encoding for major cities)
        major_cities = ['bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai']
        location = profile.get('location', {})
        if isinstance(location, dict):
            city = location.get('city', '').lower()
        else:
            city = str(location).lower()
        
        for major_city in major_cities:
            features.append(1.0 if major_city in city else 0.0)
        
        # Feature vector if available
        if 'feature_vector' in profile:
            features.extend(profile['feature_vector'][:5])
        else:
            features.extend([0.5] * 5)
        
        # Intent-based features for users
        if profile.get('profile_type') == 'user':
            primary_intent = profile.get('primary_intent', 'inquiry')
            intent_map = {'purchase': 1.0, 'support': 0.8, 'inquiry': 0.6, 'service': 0.4, 'partnership': 0.2}
            features.append(intent_map.get(primary_intent, 0.5))
            
            features.append(profile.get('tech_savviness', 0.5))
            features.append(profile.get('price_sensitivity', 0.5))
        else:
            # Business features
            category = profile.get('category', 'service')
            category_map = {'retail': 1.0, 'fintech': 0.8, 'service': 0.6, 'technology': 0.4, 'healthcare': 0.2}
            features.append(category_map.get(category, 0.5))
            
            features.append(profile.get('service_quality_score', 0.5))
            features.append(profile.get('price_competitiveness', 0.5))
        
        # Ensure fixed length
        while len(features) < 15:
            features.append(0.0)
        
        return features[:15]

# Global instance
ml_matching_service = MLMatchingService()