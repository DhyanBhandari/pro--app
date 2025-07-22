#!/usr/bin/env python3
"""Test Supabase connection and basic functionality"""

import asyncio
from app.core.database import get_supabase
from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service

def test_supabase_connection():
    """Test basic Supabase connection"""
    print("[Test] Testing Supabase connection...")
    
    try:
        supabase = get_supabase()
        print("✅ Supabase client created successfully")
        
        # Test a simple query
        result = supabase.table('_schema').select('*').limit(1).execute()
        print("✅ Supabase query executed successfully")
        print(f"Connection test completed")
        
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_services():
    """Test NLP and embedding services"""
    print("\n[Test] Testing NLP and embedding services...")
    
    try:
        # Test NLP
        test_query = "Selling iPhone 13 in Whitefield for 40k"
        parsed = nlp_service.parse_query(test_query)
        print(f"✅ NLP parsing successful: {parsed['intent']} / {parsed['category']}")
        
        # Test embedding
        embedding = embedding_service.generate_embedding(test_query)
        print(f"✅ Embedding generation successful: {len(embedding)} dimensions")
        
        # Test similarity
        query2 = "Looking for iPhone in Whitefield"
        embedding2 = embedding_service.generate_embedding(query2)
        similarity = embedding_service.compute_similarity(embedding, embedding2)
        print(f"✅ Similarity computation successful: {similarity:.3f}")
        
        return True
    except Exception as e:
        print(f"❌ Services test failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication setup"""
    print("\n[Test] Testing authentication components...")
    
    try:
        from app.core.security import create_access_token, verify_token
        
        # Test token creation
        token = create_access_token({"sub": "test_user"})
        print(f"✅ Token creation successful")
        
        # Test token verification
        payload = verify_token(token)
        print(f"✅ Token verification successful: {payload}")
        
        return True
    except Exception as e:
        print(f"❌ Auth test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Phase 2 Backend Components\n")
    
    results = {
        'supabase': test_supabase_connection(),
        'services': test_services(),
        'auth': test_auth_endpoints()
    }
    
    print(f"\n📊 Test Results Summary:")
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test.capitalize()}: {status}")
    
    if all(results.values()):
        print(f"\n🎉 All tests passed! Backend is ready to run.")
        print(f"Next steps:")
        print(f"1. Set up database tables (manually or via script)")
        print(f"2. Run: python main.py")
        print(f"3. Test endpoints at http://localhost:8000")
    else:
        print(f"\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()