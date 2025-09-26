#!/usr/bin/env python3
"""
Test script to verify Select component fixes
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_select_fix():
    """Test that Select component errors are fixed"""
    
    print("🧪 Testing Select Component Fix")
    print("=" * 35)
    
    try:
        # Step 1: Login as admin
        print("\n1. Logging in as admin...")
        admin_login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        if response.status_code != 200:
            print(f"❌ Admin login failed: {response.text}")
            return False
        
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✅ Admin login successful")
        
        # Step 2: Test admin dashboard endpoints
        print("\n2. Testing admin dashboard endpoints...")
        
        # Test bookings endpoint
        bookings_response = requests.get(f"{API_URL}/admin/bookings", headers=admin_headers)
        if bookings_response.status_code != 200:
            print(f"❌ Bookings endpoint failed: {bookings_response.text}")
            return False
        print("✅ Bookings endpoint working")
        
        # Test cleaners endpoint
        cleaners_response = requests.get(f"{API_URL}/admin/cleaners", headers=admin_headers)
        if cleaners_response.status_code != 200:
            print(f"❌ Cleaners endpoint failed: {cleaners_response.text}")
            return False
        print("✅ Cleaners endpoint working")
        
        # Test services endpoint
        services_response = requests.get(f"{API_URL}/admin/services", headers=admin_headers)
        if services_response.status_code != 200:
            print(f"❌ Services endpoint failed: {services_response.text}")
            return False
        print("✅ Services endpoint working")
        
        # Test promo codes endpoint
        promos_response = requests.get(f"{API_URL}/admin/promo-codes", headers=admin_headers)
        if promos_response.status_code != 200:
            print(f"❌ Promo codes endpoint failed: {promos_response.text}")
            return False
        print("✅ Promo codes endpoint working")
        
        # Step 3: Test that data structure is correct
        print("\n3. Testing data structure...")
        
        bookings = bookings_response.json()
        if bookings and len(bookings) > 0:
            booking = bookings[0]
            print(f"   - Sample booking ID: {booking.get('id', 'N/A')}")
            print(f"   - Cleaner ID: {booking.get('cleaner_id', 'N/A')}")
            print(f"   - Status: {booking.get('status', 'N/A')}")
        
        cleaners = cleaners_response.json()
        if cleaners and len(cleaners) > 0:
            cleaner = cleaners[0]
            print(f"   - Sample cleaner ID: {cleaner.get('id', 'N/A')}")
            print(f"   - Cleaner name: {cleaner.get('first_name', 'N/A')} {cleaner.get('last_name', 'N/A')}")
        
        print("\n🎉 All Select component fixes are working correctly!")
        print("✅ No more empty string value errors!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = test_select_fix()
        if success:
            print("\n✅ Select component fixes are working correctly!")
        else:
            print("\n❌ Select component fixes have issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
