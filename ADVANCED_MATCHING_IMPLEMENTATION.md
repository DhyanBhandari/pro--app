# Advanced Matching System Implementation Guide

## Overview

This guide details the implementation of the advanced semantic and parameter-aware matching system for the Universal Connection Platform (UCP). The system supports intelligent matching between buyers and sellers, intent inversion, fuzzy parameter matching, and real-time notifications.

## Key Features Implemented

### 1. Advanced Query Parsing (✅ Completed)
- **Gemini Integration**: Natural language understanding for query intent
- **spaCy Integration**: Entity extraction and NER
- **Follow-up Questions**: Smart prompts for missing parameters
- **Query Classification**: Transactional vs Knowledge queries

### 2. Semantic Matching Engine (✅ Completed)
- **Vector Embeddings**: 1536-dimensional embeddings using pgvector
- **Cosine Similarity**: Semantic matching even with different phrasing
- **Intent Inversion**: Automatic buy ↔ sell, rent ↔ rent_out matching
- **Composite Scoring**: Weighted combination of multiple factors

### 3. Parameter-Aware Matching (✅ Completed)
- **Structured Parameter Extraction**: Brand, model, year, price, location
- **Fuzzy Matching**: ±1 year tolerance, partial string matches
- **Price Tolerance**: ±10% price matching flexibility
- **Location Proximity**: PostGIS-based distance calculations

### 4. Frontend Components (✅ Completed)
- **SmartQueryInput**: Conversational query input with follow-ups
- **AdvancedMatchCard**: Rich match display with score breakdown
- **AdvancedMatchResultsScreen**: Enhanced results with filtering/sorting

### 5. Real-time Notifications (✅ Completed)
- **Background Worker**: Checks for new matches every 5 minutes
- **Firebase Cloud Messaging**: Push notifications for high-quality matches
- **Notification Preferences**: User-configurable notification settings
- **Live Intents**: Queries saved for 5 days with auto-matching

## Backend Implementation

### Services Created

#### 1. `advanced_matching_service.py`
```python
# Key features:
- Intent inversion mapping (buy ↔ sell)
- Composite scoring with configurable weights
- Fuzzy parameter matching
- Location-based filtering
- Live intent storage
```

#### 2. `query_parser_service.py`
```python
# Key features:
- Gemini API integration for NLU
- spaCy entity extraction
- Follow-up question generation
- Query type classification
- Custom pattern extraction
```

#### 3. `notification_service.py`
```python
# Key features:
- Async notification worker
- FCM push notifications
- Notification history tracking
- User preference management
```

### Database Schema Updates

Run the SQL script to enable advanced features:
```bash
cd backend/scripts
psql -h your-supabase-url -U postgres -d postgres -f setup_advanced_matching.sql
```

Key additions:
- `embedding vector(1536)` - Vector embeddings column
- `location_point geography(POINT)` - PostGIS location data
- `expiry_date timestamptz` - For live intent expiry
- `match_notifications` table - Notification tracking
- Custom functions for match scoring

### API Endpoints

#### Query Parsing
```
POST /api/intents/parse
Body: {
  "query": "Looking for Honda Civic under 5L",
  "location": "Bangalore"
}
```

#### Create Intent with Advanced Matching
```
POST /api/intents
Body: {
  "raw_query": "Selling my Honda Civic 2018 diesel for 5L",
  "location_name": "Whitefield, Bangalore"
}
```

#### Register FCM Token
```
POST /api/notifications/register-token
Body: {
  "fcm_token": "firebase-token-here"
}
```

## Frontend Implementation

### New Components

#### 1. SmartQueryInput
- Conversational query input
- Real-time parsing feedback
- Follow-up question UI
- Example query chips

#### 2. AdvancedMatchCard
- Composite score visualization
- Score breakdown (semantic, location, parameters, price)
- Parsed parameter tags
- Distance display
- One-tap chat initiation

#### 3. AdvancedMatchResultsScreen
- Advanced filtering (high/medium/low quality)
- Sorting options (score, distance, recency)
- Live intent notification
- Empty state with notification opt-in

### Integration Example

```typescript
// In your search screen
import SmartQueryInput from '@/components/SmartQueryInput';
import { matchingService } from '@/services/MatchingService';

const handleQuerySubmit = async (query: string, structuredData?: any) => {
  // Use structured data if available from parsing
  const result = await matchingService.performSearch(
    query,
    location,
    authToken,
    structuredData
  );
  
  navigation.navigate('AdvancedMatchResults', { 
    intentId: result.intent_id 
  });
};

<SmartQueryInput
  onSubmit={handleQuerySubmit}
  location={userLocation}
/>
```

## Configuration Required

### 1. Environment Variables
Add to your backend `.env`:
```
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_ADMIN_SDK_PATH=path/to/serviceAccountKey.json
```

### 2. Firebase Setup
- Enable Cloud Messaging in Firebase Console
- Download and configure Admin SDK credentials
- Update FCM server key in backend config

### 3. Supabase Setup
- Enable pgvector extension
- Enable PostGIS extension
- Run the setup SQL script
- Create appropriate indexes

### 4. Python Dependencies
```bash
cd backend
pip install google-generativeai spacy firebase-admin
python -m spacy download en_core_web_sm
```

## Testing the Implementation

### 1. Test Query Parsing
```bash
curl -X POST http://localhost:8000/api/intents/parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Looking for laptop", "location": "Bangalore"}'
```

### 2. Test Matching
Create two complementary intents:
- Buyer: "Looking for used Honda Civic under 5L diesel 2018"
- Seller: "Selling my Honda Civic 2018 model, diesel, for 5L"

Expected result: >90% match score

### 3. Test Notifications
1. Register FCM token
2. Create an intent
3. Have another user create a matching intent
4. Verify push notification received

## Monitoring and Analytics

### Key Metrics to Track
- Average match scores by category
- Query parsing success rate
- Notification delivery rate
- Time to first match
- User engagement with matches

### Logging
All services include comprehensive logging:
```python
logger.info(f"[ServiceName] Action performed")
logger.error(f"[ServiceName] Error occurred: {e}")
```

## Future Enhancements

1. **ML Model Fine-tuning**
   - Train custom embeddings on platform data
   - Improve category classification
   - Better price extraction

2. **Advanced Features**
   - Image similarity matching
   - Multi-language support
   - Voice query input
   - Predictive intent suggestions

3. **Performance Optimization**
   - Implement caching for embeddings
   - Batch processing for notifications
   - Query result pagination

## Troubleshooting

### Common Issues

1. **No matches found**
   - Check if embeddings are being generated
   - Verify intent inversion logic
   - Check database indexes

2. **Notifications not working**
   - Verify FCM configuration
   - Check user FCM tokens
   - Review notification worker logs

3. **Slow matching**
   - Ensure pgvector indexes are created
   - Check embedding dimension consistency
   - Monitor database query performance

## Conclusion

The advanced matching system provides intelligent, semantic-aware matching that goes beyond simple keyword matching. It understands user intent, handles natural language variations, and provides real-time notifications for the best user experience.