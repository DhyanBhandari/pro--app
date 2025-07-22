-- Enable required extensions for advanced matching
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text matching

-- Add vector column to intents table for embeddings
ALTER TABLE intents 
ADD COLUMN IF NOT EXISTS embedding vector(1536), -- Assuming 1536-dim embeddings
ADD COLUMN IF NOT EXISTS location_point geography(POINT, 4326),
ADD COLUMN IF NOT EXISTS expiry_date timestamptz,
ADD COLUMN IF NOT EXISTS match_notifications_enabled boolean DEFAULT true;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS intents_embedding_idx 
ON intents 
USING hnsw (embedding vector_cosine_ops);

-- Create spatial index for location-based queries
CREATE INDEX IF NOT EXISTS intents_location_idx 
ON intents 
USING GIST (location_point);

-- Create index for text search
CREATE INDEX IF NOT EXISTS intents_raw_query_trgm_idx 
ON intents 
USING gin (raw_query gin_trgm_ops);

-- Create composite index for category and intent matching
CREATE INDEX IF NOT EXISTS intents_category_intent_idx 
ON intents (category, post_type, is_active);

-- Function to calculate match scores
CREATE OR REPLACE FUNCTION calculate_match_score(
    user_embedding vector,
    user_location geography,
    user_params jsonb,
    match_embedding vector,
    match_location geography,
    match_params jsonb
) RETURNS float AS $$
DECLARE
    semantic_score float := 0.0;
    location_score float := 0.0;
    param_score float := 0.0;
    price_score float := 0.0;
    composite_score float := 0.0;
BEGIN
    -- Semantic similarity (cosine similarity)
    IF user_embedding IS NOT NULL AND match_embedding IS NOT NULL THEN
        semantic_score := 1 - (user_embedding <=> match_embedding);
    END IF;
    
    -- Location proximity (distance in meters)
    IF user_location IS NOT NULL AND match_location IS NOT NULL THEN
        DECLARE
            distance_m float;
        BEGIN
            distance_m := ST_Distance(user_location, match_location);
            
            -- Convert distance to score
            IF distance_m <= 5000 THEN -- 5km
                location_score := 1.0;
            ELSIF distance_m <= 10000 THEN -- 10km
                location_score := 0.8;
            ELSIF distance_m <= 20000 THEN -- 20km
                location_score := 0.5;
            ELSE
                location_score := 0.2;
            END IF;
        END;
    ELSE
        location_score := 0.5; -- Default if no location
    END IF;
    
    -- Parameter overlap
    DECLARE
        overlap_count int := 0;
        total_params int := 0;
    BEGIN
        -- Count matching parameters
        IF user_params->>'category' = match_params->>'category' THEN
            overlap_count := overlap_count + 3; -- Higher weight for category
        END IF;
        
        IF user_params->>'brand' = match_params->>'brand' THEN
            overlap_count := overlap_count + 2;
        END IF;
        
        IF user_params->>'model' = match_params->>'model' THEN
            overlap_count := overlap_count + 2;
        END IF;
        
        -- Fuzzy year matching
        IF user_params->>'year' IS NOT NULL AND match_params->>'year' IS NOT NULL THEN
            IF ABS((user_params->>'year')::int - (match_params->>'year')::int) <= 1 THEN
                overlap_count := overlap_count + 1;
            END IF;
        END IF;
        
        IF user_params->>'fuel_type' = match_params->>'fuel_type' THEN
            overlap_count := overlap_count + 1;
        END IF;
        
        total_params := 9; -- Total possible parameter matches
        param_score := overlap_count::float / total_params;
    END;
    
    -- Price tolerance (±10%)
    DECLARE
        user_price numeric;
        match_price numeric;
    BEGIN
        user_price := COALESCE(
            (user_params->>'price')::numeric,
            (user_params->>'budget')::numeric
        );
        
        match_price := COALESCE(
            (match_params->>'price')::numeric,
            (match_params->>'budget')::numeric
        );
        
        IF user_price IS NOT NULL AND match_price IS NOT NULL THEN
            DECLARE
                price_diff numeric;
                tolerance numeric;
            BEGIN
                price_diff := ABS(user_price - match_price);
                tolerance := user_price * 0.1;
                
                IF price_diff <= tolerance THEN
                    price_score := 1.0 - (price_diff / tolerance);
                ELSE
                    price_score := GREATEST(0.0, 1.0 - (price_diff / (user_price * 0.5)));
                END IF;
            END;
        ELSE
            price_score := 0.5; -- Default if no price
        END IF;
    END;
    
    -- Calculate composite score with weights
    composite_score := (semantic_score * 0.4) + 
                      (location_score * 0.2) + 
                      (param_score * 0.3) + 
                      (price_score * 0.1);
    
    RETURN composite_score;
END;
$$ LANGUAGE plpgsql;

