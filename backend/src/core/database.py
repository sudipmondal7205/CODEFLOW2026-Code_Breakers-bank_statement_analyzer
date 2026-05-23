import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "transaction_analyzer")

# Global clients/db references
client = None
db = None
users_collection = None

def init_db():
    """
    Initializes the MongoDB client, selects the configured database,
    and sets up indexes for collections (e.g., unique index on google_id and email for users).
    """
    global client, db, users_collection
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in environment variables")

    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DATABASE]
    users_collection = db["users"]

    users_collection.create_index("google_id", unique=True)
    users_collection.create_index("email", unique=True)

    
    db["statements"].create_index("user_id")
    db["transactions"].create_index("statement_id")
    db["transactions"].create_index("user_id")
    
    print("Database connected and unique indexes for 'users', 'statements', and 'transactions' created/ensured successfully.")

def get_db():
    """
    Returns the database instance.
    """
    if db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return db

def get_users_collection():
    """
    Returns the users collection instance.
    """
    if users_collection is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return users_collection
