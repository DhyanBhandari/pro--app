"""
Basic test to verify backend setup without optional dependencies
"""

print("Testing basic backend setup...")

# Test basic imports
try:
    from app.core.config import settings
    print("✓ Config loaded successfully")
except Exception as e:
    print(f"✗ Config error: {e}")

try:
    from app.core.database import get_supabase
    print("✓ Database module loaded")
except Exception as e:
    print(f"✗ Database error: {e}")

try:
    from app.services.nlp_service import nlp_service
    print("✓ NLP service loaded")
except Exception as e:
    print(f"✗ NLP service error: {e}")

try:
    from app.services.embedding_service import embedding_service
    print("✓ Embedding service loaded")
except Exception as e:
    print(f"✗ Embedding service error: {e}")

try:
    from app.services.matching_service import matching_service
    print("✓ Matching service loaded")
except Exception as e:
    print(f"✗ Matching service error: {e}")

try:
    from app.services.advanced_matching_service import advanced_matching_service
    print("✓ Advanced matching service loaded")
except Exception as e:
    print(f"✗ Advanced matching service error: {e}")

try:
    from app.services.query_parser_service import query_parser_service
    print("✓ Query parser service loaded (with fallback)")
except Exception as e:
    print(f"✗ Query parser error: {e}")

try:
    from app.services.notification_service import notification_service
    print("✓ Notification service loaded (with fallback)")
except Exception as e:
    print(f"✗ Notification service error: {e}")

print("\nChecking optional dependencies:")
try:
    import google.generativeai
    print("✓ Google Generative AI available")
except ImportError:
    print("✗ Google Generative AI not installed (install with: pip install google-generativeai)")

try:
    import spacy
    print("✓ spaCy available")
except ImportError:
    print("✗ spaCy not installed (install with: pip install spacy)")

try:
    import firebase_admin
    print("✓ Firebase Admin SDK available")
except ImportError:
    print("✗ Firebase Admin SDK not installed (install with: pip install firebase-admin)")

print("\nBackend can run with basic functionality. Install optional dependencies for full features.")