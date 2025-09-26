#!/usr/bin/env python3
"""
Test script to verify guest checkout functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_guest_checkout():
    """Test guest checkout functionality"""
    
    print("🧪 Testing Guest Checkout Functionality")
    print("=" * 40)
    
    try:
        # Step 1: Test guest booking creation
        print("\n1. Testing guest booking creation...")
        
        guest_booking_data = {
            "customer": {
                "email": "guest@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "555-1234",
                "address": "123 Main St",
                "city": "Houston",
                "state": "TX",
                "zip_code": "77001",
                "is_guest": True
            },
            "house_size": "small",
            "frequency": "one_time",
            "base_price": 120.0,
            "rooms": {
                "masterBedroom": True,
                "masterBathroom": True,
                "otherBedrooms": 1,
                "otherFullBathrooms": 1,
                "halfBathrooms": 0,
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
            "booking_date": "2024-01-15",
            "time_slot": "9:00 AM - 11:00 AM",
            "special_instructions": "Please use eco-friendly products",
            "promo_code": None
        }
        
        response = requests.post(f"{API_URL}/bookings/guest", json=guest_booking_data)
        
        print(f"   - Response status: {response.status_code}")
        print(f"   - Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"❌ Guest booking creation failed: {response.text}")
            return False
        
        booking_result = response.json()
        print(f"✅ Guest booking created successfully!")
        print(f"   - Booking ID: {booking_result.get('id', 'N/A')}")
        print(f"   - Customer ID: {booking_result.get('customer_id', 'N/A')}")
        print(f"   - User ID: {booking_result.get('user_id', 'N/A')}")
        print(f"   - Total Amount: ${booking_result.get('total_amount', 'N/A')}")
        
        # Step 2: Test guest booking with promo code
        print("\n2. Testing guest booking with promo code...")
        
        # First create a promo code
        print("   - Creating promo code for testing...")
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
        
        promo_data = {
            "code": "GUEST10",
            "description": "Guest checkout promo",
            "discount_type": "percentage",
            "discount_value": 10.0,
            "is_active": True
        }
        
        promo_response = requests.post(f"{API_URL}/admin/promo-codes", json=promo_data, headers=admin_headers)
        if promo_response.status_code != 200:
            print(f"❌ Promo code creation failed: {promo_response.text}")
            return False
        
        print("   - Promo code created successfully")
        
        # Now test guest booking with promo code
        guest_booking_with_promo = guest_booking_data.copy()
        guest_booking_with_promo["promo_code"] = "GUEST10"
        guest_booking_with_promo["customer"]["email"] = "guest2@example.com"
        
        response = requests.post(f"{API_URL}/bookings/guest", json=guest_booking_with_promo)
        
        if response.status_code != 200:
            print(f"❌ Guest booking with promo code failed: {response.text}")
            return False
        
        booking_with_promo = response.json()
        print(f"✅ Guest booking with promo code created successfully!")
        print(f"   - Booking ID: {booking_with_promo.get('id', 'N/A')}")
        print(f"   - Total Amount: ${booking_with_promo.get('total_amount', 'N/A')}")
        print(f"   - Expected discount: 10% of $120 = $12")
        print(f"   - Expected final amount: $108")
        
        # Step 3: Test validation of guest booking data
        print("\n3. Testing guest booking data validation...")
        
        # Test with missing required fields
        invalid_booking = guest_booking_data.copy()
        del invalid_booking["customer"]["email"]
        
        response = requests.post(f"{API_URL}/bookings/guest", json=invalid_booking)
        if response.status_code == 200:
            print("❌ Should have failed with missing email")
            return False
        
        print("✅ Validation working correctly - missing email rejected")
        
        # Step 4: Test that guest bookings don't require authentication
        print("\n4. Testing that guest bookings don't require authentication...")
        
        # This should work without any authentication headers
        response = requests.post(f"{API_URL}/bookings/guest", json=guest_booking_data)
        if response.status_code != 200:
            print(f"❌ Guest booking should work without authentication: {response.text}")
            return False
        
        print("✅ Guest bookings work without authentication")
        
        # Step 5: Test that regular bookings still require authentication
        print("\n5. Testing that regular bookings still require authentication...")
        
        response = requests.post(f"{API_URL}/bookings", json=guest_booking_data)
        if response.status_code == 200:
            print("❌ Regular booking should require authentication")
            return False
        
        print("✅ Regular bookings correctly require authentication")
        
        print("\n🎉 All guest checkout tests passed!")
        print("✅ Guest checkout functionality is working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = test_guest_checkout()
        if success:
            print("\n✅ Guest checkout functionality is working correctly!")
        else:
            print("\n❌ Guest checkout functionality has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
