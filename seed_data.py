import os
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("backend/.env")

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("MONGODB_URI not found. Please check backend/.env")
    exit(1)

client = MongoClient(MONGODB_URI)
db = client[os.getenv("MONGODB_DATABASE", "transaction_analyzer")]

BASE_URL = "http://localhost:8000/api"

def seed_demo_user():
    print("Seeding demo user...")
    user_data = {
        "email": "demo@apexbank.com",
        "password": "DemoPassword123!",
        "first_name": "Demo",
        "last_name": "User"
    }

    try:
        # Register the user via API so it gets hashed password
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        if response.status_code in [200, 201]:
            print("Successfully created demo user:", response.json())
        else:
            print("Failed to create demo user (might already exist):", response.json())
    except requests.exceptions.ConnectionError:
        print("Backend server is not running on localhost:8000. Please start the backend server to create the user.")
        return

if __name__ == "__main__":
    seed_demo_user()
    print("Seed complete.")
