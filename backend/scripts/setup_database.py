#!/usr/bin/env python3
"""
Database setup script for Universal Connection Platform
Creates necessary tables in Supabase using SQL commands
"""

import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase

# Load environment variables
load_dotenv()

def setup_database():
    """Setup database tables and extensions"""
    print("[Setup] Setting up database schema...")
    
    supabase = get_supabase()
    
    # Note: These SQL commands would typically be run directly in Supabase dashboard
    # or using the Supabase CLI. This script serves as documentation.
    
    sql_commands = """
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgis";
    CREATE EXTENSION IF NOT EXISTS "vector";
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        interests TEXT[] DEFAULT '{}',
        location GEOGRAPHY(POINT),
        location_name VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Intents table
    CREATE TABLE IF NOT EXISTS intents (
        intent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('demand', 'supply')),
        category VARCHAR(50) NOT NULL,
        raw_query TEXT NOT NULL,
        parsed_data JSONB,
        embedding VECTOR(384), -- for all-MiniLM-L6-v2 model
        location GEOGRAPHY(POINT),
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
    
    -- Chats table (for future messaging feature)
    CREATE TABLE IF NOT EXISTS chats (
        chat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        match_id UUID REFERENCES matches(match_id) ON DELETE CASCADE,
        user1_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        user2_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        last_message TEXT,
        last_message_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Messages table (for future messaging feature)
    CREATE TABLE IF NOT EXISTS messages (
        message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        chat_id UUID REFERENCES chats(chat_id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
    CREATE INDEX IF NOT EXISTS idx_intents_user_id ON intents(user_id);
    CREATE INDEX IF NOT EXISTS idx_intents_category ON intents(category);
    CREATE INDEX IF NOT EXISTS idx_intents_post_type ON intents(post_type);
    CREATE INDEX IF NOT EXISTS idx_intents_active ON intents(is_active);
    CREATE INDEX IF NOT EXISTS idx_intents_location ON intents USING GIST(location);
    CREATE INDEX IF NOT EXISTS idx_intents_embedding ON intents USING ivfflat(embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS idx_matches_intent1 ON matches(intent1_id);
    CREATE INDEX IF NOT EXISTS idx_matches_intent2 ON matches(intent2_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    
    -- Row Level Security (RLS) policies
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    -- Users can read their own data
    CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = user_id);
    
    -- Users can manage their own intents
    CREATE POLICY intents_policy ON intents FOR ALL USING (auth.uid() = user_id);
    
    -- Users can read matches involving their intents
    CREATE POLICY matches_policy ON matches FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM intents WHERE intent_id = intent1_id
            UNION
            SELECT user_id FROM intents WHERE intent_id = intent2_id
        )
    );
    
    -- Enable real-time subscriptions
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    """
    
    print("[Setup] SQL Schema commands prepared.")
    print("[Setup] Please run these commands in your Supabase SQL editor:")
    print("=" * 60)
    print(sql_commands)
    print("=" * 60)
    print("[Setup] After running the SQL commands, your database will be ready!")
    print("[Setup] You can then run: python scripts/generate_test_data.py")
    
    return True

if __name__ == "__main__":
    setup_database()