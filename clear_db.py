import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv('backend/.env')

async def clear_db():
    mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
    db_name = os.environ.get('DB_NAME', 'maidsofcyfair')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear services
    print(f"Connecting to database '{db_name}' to clear services...")
    result = await db.services.delete_many({})
    print(f"Deleted {result.deleted_count} services")
    
    # Keep time_slots and users

if __name__ == "__main__":
    asyncio.run(clear_db())