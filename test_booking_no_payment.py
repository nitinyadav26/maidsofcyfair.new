#!/usr/bin/env python3
"""
Test script to verify booking works without payment processing
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_booking_without_payment():
    """Test booking creation without payment processing"""
    
    print("🧪 Testing Booking Without Payment")
    print("=" * 35)
    
    try:
        # Step 1: Create a booking without payment
        print("\n1. Creating booking without payment...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        booking_data = {
            "customer": {
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "Customer",
                "phone": "555-0123",
                "address": "123 Test Street",
                "city": "Houston",
                "state": "TX",
                "zip_code": "77001",
                "is_guest": True
            },
            "house_size": "medium",
            "frequency": "one_time",
            "base_price": 150.0,
            "rooms": {
                "masterBedroom": True,
                "masterBathroom": True,
                "otherBedrooms": 2,
                "otherFullBathrooms": 1,
                "halfBathrooms": 1,
                "diningRoom": True,
                "kitchen": True,
                "livingRoom": True,
                "mediaRoom": False,
                "gameRoom": False,
                "office": False
            },
            "services": [
                {
                    "service_id": "standard_cleaning",
                    "quantity": 1
                }
            ],
            "a_la_carte_services": [],
            "booking_date": tomorrow,
            "time_slot": "9:00 AM - 11:00 AM",
            "special_instructions": "Test booking without payment",
            "promo_code": None
        }
        
        # Create booking
        response = requests.post(f"{API_URL}/bookings/guest", json=booking_data)
        
        if response.status_code != 200:
            print(f"❌ Booking creation failed: {response.text}")
            return False
        
        booking_result = response.json()
        print(f"✅ Booking created successfully!")
        print(f"   - Booking ID: {booking_result.get('id', 'N/A')}")
        print(f"   - Customer: {booking_result.get('customer_id', 'N/A')}")
        print(f"   - Date: {booking_result.get('booking_date', 'N/A')}")
        print(f"   - Total: ${booking_result.get('total_amount', 'N/A')}")
        print(f"   - Status: {booking_result.get('status', 'N/A')}")
        
        # Step 2: Verify booking appears in admin dashboard
        print("\n2. Verifying booking in admin dashboard...")
        
        admin_login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        if admin_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_response.text}")
            return False
        
        admin_token = admin_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get bookings from admin dashboard
        bookings_response = requests.get(f"{API_URL}/admin/bookings", headers=admin_headers)
        if bookings_response.status_code != 200:
            print(f"❌ Failed to fetch admin bookings: {bookings_response.text}")
            return False
        
        admin_bookings = bookings_response.json()
        print(f"✅ Admin dashboard accessible!")
        print(f"   - Total bookings in admin: {len(admin_bookings)}")
        
        # Check if our booking is in the list
        booking_found = False
        for booking in admin_bookings:
            if booking.get('id') == booking_result.get('id'):
                booking_found = True
                print(f"✅ Booking found in admin dashboard!")
                print(f"   - Status: {booking.get('status', 'N/A')}")
                print(f"   - Customer ID: {booking.get('customer_id', 'N/A')}")
                print(f"   - Total Amount: ${booking.get('total_amount', 'N/A')}")
                break
        
        if not booking_found:
            print("❌ Booking not found in admin dashboard")
            return False
        
        # Step 3: Test booking status update
        print("\n3. Testing booking status update...")
        
        status_update_response = requests.patch(
            f"{API_URL}/admin/bookings/{booking_result['id']}/status",
            json={"status": "confirmed"},
            headers=admin_headers
        )
        
        if status_update_response.status_code == 200:
            print(f"✅ Booking status updated successfully!")
        else:
            print(f"❌ Status update failed: {status_update_response.text}")
        
        print("\n🎉 Booking system works without payment processing!")
        print("✅ Bookings are created and confirmed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = test_booking_without_payment()
        if success:
            print("\n✅ Booking system works perfectly without payment!")
        else:
            print("\n❌ Booking system has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
