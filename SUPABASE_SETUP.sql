-- Simple Supabase Setup Script
-- Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simplified)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    interests TEXT[] DEFAULT '{}',
    location_name VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intents table (simplified, no vector/geometry for now)
CREATE TABLE IF NOT EXISTS intents (
    intent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('demand', 'supply')),
    category VARCHAR(50) NOT NULL,
    raw_query TEXT NOT NULL,
    parsed_data JSONB,
    location_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intent1_id UUID REFERENCES intents(intent_id) ON DELETE CASCADE,
    intent2_id UUID REFERENCES intents(intent_id) ON DELETE CASCADE,
    similarity_score FLOAT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_intents_user_id ON intents(user_id);
CREATE INDEX IF NOT EXISTS idx_intents_category ON intents(category);
CREATE INDEX IF NOT EXISTS idx_intents_post_type ON intents(post_type);
CREATE INDEX IF NOT EXISTS idx_intents_active ON intents(is_active);
CREATE INDEX IF NOT EXISTS idx_matches_intent1 ON matches(intent1_id);
CREATE INDEX IF NOT EXISTS idx_matches_intent2 ON matches(intent2_id);

-- Insert a test user for development
INSERT INTO users (name, email, phone, location_name, bio) 
VALUES ('Test User', 'test@example.com', '+1234567890', 'Whitefield', 'Test user for development')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as message;