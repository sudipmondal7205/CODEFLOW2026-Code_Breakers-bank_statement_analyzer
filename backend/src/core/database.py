import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "transaction_analyzer")


client = None
db = None
users_collection = None

def init_db():

    global client, db, users_collection
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in environment variables")

    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DATABASE]
    users_collection = db["users"]


    users_collection.create_index("email", unique=True)
    print("Database connected and unique indexes for 'users' created/ensured successfully.")

def get_db():
    if db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return db

def get_users_collection():

    if users_collection is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return users_collection