-- Function to find semantic matches with intent inversion
CREATE OR REPLACE FUNCTION find_semantic_matches(
    user_intent_id uuid,
    user_embedding vector,
    user_location geography,
    user_params jsonb,
    limit_count int DEFAULT 7
) RETURNS TABLE (
    intent_id uuid,
    user_id uuid,
    raw_query text,
    category text,
    location_name text,
    match_score float,
    distance_km float,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    WITH intent_inversions AS (
        SELECT 
            CASE user_params->>'intent'
                WHEN 'buy' THEN 'sell'
                WHEN 'sell' THEN 'buy'
                WHEN 'rent' THEN 'rent_out'
                WHEN 'rent_out' THEN 'rent'
                WHEN 'looking' THEN 'offering'
                WHEN 'offering' THEN 'looking'
                WHEN 'need' THEN 'provide'
                WHEN 'provide' THEN 'need'
                ELSE user_params->>'intent'
            END AS opposite_intent
    )
    SELECT 
        i.intent_id,
        i.user_id,
        i.raw_query,
        i.category,
        i.location_name,
        calculate_match_score(
            user_embedding,
            user_location,
            user_params,
            i.embedding,
            i.location_point,
            i.parsed_data
        ) AS match_score,
        CASE 
            WHEN user_location IS NOT NULL AND i.location_point IS NOT NULL 
            THEN ST_Distance(user_location, i.location_point) / 1000.0 -- Convert to km
            ELSE 0.0
        END AS distance_km,
        i.created_at
    FROM intents i, intent_inversions ii
    WHERE i.intent_id != user_intent_id
        AND i.is_active = true
        AND (i.expiry_date IS NULL OR i.expiry_date > NOW())
        AND i.category = user_params->>'category'
        AND (
            i.parsed_data->>'intent' = ii.opposite_intent
            OR i.raw_query ILIKE '%' || ii.opposite_intent || '%'
        )
    ORDER BY match_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create notification queue table for new matches
CREATE TABLE IF NOT EXISTS match_notifications (
    notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(user_id),
    intent_id uuid NOT NULL REFERENCES intents(intent_id),
    matched_intent_id uuid NOT NULL REFERENCES intents(intent_id),
    match_score float NOT NULL,
    notification_sent boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    sent_at timestamptz
);

-- Function to check for new matches periodically
CREATE OR REPLACE FUNCTION check_new_matches_for_intent(intent_id_param uuid) 
RETURNS void AS $$
DECLARE
    intent_record RECORD;
    match_record RECORD;
BEGIN
    -- Get the intent details
    SELECT * INTO intent_record 
    FROM intents 
    WHERE intent_id = intent_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Find new matches
    FOR match_record IN
        SELECT * FROM find_semantic_matches(
            intent_record.intent_id,
            intent_record.embedding,
            intent_record.location_point,
            intent_record.parsed_data,
            5 -- Top 5 matches for notifications
        )
        WHERE match_score >= 0.75
    LOOP
        -- Check if notification already sent
        IF NOT EXISTS (
            SELECT 1 FROM match_notifications
            WHERE user_id = intent_record.user_id
            AND intent_id = intent_record.intent_id
            AND matched_intent_id = match_record.intent_id
        ) THEN
            -- Create notification record
            INSERT INTO match_notifications (
                user_id,
                intent_id,
                matched_intent_id,
                match_score
            ) VALUES (
                intent_record.user_id,
                intent_record.intent_id,
                match_record.intent_id,
                match_record.match_score
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy match querying
CREATE OR REPLACE VIEW intent_matches AS
SELECT 
    i1.intent_id AS seeker_intent_id,
    i1.user_id AS seeker_user_id,
    i1.raw_query AS seeker_query,
    i2.intent_id AS provider_intent_id,
    i2.user_id AS provider_user_id,
    i2.raw_query AS provider_query,
    calculate_match_score(
        i1.embedding,
        i1.location_point,
        i1.parsed_data,
        i2.embedding,
        i2.location_point,
        i2.parsed_data
    ) AS match_score,
    ST_Distance(i1.location_point, i2.location_point) / 1000.0 AS distance_km
FROM intents i1
CROSS JOIN intents i2
WHERE i1.intent_id != i2.intent_id
    AND i1.is_active = true
    AND i2.is_active = true
    AND i1.category = i2.category
    AND (
        (i1.parsed_data->>'intent' = 'buy' AND i2.parsed_data->>'intent' = 'sell')
        OR (i1.parsed_data->>'intent' = 'sell' AND i2.parsed_data->>'intent' = 'buy')
        OR (i1.parsed_data->>'intent' = 'rent' AND i2.parsed_data->>'intent' = 'rent_out')
        OR (i1.parsed_data->>'intent' = 'looking' AND i2.parsed_data->>'intent' = 'offering')
    );

-- Sample query to test the matching system
/*
-- Find matches for a specific intent
SELECT * FROM find_semantic_matches(
    'intent-uuid-here'::uuid,
    '[0.1, 0.2, ...]'::vector,
    'POINT(77.5946 12.9716)'::geography,
    '{"intent": "buy", "category": "laptop", "brand": "HP", "budget": "50000"}'::jsonb
);

-- Get all high-score matches
SELECT * FROM intent_matches 
WHERE match_score >= 0.75 
ORDER BY match_score DESC;
*/