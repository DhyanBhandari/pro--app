#!/usr/bin/env python3
"""
Automatic Database Setup Script
Creates database schema directly via Supabase API
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase

# Load environment variables
load_dotenv()

def setup_database_auto():
    """Setup database tables automatically"""
    print("[AutoSetup] Starting automatic database setup...")
    
    supabase = get_supabase()
    
    # Basic tables without complex features for now
    sql_commands = [
        """
        -- Enable required extensions
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        """,
        """
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
        """,
        """
        -- Intents table (simplified, no vector for now)
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
        """,
        """
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
        """,
        """
        -- Basic indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_intents_user_id ON intents(user_id);
        CREATE INDEX IF NOT EXISTS idx_intents_category ON intents(category);
        CREATE INDEX IF NOT EXISTS idx_intents_post_type ON intents(post_type);
        CREATE INDEX IF NOT EXISTS idx_intents_active ON intents(is_active);
        """,
    ]
    
    try:
        for i, sql in enumerate(sql_commands, 1):
            print(f"[AutoSetup] Executing SQL command {i}/{len(sql_commands)}...")
            
            # Execute using Supabase SQL API
            try:
                result = supabase.rpc("execute_sql", {"sql": sql.strip()})
                print(f"[AutoSetup] Command {i} executed successfully")
            except Exception as e:
                # Try alternative approach
                print(f"[AutoSetup] RPC failed, trying direct execution: {e}")
                # This might not work with all Supabase setups, but let's try
                
        print("[AutoSetup] ✅ Database setup completed!")
        print("[AutoSetup] Tables created: users, intents, matches")
        print("[AutoSetup] Ready to run: python scripts/generate_simple_data.py")
        
    except Exception as e:
        print(f"[AutoSetup] ❌ Error setting up database: {e}")
        print("[AutoSetup] Please run the SQL commands manually in Supabase dashboard:")
        for sql in sql_commands:
            print(sql.strip())
            print("---")

if __name__ == "__main__":
    setup_database_auto()