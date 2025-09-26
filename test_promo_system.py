#!/usr/bin/env python3
"""
Test script for the promo code system
This script tests the promo code API endpoints to ensure they work correctly
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_promo_system():
    """Test the complete promo code system"""
    
    print("🧪 Testing Promo Code System")
    print("=" * 50)
    
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
    
    # Step 2: Create a test promo code
    print("\n2. Creating test promo code...")
    promo_data = {
        "code": "TEST20",
        "description": "20% off test discount",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "minimum_order_amount": 100.0,
        "maximum_discount_amount": 50.0,
        "usage_limit": 10,
        "usage_limit_per_customer": 1,
        "valid_from": datetime.utcnow().isoformat(),
        "valid_until": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "is_active": True,
        "applicable_services": [],
        "applicable_customers": []
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Failed to create promo code: {response.text}")
        return False
    
    promo_code = response.json()
    print(f"✅ Promo code created: {promo_code['code']}")
    
    # Step 3: Login as customer
    print("\n3. Logging in as customer...")
    customer_login_data = {
        "email": "test@maids.com",
        "password": "test@maids@1234"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=customer_login_data)
    if response.status_code != 200:
        print(f"❌ Customer login failed: {response.text}")
        return False
    
    customer_token = response.json()["access_token"]
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    print("✅ Customer login successful")
    
    # Step 4: Test promo code validation
    print("\n4. Testing promo code validation...")
    validation_data = {
        "code": "TEST20",
        "subtotal": 150.0
    }
    
    response = requests.post(f"{API_URL}/validate-promo-code", json=validation_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Promo code validation failed: {response.text}")
        return False
    
    validation_result = response.json()
    if not validation_result["valid"]:
        print(f"❌ Promo code validation returned invalid: {validation_result}")
        return False
    
    print(f"✅ Promo code validation successful")
    print(f"   Discount: ${validation_result['discount']}")
    print(f"   Final amount: ${validation_result['final_amount']}")
    
    # Step 5: Test invalid promo code
    print("\n5. Testing invalid promo code...")
    invalid_validation_data = {
        "code": "INVALID",
        "subtotal": 150.0
    }
    
    response = requests.post(f"{API_URL}/validate-promo-code", json=invalid_validation_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Invalid promo code test failed: {response.text}")
        return False
    
    invalid_result = response.json()
    if invalid_result["valid"]:
        print(f"❌ Invalid promo code was accepted: {invalid_result}")
        return False
    
    print(f"✅ Invalid promo code correctly rejected: {invalid_result['message']}")
    
    # Step 6: Test minimum order amount
    print("\n6. Testing minimum order amount validation...")
    low_order_validation = {
        "code": "TEST20",
        "subtotal": 50.0  # Below minimum of 100
    }
    
    response = requests.post(f"{API_URL}/validate-promo-code", json=low_order_validation, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Minimum order validation failed: {response.text}")
        return False
    
    min_order_result = response.json()
    if min_order_result["valid"]:
        print(f"❌ Minimum order validation failed - code was accepted")
        return False
    
    print(f"✅ Minimum order amount correctly enforced: {min_order_result['message']}")
    
    # Step 7: Get all promo codes
    print("\n7. Testing get all promo codes...")
    response = requests.get(f"{API_URL}/admin/promo-codes", headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Failed to get promo codes: {response.text}")
        return False
    
    promos = response.json()
    print(f"✅ Retrieved {len(promos)} promo codes")
    
    # Step 8: Test promo code usage in booking
    print("\n8. Testing promo code in booking...")
    booking_data = {
        "house_size": "2000-2500",
        "frequency": "monthly",
        "rooms": {
            "masterBedroom": True,
            "masterBathroom": True,
            "otherBedrooms": 2,
            "otherFullBathrooms": 1,
            "halfBathrooms": 0,
            "diningRoom": True,
            "kitchen": True,
            "livingRoom": True,
            "mediaRoom": False,
            "gameRoom": False,
            "office": False
        },
        "services": [{"service_id": "base_service", "quantity": 1}],
        "a_la_carte_services": [],
        "booking_date": "2024-02-15",
        "time_slot": "10:00-12:00",
        "base_price": 180.0,
        "address": {
            "street": "123 Test St",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001"
        },
        "special_instructions": "Test booking with promo code",
        "promo_code": "TEST20"
    }
    
    response = requests.post(f"{API_URL}/bookings", json=booking_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Booking with promo code failed: {response.text}")
        return False
    
    booking = response.json()
    print(f"✅ Booking created successfully with promo code")
    print(f"   Original amount: $180.00")
    print(f"   Final amount: ${booking['total_amount']}")
    print(f"   Discount applied: ${180.00 - booking['total_amount']}")
    
    # Step 9: Test duplicate usage
    print("\n9. Testing duplicate promo code usage...")
    response = requests.post(f"{API_URL}/validate-promo-code", json=validation_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Duplicate usage test failed: {response.text}")
        return False
    
    duplicate_result = response.json()
    if duplicate_result["valid"]:
        print(f"❌ Duplicate usage was allowed")
        return False
    
    print(f"✅ Duplicate usage correctly prevented: {duplicate_result['message']}")
    
    print("\n🎉 All promo code tests passed!")
    return True

if __name__ == "__main__":
    try:
        success = test_promo_system()
        if success:
            print("\n✅ Promo code system is working correctly!")
        else:
            print("\n❌ Promo code system has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
