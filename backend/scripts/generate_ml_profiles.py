#!/usr/bin/env python3
"""
Advanced ML Profile Generator
Generates 3500-4000 diverse user and business profiles with ML-ready features
"""

import os
import sys
import uuid
import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from faker import Faker
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase
from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service

# Initialize faker with multiple locales for diversity
fake_en = Faker('en_US')
fake_in = Faker('en_IN')
fake_uk = Faker('en_GB')

class MLProfileGenerator:
    def __init__(self):
        self.intent_categories = {
            'purchase': {
                'weight': 0.35,
                'subcategories': ['electronics', 'clothing', 'home', 'automotive', 'books', 'health', 'sports']
            },
            'support': {
                'weight': 0.25, 
                'subcategories': ['technical', 'billing', 'account', 'product', 'warranty', 'installation']
            },
            'inquiry': {
                'weight': 0.20,
                'subcategories': ['pricing', 'availability', 'features', 'compatibility', 'shipping']
            },
            'service': {
                'weight': 0.15,
                'subcategories': ['repair', 'maintenance', 'consultation', 'customization', 'training']
            },
            'partnership': {
                'weight': 0.05,
                'subcategories': ['collaboration', 'wholesale', 'distribution', 'affiliate', 'sponsorship']
            }
        }
        
        self.business_categories = {
            'retail': {
                'weight': 0.30,
                'types': ['ecommerce', 'physical_store', 'marketplace', 'boutique']
            },
            'fintech': {
                'weight': 0.20,
                'types': ['payments', 'lending', 'insurance', 'investing', 'banking']
            },
            'service': {
                'weight': 0.25,
                'types': ['consulting', 'repair', 'maintenance', 'delivery', 'cleaning']
            },
            'technology': {
                'weight': 0.15,
                'types': ['software', 'hardware', 'cloud', 'security', 'ai']
            },
            'healthcare': {
                'weight': 0.10,
                'types': ['clinic', 'pharmacy', 'telemedicine', 'wellness', 'equipment']
            }
        }
        
        # Indian cities with realistic demographics
        self.locations = [
            {'city': 'Bangalore', 'region': 'South', 'tier': 1, 'tech_hub': True},
            {'city': 'Mumbai', 'region': 'West', 'tier': 1, 'tech_hub': False},
            {'city': 'Delhi', 'region': 'North', 'tier': 1, 'tech_hub': False},
            {'city': 'Hyderabad', 'region': 'South', 'tier': 1, 'tech_hub': True},
            {'city': 'Chennai', 'region': 'South', 'tier': 1, 'tech_hub': True},
            {'city': 'Pune', 'region': 'West', 'tier': 1, 'tech_hub': True},
            {'city': 'Kolkata', 'region': 'East', 'tier': 1, 'tech_hub': False},
            {'city': 'Ahmedabad', 'region': 'West', 'tier': 2, 'tech_hub': False},
            {'city': 'Jaipur', 'region': 'North', 'tier': 2, 'tech_hub': False},
            {'city': 'Surat', 'region': 'West', 'tier': 2, 'tech_hub': False}
        ]
        
    def generate_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Generate a realistic user profile with ML features"""
        # Choose faker based on randomization
        faker = random.choice([fake_en, fake_in, fake_uk])
        
        # Demographics
        age = random.randint(18, 65)
        income_bracket = self._determine_income_bracket(age)
        location = random.choice(self.locations)
        
        # Professional profile
        job_title = faker.job()
        company_type = random.choice(['startup', 'corporate', 'sme', 'freelance', 'student'])
        experience_years = max(0, age - 22) if company_type != 'student' else 0
        
        # Behavioral features
        online_activity_score = random.uniform(0.2, 1.0)
        price_sensitivity = random.uniform(0.1, 0.9)
        brand_loyalty = random.uniform(0.2, 0.8)
        tech_savviness = random.uniform(0.3, 1.0) if location['tech_hub'] else random.uniform(0.1, 0.7)
        
        # Generate interests based on demographics
        interests = self._generate_interests(age, job_title, tech_savviness)
        
        # Purchase history simulation
        purchase_categories = self._generate_purchase_history(income_bracket, interests)
        
        # Generate intent for this user
        primary_intent = self._select_weighted_intent()
        intent_strength = random.uniform(0.5, 1.0)
        
        return {
            'user_id': user_id,
            'profile_type': 'user',
            'name': faker.name(),
            'email': faker.email(),
            'phone': fake_in.phone_number(),
            
            # Demographics
            'age': age,
            'location': location,
            'income_bracket': income_bracket,
            
            # Professional
            'job_title': job_title,
            'company_type': company_type,
            'experience_years': experience_years,
            
            # Behavioral ML features
            'online_activity_score': online_activity_score,
            'price_sensitivity': price_sensitivity,
            'brand_loyalty': brand_loyalty,
            'tech_savviness': tech_savviness,
            
            # Interests and preferences
            'interests': interests,
            'purchase_categories': purchase_categories,
            
            # Intent features
            'primary_intent': primary_intent,
            'intent_strength': intent_strength,
            'secondary_intents': self._generate_secondary_intents(primary_intent),
            
            # Engagement features
            'engagement_score': random.uniform(0.3, 1.0),
            'response_time_preference': random.choice(['immediate', 'within_hour', 'within_day', 'flexible']),
            'communication_channel': random.choice(['email', 'phone', 'chat', 'social']),
            
            # Temporal features
            'active_hours': self._generate_active_hours(),
            'preferred_days': random.sample(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], k=random.randint(3, 7)),
            
            # ML-ready feature vector
            'feature_vector': self._create_feature_vector({
                'age': age,
                'income': income_bracket,
                'online_activity': online_activity_score,
                'price_sensitivity': price_sensitivity,
                'tech_savviness': tech_savviness,
                'intent_strength': intent_strength
            }),
            
            'created_at': datetime.utcnow().isoformat()
        }
    
    def generate_business_profile(self, business_id: str) -> Dict[str, Any]:
        """Generate a realistic business profile with ML features"""
        faker = random.choice([fake_en, fake_in])
        
        # Business basics
        business_category = self._select_weighted_business_category()
        business_size = random.choice(['solo', 'small', 'medium', 'large', 'enterprise'])
        location = random.choice(self.locations)
        
        # Business characteristics
        established_years = random.randint(1, 25)
        revenue_bracket = self._determine_business_revenue(business_size, established_years)
        
        # Service/product offering
        offerings = self._generate_business_offerings(business_category)
        target_segments = self._generate_target_segments(business_category)
        
        # ML features for business matching
        service_quality_score = random.uniform(0.6, 1.0)
        price_competitiveness = random.uniform(0.3, 0.9)
        response_speed = random.uniform(0.4, 1.0)
        customer_satisfaction = random.uniform(0.5, 1.0)
        
        # Generate business intent
        business_intent = random.choice(['acquire_customers', 'expand_services', 'partnership', 'support_existing'])
        
        return {
            'business_id': business_id,
            'profile_type': 'business',
            'name': faker.company(),
            'description': faker.catch_phrase(),
            'email': faker.company_email(),
            'phone': fake_in.phone_number(),
            
            # Business characteristics
            'category': business_category,
            'business_size': business_size,
            'location': location,
            'established_years': established_years,
            'revenue_bracket': revenue_bracket,
            
            # Service features
            'offerings': offerings,
            'target_segments': target_segments,
            'service_areas': self._generate_service_areas(location),
            
            # Performance ML features
            'service_quality_score': service_quality_score,
            'price_competitiveness': price_competitiveness,
            'response_speed': response_speed,
            'customer_satisfaction': customer_satisfaction,
            
            # Capacity features
            'capacity_utilization': random.uniform(0.4, 0.9),
            'scalability': random.uniform(0.3, 1.0),
            'availability_score': random.uniform(0.6, 1.0),
            
            # Intent and goals
            'business_intent': business_intent,
            'growth_stage': random.choice(['startup', 'growth', 'mature', 'expansion']),
            'target_customer_types': self._generate_target_customer_types(),
            
            # Operational features
            'operating_hours': self._generate_business_hours(),
            'response_time_avg': random.uniform(0.5, 24.0),  # hours
            'support_channels': random.sample(['phone', 'email', 'chat', 'in_person'], k=random.randint(2, 4)),
            
            # ML-ready feature vector
            'feature_vector': self._create_feature_vector({
                'established_years': established_years,
                'service_quality': service_quality_score,
                'price_competitiveness': price_competitiveness,
                'response_speed': response_speed,
                'customer_satisfaction': customer_satisfaction
            }),
            
            'created_at': datetime.utcnow().isoformat()
        }
    
    def generate_intent_records(self, profiles: List[Dict]) -> List[Dict]:
        """Generate intent records for matching"""
        intents = []
        
        for profile in profiles:
            # Generate 1-3 intents per profile
            num_intents = random.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
            
            for _ in range(num_intents):
                intent = self._generate_intent_from_profile(profile)
                intents.append(intent)
        
        return intents
    
    def _generate_intent_from_profile(self, profile: Dict) -> Dict:
        """Generate a realistic intent based on profile"""
        profile_type = profile['profile_type']
        
        if profile_type == 'user':
            return self._generate_user_intent(profile)
        else:
            return self._generate_business_intent(profile)
    
    def _generate_user_intent(self, profile: Dict) -> Dict:
        """Generate user intent with natural language query"""
        intent_type = profile['primary_intent']
        location = profile['location']['city']
        interests = profile['interests']
        
        # Generate natural language queries based on intent
        queries = {
            'purchase': [
                f"Looking to buy {random.choice(interests)} in {location}",
                f"Need {random.choice(['high quality', 'affordable', 'premium'])} {random.choice(interests)}",
                f"Want to purchase {random.choice(interests)} with good reviews"
            ],
            'support': [
                f"Need help with my {random.choice(interests)} issue",
                f"Looking for technical support for {random.choice(interests)}",
                f"Require assistance with {random.choice(interests)} setup"
            ],
            'inquiry': [
                f"What are the options for {random.choice(interests)} in {location}?",
                f"Can you tell me more about {random.choice(interests)} features?",
                f"Looking for information about {random.choice(interests)} pricing"
            ],
            'service': [
                f"Need {random.choice(['repair', 'maintenance', 'consultation'])} for {random.choice(interests)}",
                f"Looking for professional {random.choice(interests)} service",
                f"Require expert help with {random.choice(interests)}"
            ]
        }
        
        raw_query = random.choice(queries.get(intent_type, queries['inquiry']))
        parsed_data = nlp_service.parse_query(raw_query)
        embedding = embedding_service.generate_embedding(raw_query)
        
        return {
            'intent_id': str(uuid.uuid4()),
            'user_id': profile['user_id'],
            'post_type': 'demand',
            'category': random.choice(list(self.intent_categories.keys())),
            'raw_query': raw_query,
            'parsed_data': {
                **parsed_data,
                'embedding': embedding,
                'user_features': profile['feature_vector']
            },
            'location_name': location,
            'is_active': True,
            'priority_score': profile['intent_strength'],
            'created_at': datetime.utcnow().isoformat(),
            'valid_until': (datetime.utcnow() + timedelta(days=random.randint(7, 60))).isoformat()
        }
    
    def _generate_business_intent(self, profile: Dict) -> Dict:
        """Generate business intent (supply side)"""
        offerings = profile['offerings']
        location = profile['location']['city']
        
        # Business supply queries
        service_type = random.choice(offerings)
        queries = [
            f"Offering professional {service_type} services in {location}",
            f"High quality {service_type} available in {location}",
            f"Expert {service_type} service provider in {location}",
            f"Reliable {service_type} solutions in {location}"
        ]
        
        raw_query = random.choice(queries)
        parsed_data = nlp_service.parse_query(raw_query)
        embedding = embedding_service.generate_embedding(raw_query)
        
        return {
            'intent_id': str(uuid.uuid4()),
            'user_id': profile['business_id'],
            'post_type': 'supply',
            'category': profile['category'],
            'raw_query': raw_query,
            'parsed_data': {
                **parsed_data,
                'embedding': embedding,
                'business_features': profile['feature_vector']
            },
            'location_name': location,
            'is_active': True,
            'priority_score': profile.get('service_quality_score', 0.8),
            'created_at': datetime.utcnow().isoformat(),
            'valid_until': (datetime.utcnow() + timedelta(days=random.randint(30, 90))).isoformat()
        }
    
    # Helper methods
    def _determine_income_bracket(self, age: int) -> str:
        """Determine income bracket based on age"""
        if age < 25:
            return random.choice(['low', 'lower_middle'])
        elif age < 35:
            return random.choice(['lower_middle', 'middle', 'upper_middle'])
        elif age < 50:
            return random.choice(['middle', 'upper_middle', 'high'])
        else:
            return random.choice(['upper_middle', 'high'])
    
    def _generate_interests(self, age: int, job_title: str, tech_savviness: float) -> List[str]:
        """Generate interests based on demographics"""
        base_interests = ['technology', 'travel', 'food', 'fitness', 'entertainment']
        
        if tech_savviness > 0.7:
            base_interests.extend(['gadgets', 'software', 'gaming', 'ai'])
        
        if age < 30:
            base_interests.extend(['social_media', 'fashion', 'music'])
        elif age > 40:
            base_interests.extend(['home', 'family', 'investment'])
        
        # Job-based interests
        if 'engineer' in job_title.lower() or 'developer' in job_title.lower():
            base_interests.extend(['programming', 'hardware', 'innovation'])
        elif 'manager' in job_title.lower():
            base_interests.extend(['leadership', 'business', 'networking'])
        
        return random.sample(base_interests, k=min(random.randint(5, 10), len(base_interests)))
    
    def _generate_purchase_history(self, income_bracket: str, interests: List[str]) -> List[str]:
        """Generate purchase categories based on income and interests"""
        categories = []
        
        # Base categories by income
        income_mapping = {
            'low': ['essential', 'discount'],
            'lower_middle': ['essential', 'electronics', 'clothing'],
            'middle': ['electronics', 'home', 'travel', 'clothing'],
            'upper_middle': ['premium', 'travel', 'electronics', 'luxury'],
            'high': ['luxury', 'premium', 'travel', 'investment']
        }
        
        categories.extend(income_mapping.get(income_bracket, ['essential']))
        
        # Add interest-based categories
        interest_mapping = {
            'technology': 'electronics',
            'travel': 'travel',
            'fitness': 'sports',
            'food': 'dining',
            'fashion': 'clothing'
        }
        
        for interest in interests:
            if interest in interest_mapping:
                categories.append(interest_mapping[interest])
        
        return list(set(categories))
    
    def _select_weighted_intent(self) -> str:
        """Select intent based on weights"""
        intents = list(self.intent_categories.keys())
        weights = [self.intent_categories[intent]['weight'] for intent in intents]
        return random.choices(intents, weights=weights)[0]
    
    def _select_weighted_business_category(self) -> str:
        """Select business category based on weights"""
        categories = list(self.business_categories.keys())
        weights = [self.business_categories[cat]['weight'] for cat in categories]
        return random.choices(categories, weights=weights)[0]
    
    def _generate_secondary_intents(self, primary: str) -> List[str]:
        """Generate secondary intents"""
        all_intents = list(self.intent_categories.keys())
        all_intents.remove(primary)
        return random.sample(all_intents, k=min(random.randint(1, 3), len(all_intents)))
    
    def _create_feature_vector(self, features: Dict) -> List[float]:
        """Create ML-ready feature vector"""
        # Normalize features to 0-1 range
        vector = []
        for key, value in features.items():
            if isinstance(value, (int, float)):
                if key == 'age':
                    vector.append(value / 100.0)  # Normalize age
                elif key == 'established_years':
                    vector.append(value / 50.0)  # Normalize years
                else:
                    vector.append(float(value))
            else:
                vector.append(0.5)  # Default for non-numeric
        
        # Pad to fixed length
        while len(vector) < 10:
            vector.append(0.0)
        
        return vector[:10]  # Fixed 10-dimensional vector
    
    def _determine_business_revenue(self, size: str, years: int) -> str:
        """Determine business revenue bracket"""
        size_mapping = {
            'solo': 'micro',
            'small': 'small',
            'medium': 'medium',
            'large': 'large',
            'enterprise': 'enterprise'
        }
        return size_mapping.get(size, 'small')
    
    def _generate_business_offerings(self, category: str) -> List[str]:
        """Generate business offerings based on category"""
        offerings_map = {
            'retail': ['products', 'accessories', 'consultation', 'delivery'],
            'fintech': ['payments', 'loans', 'insurance', 'investment'],
            'service': ['repair', 'maintenance', 'consultation', 'support'],
            'technology': ['software', 'hardware', 'cloud', 'security'],
            'healthcare': ['treatment', 'diagnosis', 'wellness', 'equipment']
        }
        
        base_offerings = offerings_map.get(category, ['service'])
        return random.sample(base_offerings, k=min(random.randint(2, len(base_offerings)), len(base_offerings)))
    
    def _generate_target_segments(self, category: str) -> List[str]:
        """Generate target customer segments"""
        segments = ['individuals', 'small_business', 'enterprise', 'government', 'startups']
        return random.sample(segments, k=min(random.randint(2, 4), len(segments)))
    
    def _generate_service_areas(self, location: Dict) -> List[str]:
        """Generate service areas based on location"""
        city = location['city']
        return [city, f"{city}_metro", location['region']]
    
    def _generate_target_customer_types(self) -> List[str]:
        """Generate target customer types"""
        types = ['price_sensitive', 'quality_focused', 'convenience_seeking', 'tech_savvy', 'traditional']
        return random.sample(types, k=min(random.randint(2, 4), len(types)))
    
    def _generate_active_hours(self) -> Dict:
        """Generate active hours for users"""
        return {
            'start': random.randint(6, 10),
            'end': random.randint(18, 23),
            'timezone': 'IST'
        }
    
    def _generate_business_hours(self) -> Dict:
        """Generate business operating hours"""
        return {
            'start': random.randint(8, 10),
            'end': random.randint(17, 21),
            'days': random.sample(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], 
                                k=random.randint(5, 7)),
            'timezone': 'IST'
        }

def main():
    """Generate comprehensive profile dataset"""
    print("Starting ML Profile Generation...")
    
    generator = MLProfileGenerator()
    
    # Generate targets
    target_users = 2500  # Users
    target_businesses = 1500  # Businesses
    total_profiles = target_users + target_businesses
    
    print(f"Target: {total_profiles} profiles ({target_users} users + {target_businesses} businesses)")
    
    # Generate user profiles
    print("Generating user profiles...")
    user_profiles = []
    for i in range(target_users):
        user_id = str(uuid.uuid4())
        profile = generator.generate_user_profile(user_id)
        user_profiles.append(profile)
        
        if (i + 1) % 500 == 0:
            print(f"Generated {i + 1} user profiles...")
    
    # Generate business profiles
    print("Generating business profiles...")
    business_profiles = []
    for i in range(target_businesses):
        business_id = str(uuid.uuid4())
        profile = generator.generate_business_profile(business_id)
        business_profiles.append(profile)
        
        if (i + 1) % 250 == 0:
            print(f"Generated {i + 1} business profiles...")
    
    all_profiles = user_profiles + business_profiles
    
    # Generate intent records
    print("Generating intent records...")
    intent_records = generator.generate_intent_records(all_profiles)
    
    print(f"Generated {len(intent_records)} intent records")
    
    # Save to files for analysis
    profiles_df = pd.DataFrame(all_profiles)
    intents_df = pd.DataFrame(intent_records)
    
    profiles_df.to_json('generated_profiles.json', orient='records', indent=2)
    intents_df.to_json('generated_intents.json', orient='records', indent=2)
    
    print("Profile generation complete!")
    print("Statistics:")
    print(f"  - Total profiles: {len(all_profiles)}")
    print(f"  - User profiles: {len(user_profiles)}")
    print(f"  - Business profiles: {len(business_profiles)}")
    print(f"  - Intent records: {len(intent_records)}")
    print(f"  - Files saved: generated_profiles.json, generated_intents.json")
    
    # Upload to Supabase if available
    try:
        print("Uploading to database...")
        upload_to_database(user_profiles, business_profiles, intent_records)
    except Exception as e:
        print(f"Database upload failed: {e}")
        print("Profiles saved locally for manual upload")

def upload_to_database(user_profiles: List[Dict], business_profiles: List[Dict], intent_records: List[Dict]):
    """Upload generated profiles to Supabase"""
    supabase = get_supabase()
    
    # Prepare user records for database
    user_records = []
    for profile in user_profiles:
        user_record = {
            'user_id': profile['user_id'],
            'name': profile['name'],
            'email': profile['email'],
            'phone': profile['phone'],
            'interests': profile['interests'],
            'location_name': profile['location']['city'],
            'bio': f"Age: {profile['age']}, Job: {profile['job_title']}",
            'created_at': profile['created_at']
        }
        user_records.append(user_record)
    
    # Add business profiles as users (with business flag in bio)
    for profile in business_profiles:
        user_record = {
            'user_id': profile['business_id'],
            'name': profile['name'],
            'email': profile['email'],
            'phone': profile['phone'],
            'interests': profile['offerings'],
            'location_name': profile['location']['city'],
            'bio': f"Business: {profile['category']}, Size: {profile['business_size']}",
            'created_at': profile['created_at']
        }
        user_records.append(user_record)
    
    # Upload users in batches
    batch_size = 100
    for i in range(0, len(user_records), batch_size):
        batch = user_records[i:i + batch_size]
        response = supabase.table('users').insert(batch).execute()
        print(f"Uploaded user batch {i//batch_size + 1}")
    
    # Upload intents in batches
    batch_size = 50
    for i in range(0, len(intent_records), batch_size):
        batch = intent_records[i:i + batch_size]
        response = supabase.table('intents').insert(batch).execute()
        print(f"Uploaded intent batch {i//batch_size + 1}")
    
    print(f"Successfully uploaded {len(user_records)} users and {len(intent_records)} intents")

if __name__ == "__main__":
    main()