import os
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env file in the current directory or parent
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    # Also try parent directory
    load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

# Parse PostgreSQL URL - will be called when needed
db_config = None

def _initialize_db_config():
    global db_config, DATABASE_URL
    if not DATABASE_URL:
        DATABASE_URL = os.environ.get("DATABASE_URL")
    
    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL environment variable is not set. "
            "Please create a .env file in backend_python/ with: "
            "DATABASE_URL=postgresql://user:password@localhost:5432/fleet_db"
        )
    
    parsed_url = urlparse(DATABASE_URL)
    db_config = {
        "host": parsed_url.hostname,
        "database": parsed_url.path[1:],  # Remove leading /
        "user": parsed_url.username,
        "password": parsed_url.password,
        "port": parsed_url.port or 5432,
    }
    return db_config

# Initialize on first use
def get_db_config():
    global db_config
    if db_config is None:
        _initialize_db_config()
    return db_config

def get_db():
    """Get a database connection"""
    config = get_db_config()
    conn = psycopg2.connect(**config)
    try:
        yield conn
    finally:
        conn.close()

def get_db_cursor(conn):
    """Get a cursor from connection"""
    return conn.cursor(cursor_factory=RealDictCursor)

def init_db():
    """Initialize database schema"""
    config = get_db_config()
    conn = psycopg2.connect(**config)
    cursor = conn.cursor()
    
    # Create ENUM types
    cursor.execute("""
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('owner', 'operator', 'farmer');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    
    cursor.execute("""
        DO $$ BEGIN
            CREATE TYPE operation_type AS ENUM ('tillage', 'sowing', 'spraying', 'weeding', 'harvesting', 'threshing', 'grading');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    
    cursor.execute("""
        DO $$ BEGIN
            CREATE TYPE operation_status AS ENUM ('active', 'completed', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role user_role NOT NULL DEFAULT 'operator',
            phone TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tractors (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id),
            manufacturer_name TEXT NOT NULL,
            model TEXT NOT NULL,
            registration_number TEXT UNIQUE NOT NULL,
            specifications JSONB,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS implements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id),
            operation_type operation_type NOT NULL,
            name TEXT NOT NULL,
            brand_name TEXT NOT NULL,
            specifications JSONB,
            working_width FLOAT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS operations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tractor_id UUID NOT NULL REFERENCES tractors(id),
            implement_id UUID NOT NULL REFERENCES implements(id),
            operator_id UUID NOT NULL REFERENCES users(id),
            operation_type operation_type NOT NULL,
            status operation_status NOT NULL DEFAULT 'active',
            start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operation_id UUID NOT NULL REFERENCES operations(id),
            tractor_id UUID NOT NULL REFERENCES tractors(id),
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            engine_on BOOLEAN NOT NULL,
            latitude FLOAT,
            longitude FLOAT,
            is_moving BOOLEAN NOT NULL DEFAULT FALSE,
            pto_on BOOLEAN NOT NULL DEFAULT FALSE,
            speed FLOAT DEFAULT 0,
            implement_data JSONB
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuel_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tractor_id UUID NOT NULL REFERENCES tractors(id),
            operator_id UUID NOT NULL REFERENCES users(id),
            operation_id UUID REFERENCES operations(id),
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            quantity FLOAT NOT NULL,
            notes TEXT
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tractor_id UUID NOT NULL REFERENCES tractors(id),
            operation_id UUID REFERENCES operations(id),
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_resolved BOOLEAN NOT NULL DEFAULT FALSE
        );
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
