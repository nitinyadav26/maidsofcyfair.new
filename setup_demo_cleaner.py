#!/usr/bin/env python3

import asyncio
import json
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Backend configuration
BACKEND_URL = "https://maidsbooking.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Demo cleaner data
DEMO_CLEANER = {
    "email": "cleaner@maids.com",
    "first_name": "Demo",
    "last_name": "Cleaner",
    "phone": "(281) 555-9999"
}

# Demo user credentials for the cleaner
DEMO_USER_CREDS = {
    "email": "cleaner@maids.com",
    "password": "cleaner123",
    "first_name": "Demo",
    "last_name": "Cleaner",
    "phone": "(281) 555-9999"
}

async def setup_demo_cleaner():
    """Set up demo cleaner for mobile app testing"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("🚀 Setting up demo cleaner for mobile app...")
        
        # 1. Login as admin to get token
        print("1. Logging in as admin...")
        admin_login = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": "admin@maids.com",
            "password": "admin@maids@1234"
        })
        
        if admin_login.status_code != 200:
            print("❌ Failed to login as admin")
            return
            
        admin_token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 2. Create user account for cleaner
        print("2. Creating user account for cleaner...")
        user_response = requests.post(f"{BACKEND_URL}/auth/register", json=DEMO_USER_CREDS)
        
        if user_response.status_code == 200:
            print("✅ User account created successfully")
        else:
            print(f"⚠️  User might already exist: {user_response.json()}")
        
        # 3. Check if cleaner already exists
        print("3. Checking existing cleaners...")
        existing_cleaner = await db.cleaners.find_one({"email": DEMO_CLEANER["email"]})
        
        if existing_cleaner:
            print("✅ Demo cleaner already exists")
            cleaner_id = existing_cleaner["id"]
        else:
            # 4. Create cleaner in database
            print("4. Creating cleaner record...")
            cleaner_data = {
                "id": str(uuid.uuid4()),
                "email": DEMO_CLEANER["email"],
                "first_name": DEMO_CLEANER["first_name"],
                "last_name": DEMO_CLEANER["last_name"],
                "phone": DEMO_CLEANER["phone"],
                "is_active": True,
                "rating": 4.8,
                "total_jobs": 45,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.cleaners.insert_one(cleaner_data)
            cleaner_id = cleaner_data["id"]
            print("✅ Cleaner record created successfully")
        
        # 5. Assign some demo jobs to the cleaner
        print("5. Assigning demo jobs to cleaner...")
        
        # Get existing bookings
        bookings = await db.bookings.find().to_list(10)
        assigned_count = 0
        
        for booking in bookings[:3]:  # Assign first 3 bookings to demo cleaner
            if not booking.get("cleaner_id"):
                await db.bookings.update_one(
                    {"_id": booking["_id"]},
                    {"$set": {"cleaner_id": cleaner_id}}
                )
                assigned_count += 1
        
        if assigned_count > 0:
            print(f"✅ Assigned {assigned_count} jobs to demo cleaner")
        else:
            print("ℹ️  No unassigned jobs available to assign")
        
        # 6. Summary
        print("\n🎉 Demo cleaner setup completed!")
        print("\n📱 Mobile App Login Credentials:")
        print(f"   Email: {DEMO_CLEANER['email']}")
        print(f"   Password: cleaner123")
        print(f"   Cleaner ID: {cleaner_id}")
        
        print("\n📋 Next Steps:")
        print("1. Install Flutter dependencies: flutter pub get")
        print("2. Run the mobile app: flutter run")
        print("3. Use the credentials above to login")
        print("4. View assigned jobs and test features")
        
        # 7. Verify setup
        print("\n🔍 Verifying setup...")
        cleaner_jobs_count = await db.bookings.count_documents({"cleaner_id": cleaner_id})
        print(f"   ✅ Cleaner has {cleaner_jobs_count} assigned jobs")
        
        user_exists = await db.users.find_one({"email": DEMO_CLEANER["email"]})
        if user_exists:
            print("   ✅ User account exists and can login")
        else:
            print("   ⚠️  User account not found")
            
    except Exception as e:
        print(f"❌ Error setting up demo cleaner: {e}")
    finally:
        client.close()

def main():
    print("Maids of Cyfair - Demo Cleaner Setup")
    print("="*50)
    asyncio.run(setup_demo_cleaner())

if __name__ == "__main__":
    main()