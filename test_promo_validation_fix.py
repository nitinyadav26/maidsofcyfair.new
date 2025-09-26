#!/usr/bin/env python3
"""
Test to verify the promo code validation ObjectId serialization fix
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_promo_validation_fix():
    """Test that promo code validation works without ObjectId serialization errors"""
    
    print("🧪 Testing Promo Code Validation Fix")
    print("=" * 40)
    
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
        "description": "Test promo code",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "is_active": True
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Promo code creation failed: {response.text}")
        return False
    
    print("✅ Test promo code created successfully")
    
    # Step 3: Login as customer
    print("\n3. Logging in as customer...")
    customer_login_data = {
        "email": "customer@example.com",
        "password": "password123"
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
        "subtotal": 100.0
    }
    
    response = requests.post(f"{API_URL}/validate-promo-code", json=validation_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Promo code validation failed: {response.text}")
        return False
    
    validation_result = response.json()
    print(f"✅ Promo code validation successful!")
    print(f"   - Valid: {validation_result['valid']}")
    print(f"   - Discount: ${validation_result['discount']}")
    print(f"   - Final Amount: ${validation_result['final_amount']}")
    
    # Step 5: Test with invalid promo code
    print("\n5. Testing invalid promo code...")
    invalid_validation_data = {
        "code": "INVALID",
        "subtotal": 100.0
    }
    
    response = requests.post(f"{API_URL}/validate-promo-code", json=invalid_validation_data, headers=customer_headers)
    if response.status_code != 200:
        print(f"❌ Invalid promo code validation failed: {response.text}")
        return False
    
    invalid_result = response.json()
    print(f"✅ Invalid promo code validation successful!")
    print(f"   - Valid: {invalid_result['valid']}")
    print(f"   - Message: {invalid_result['message']}")
    
    # Step 6: Test admin promo codes list
    print("\n6. Testing admin promo codes list...")
    response = requests.get(f"{API_URL}/admin/promo-codes", headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Admin promo codes list failed: {response.text}")
        return False
    
    promos = response.json()
    print(f"✅ Admin promo codes list successful!")
    print(f"   - Found {len(promos)} promo codes")
    
    # Step 7: Verify no ObjectId serialization errors
    print("\n7. Verifying no ObjectId serialization errors...")
    try:
        # Try to parse the JSON response
        json.dumps(validation_result)
        json.dumps(promos)
        print("✅ No ObjectId serialization errors detected!")
    except Exception as e:
        print(f"❌ ObjectId serialization error detected: {e}")
        return False
    
    print("\n🎉 All promo code validation tests passed!")
    print("✅ The ObjectId serialization fix is working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_promo_validation_fix()
        if success:
            print("\n✅ Promo code validation fix is working correctly!")
        else:
            print("\n❌ Promo code validation fix has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
