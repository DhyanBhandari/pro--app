import asyncio
import random
import sys
import os
from faker import Faker
from datetime import datetime, timedelta
import uuid

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase
from app.services.embedding_service import embedding_service
from app.services.nlp_service import nlp_service

# Initialize faker with Indian locale
fake = Faker('en_IN')

# Indian cities with coordinates (focusing on Bangalore area)
CITIES = [
    {'name': 'Whitefield', 'lat': 12.9698, 'lng': 77.7499},
    {'name': 'Koramangala', 'lat': 12.9352, 'lng': 77.6245},
    {'name': 'HSR Layout', 'lat': 12.9081, 'lng': 77.6476},
    {'name': 'Indiranagar', 'lat': 12.9784, 'lng': 77.6408},
    {'name': 'Electronic City', 'lat': 12.8456, 'lng': 77.6603},
    {'name': 'Marathahalli', 'lat': 12.9591, 'lng': 77.6974},
    {'name': 'Jayanagar', 'lat': 12.9299, 'lng': 77.5825},
    {'name': 'BTM Layout', 'lat': 12.9165, 'lng': 77.6101},
    {'name': 'Banashankari', 'lat': 12.9249, 'lng': 77.5364},
    {'name': 'Rajajinagar', 'lat': 12.9915, 'lng': 77.5551}
]

INTERESTS = [
    'cricket', 'football', 'badminton', 'cooking', 'travel', 'music', 'movies',
    'technology', 'fitness', 'reading', 'photography', 'gaming', 'dancing',
    'yoga', 'painting', 'gardening', 'startup', 'investment'
]

# Sample query templates for generating realistic intents
QUERY_TEMPLATES = {
    'product_sell': [
        "Selling {item} in {location}, excellent condition, {price}",
        "Brand new {item} for sale in {location}, {price} only",
        "{item} available in {location}, barely used, {price}",
        "Urgent sale: {item} in {location}, {price}"
    ],
    'product_buy': [
        "Looking for {item} in {location}, budget {price}",
        "Need {item} urgently in {location}, paying up to {price}",
        "Want to buy {item} in {location}, budget {price}",
        "Searching for good {item} in {location}, {price} range"
    ],
    'service_offer': [
        "Professional {service} service in {location}, experienced",
        "Reliable {service} available in {location}, reasonable rates",
        "Expert {service} services in {location}, call anytime",
        "Quality {service} work in {location}, satisfied customers"
    ],
    'service_need': [
        "Need {service} in {location}, urgent requirement",
        "Looking for good {service} in {location}, reasonable rates",
        "Require {service} services in {location}, reliable person needed",
        "Searching for {service} in {location}, quality work expected"
    ],
    'travel': [
        "Planning trip to {destination} from {location}, need travel buddy",
        "Going to {destination} this weekend from {location}, anyone interested?",
        "Travel companion needed for {destination} trip from {location}",
        "Want to explore {destination} with someone from {location}"
    ],
    'social': [
        "Looking for {activity} partner in {location}",
        "Want to learn {skill} in {location}, need teacher",
        "Interested in {hobby} group in {location}",
        "Seeking {activity} buddy in {location}, weekends free"
    ]
}

PRODUCTS = [
    'iPhone 13', 'iPhone 14', 'Samsung Galaxy', 'OnePlus', 'MacBook Pro', 'Dell Laptop',
    'Honda City', 'Hyundai i20', 'Royal Enfield', 'Honda Activa', 'Bajaj Pulsar',
    'PlayStation 5', 'Xbox', 'Guitar', 'Bicycle', 'Treadmill', 'Refrigerator',
    'Washing Machine', 'Air Conditioner', 'Sofa Set', 'Dining Table'
]

SERVICES = [
    'plumber', 'electrician', 'carpenter', 'painter', 'cleaning', 'home repair',
    'laptop repair', 'phone repair', 'tuition', 'yoga instructor', 'driver',
    'cook', 'maid', 'security guard', 'delivery', 'packers movers'
]

DESTINATIONS = [
    'Goa', 'Coorg', 'Ooty', 'Mysore', 'Hampi', 'Chikmagalur', 'Wayanad',
    'Kerala', 'Pondicherry', 'Chennai', 'Hyderabad', 'Mumbai', 'Delhi'
]

ACTIVITIES = ['gym', 'jogging', 'cricket', 'badminton', 'chess', 'book reading']
SKILLS = ['guitar', 'python programming', 'cooking', 'swimming', 'driving', 'english']
HOBBIES = ['photography', 'painting', 'singing', 'dancing', 'gardening', 'blogging']

PRICES = ['₹5k', '₹10k', '₹25k', '₹50k', '₹1L', '₹2L', '₹500', '₹2000', '₹15k']

