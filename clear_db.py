import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def clear_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Clear services
    result = await db.services.delete_many({})
    print(f"Deleted {result.deleted_count} services")
    
    # Keep time_slots and users

if __name__ == "__main__":
    asyncio.run(clear_db())