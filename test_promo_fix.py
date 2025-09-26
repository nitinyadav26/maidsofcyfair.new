#!/usr/bin/env python3
"""
Quick test to verify the promo code creation fix
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_promo_creation_fix():
    """Test that promo code creation works with the fix"""
    
    print("🧪 Testing Promo Code Creation Fix")
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
    
    # Step 2: Test promo code creation with minimal data
    print("\n2. Testing promo code creation with minimal data...")
    minimal_promo_data = {
        "code": "MINIMAL20",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "is_active": True
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=minimal_promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Minimal promo code creation failed: {response.text}")
        return False
    
    print("✅ Minimal promo code created successfully")
    
    # Step 3: Test promo code creation with empty strings
    print("\n3. Testing promo code creation with empty strings...")
    empty_strings_promo_data = {
        "code": "EMPTY20",
        "description": "",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "minimum_order_amount": "",
        "maximum_discount_amount": "",
        "usage_limit": "",
        "usage_limit_per_customer": "",
        "valid_from": "",
        "valid_until": "",
        "is_active": True
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=empty_strings_promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Empty strings promo code creation failed: {response.text}")
        return False
    
    print("✅ Empty strings promo code created successfully")
    
    # Step 4: Test promo code creation with null values
    print("\n4. Testing promo code creation with null values...")
    null_values_promo_data = {
        "code": "NULL20",
        "description": None,
        "discount_type": "percentage",
        "discount_value": 20.0,
        "minimum_order_amount": None,
        "maximum_discount_amount": None,
        "usage_limit": None,
        "usage_limit_per_customer": None,
        "valid_from": None,
        "valid_until": None,
        "is_active": True
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=null_values_promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Null values promo code creation failed: {response.text}")
        return False
    
    print("✅ Null values promo code created successfully")
    
    # Step 5: Test promo code creation with full data
    print("\n5. Testing promo code creation with full data...")
    full_promo_data = {
        "code": "FULL20",
        "description": "Full test promo code",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "minimum_order_amount": 100.0,
        "maximum_discount_amount": 50.0,
        "usage_limit": 100,
        "usage_limit_per_customer": 2,
        "valid_from": "2024-01-01T00:00:00Z",
        "valid_until": "2024-12-31T23:59:59Z",
        "is_active": True,
        "applicable_services": [],
        "applicable_customers": []
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=full_promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Full promo code creation failed: {response.text}")
        return False
    
    print("✅ Full promo code created successfully")
    
    # Step 6: Verify all promo codes were created
    print("\n6. Verifying all promo codes were created...")
    response = requests.get(f"{API_URL}/admin/promo-codes", headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Failed to get promo codes: {response.text}")
        return False
    
    promos = response.json()
    created_codes = [promo["code"] for promo in promos]
    expected_codes = ["MINIMAL20", "EMPTY20", "NULL20", "FULL20"]
    
    for code in expected_codes:
        if code not in created_codes:
            print(f"❌ Promo code {code} not found in created codes")
            return False
    
    print(f"✅ All {len(expected_codes)} promo codes found in database")
    
    print("\n🎉 All promo code creation tests passed!")
    print("✅ The fix is working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_promo_creation_fix()
        if success:
            print("\n✅ Promo code creation fix is working correctly!")
        else:
            print("\n❌ Promo code creation fix has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