async def generate_test_data():
    """Generate 3000 test profiles with realistic data"""
    print("[TestData] Starting test data generation...")
    print("[TestData] This will create 3000 users with ~4500 intents")
    
    supabase = get_supabase()
    
    users = []
    intents_data = []
    
    for i in range(3000):
        # Generate user data
        city = random.choice(CITIES)
        user_interests = random.sample(INTERESTS, k=random.randint(3, 6))
        
        user = {
            'user_id': str(uuid.uuid4()),
            'name': fake.name(),
            'email': f'test{i}@example.com',
            'phone': fake.phone_number(),
            'interests': user_interests,
            'location': f"POINT({city['lng']} {city['lat']})",
            'location_name': city['name'],
            'bio': fake.text(max_nb_chars=120),
            'created_at': (datetime.utcnow() - timedelta(days=random.randint(1, 365))).isoformat()
        }
        users.append(user)
        
        # Generate 1-2 intents per user (70% get intents)
        if random.random() < 0.7:
            num_intents = random.choices([1, 2], weights=[0.8, 0.2])[0]
            
            for _ in range(num_intents):
                intent = generate_random_intent(user['user_id'], city)
                intents_data.append(intent)
        
        # Progress indicator
        if (i + 1) % 500 == 0:
            print(f"[TestData] Generated {i + 1} users...")
    
    print(f"[TestData] Generated {len(users)} users and {len(intents_data)} intents")
    
    # Batch insert users
    print("[TestData] Inserting users...")
    try:
        batch_size = 100
        for i in range(0, len(users), batch_size):
            batch = users[i:i + batch_size]
            response = supabase.table('users').insert(batch).execute()
            if i % 500 == 0:
                print(f"[TestData] Inserted {i + len(batch)} users...")
        
        print(f"[TestData] Successfully inserted {len(users)} users!")
        
    except Exception as e:
        print(f"[TestData] Error inserting users: {e}")
        return
    
    # Batch insert intents
    print("[TestData] Inserting intents...")
    try:
        batch_size = 50  # Smaller batches for intents due to embeddings
        for i in range(0, len(intents_data), batch_size):
            batch = intents_data[i:i + batch_size]
            response = supabase.table('intents').insert(batch).execute()
            if i % 250 == 0:
                print(f"[TestData] Inserted {i + len(batch)} intents...")
        
        print(f"[TestData] Successfully inserted {len(intents_data)} intents!")
        
    except Exception as e:
        print(f"[TestData] Error inserting intents: {e}")
        return
    
    print("[TestData] ✅ Test data generation complete!")
    print(f"[TestData] Created:")
    print(f"  - {len(users)} users")
    print(f"  - {len(intents_data)} intents")
    print(f"  - Ready for matching tests")

def generate_random_intent(user_id: str, city: dict) -> dict:
    """Generate a realistic random intent"""
    # Choose intent category
    category_type = random.choices(
        ['product', 'service', 'travel', 'social'],
        weights=[0.4, 0.3, 0.15, 0.15]
    )[0]
    
    # Generate query based on category
    if category_type == 'product':
        is_selling = random.choice([True, False])
        product = random.choice(PRODUCTS)
        price = random.choice(PRICES)
        
        if is_selling:
            template = random.choice(QUERY_TEMPLATES['product_sell'])
            query = template.format(
                item=product, 
                location=city['name'], 
                price=price
            )
        else:
            template = random.choice(QUERY_TEMPLATES['product_buy'])
            query = template.format(
                item=product, 
                location=city['name'], 
                price=price
            )
    
    elif category_type == 'service':
        is_offering = random.choice([True, False])
        service = random.choice(SERVICES)
        
        if is_offering:
            template = random.choice(QUERY_TEMPLATES['service_offer'])
            query = template.format(service=service, location=city['name'])
        else:
            template = random.choice(QUERY_TEMPLATES['service_need'])
            query = template.format(service=service, location=city['name'])
    
    elif category_type == 'travel':
        destination = random.choice(DESTINATIONS)
        template = random.choice(QUERY_TEMPLATES['travel'])
        query = template.format(destination=destination, location=city['name'])
    
    else:  # social
        activity = random.choice(ACTIVITIES + SKILLS + HOBBIES)
        template = random.choice(QUERY_TEMPLATES['social'])
        query = template.format(
            activity=activity, 
            skill=random.choice(SKILLS),
            hobby=random.choice(HOBBIES),
            location=city['name']
        )
    
    # Parse query to get intent details
    parsed_data = nlp_service.parse_query(query)
    
    # Generate embedding
    embedding = embedding_service.generate_embedding(query)
    
    # Create intent record
    intent = {
        'intent_id': str(uuid.uuid4()),
        'user_id': user_id,
        'post_type': parsed_data['intent'],
        'category': parsed_data['category'],
        'raw_query': query,
        'parsed_data': parsed_data,
        'embedding': embedding,
        'location': f"POINT({city['lng']} {city['lat']})",
        'location_name': city['name'],
        'is_active': True,
        'created_at': (datetime.utcnow() - timedelta(days=random.randint(0, 30))).isoformat(),
        'valid_until': (datetime.utcnow() + timedelta(days=random.randint(15, 60))).isoformat()
    }
    
    return intent

if __name__ == "__main__":
    asyncio.run(generate_test_data())