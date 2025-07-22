import asyncpg
from supabase import create_client, Client
from app.core.config import settings
import asyncio

# Supabase client
supabase: Client = None

def get_supabase() -> Client:
    global supabase
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print(f"[Database] Supabase client initialized")
    return supabase

# AsyncPG connection pool
db_pool: asyncpg.Pool = None

async def get_db():
    global db_pool
    if not db_pool:
        db_pool = await asyncpg.create_pool(settings.DATABASE_URL)
        print(f"[Database] AsyncPG pool created")
    return db_pool

async def init_db():
    """Initialize database connections"""
    print("[Database] Initializing database connections...")
    
    # Initialize Supabase
    get_supabase()
    
    # Initialize AsyncPG pool if DATABASE_URL is provided
    if settings.DATABASE_URL:
        await get_db()
    
    print("[Database] Database initialization complete")

async def close_db():
    """Close database connections"""
    global db_pool
    if db_pool:
        await db_pool.close()
        print("[Database] Database connections closed")