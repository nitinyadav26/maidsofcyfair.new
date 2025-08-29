import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def fix_bookings():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Find all bookings that need updating
    bookings = await db.bookings.find().to_list(1000)
    print(f"Found {len(bookings)} bookings to check")
    
    for booking in bookings:
        update_data = {}
        
        # Add missing fields with default values
        if 'house_size' not in booking:
            update_data['house_size'] = '2000-2500'
        if 'frequency' not in booking:
            update_data['frequency'] = 'one_time'
        if 'base_price' not in booking:
            update_data['base_price'] = 155.0
        if 'a_la_carte_total' not in booking:
            update_data['a_la_carte_total'] = 0.0
        if 'a_la_carte_services' not in booking:
            update_data['a_la_carte_services'] = []
        
        # Update the booking if we have changes
        if update_data:
            result = await db.bookings.update_one(
                {"_id": booking["_id"]},
                {"$set": update_data}
            )
            print(f"Updated booking {booking['id']} - matched: {result.matched_count}, modified: {result.modified_count}")
        else:
            print(f"Booking {booking['id']} is already up to date")

if __name__ == "__main__":
    asyncio.run(fix_bookings())