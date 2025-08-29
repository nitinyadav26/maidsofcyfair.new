import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Check services
    services_count = await db.services.count_documents({})
    print(f"Services count: {services_count}")
    
    services = await db.services.find().to_list(1000)
    print(f"Services found: {len(services)}")
    for service in services:
        print(f"- {service}")
    
    # Check time slots
    slots_count = await db.time_slots.count_documents({})
    print(f"Time slots count: {slots_count}")
    
    # Check users
    users_count = await db.users.count_documents({})
    print(f"Users count: {users_count}")
    
    users = await db.users.find().to_list(1000)
    for user in users:
        print(f"- User: {user['email']}")

if __name__ == "__main__":
    asyncio.run(check_db())