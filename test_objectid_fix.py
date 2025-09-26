#!/usr/bin/env python3
"""
Test to verify the ObjectId serialization fix
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_objectid_serialization_fix():
    """Test that ObjectId serialization is working correctly"""
    
    print("🧪 Testing ObjectId Serialization Fix")
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
        "code": "OBJID20",
        "description": "ObjectId test promo code",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "is_active": True
    }
    
    response = requests.post(f"{API_URL}/admin/promo-codes", json=promo_data, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Promo code creation failed: {response.text}")
        return False
    
    print("✅ Test promo code created successfully")
    
    # Step 3: Test admin promo codes list (should not have ObjectId errors)
    print("\n3. Testing admin promo codes list...")
    response = requests.get(f"{API_URL}/admin/promo-codes", headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Admin promo codes list failed: {response.text}")
        return False
    
    promos = response.json()
    print(f"✅ Admin promo codes list successful!")
    print(f"   - Found {len(promos)} promo codes")
    
    # Step 4: Login as customer
    print("\n4. Logging in as customer...")
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
    
    # Step 5: Test promo code validation (should not have ObjectId errors)
    print("\n5. Testing promo code validation...")
    validation_data = {
        "code": "OBJID20",
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
    
    # Step 6: Verify no ObjectId serialization errors
    print("\n6. Verifying no ObjectId serialization errors...")
    try:
        # Try to parse the JSON response
        json.dumps(validation_result)
        json.dumps(promos)
        print("✅ No ObjectId serialization errors detected!")
    except Exception as e:
        print(f"❌ ObjectId serialization error detected: {e}")
        return False
    
    # Step 7: Check that promo data is properly serialized
    print("\n7. Checking promo data serialization...")
    if 'promo' in validation_result:
        promo = validation_result['promo']
        print(f"   - Promo ID type: {type(promo.get('id', 'N/A'))}")
        print(f"   - Promo ID value: {promo.get('id', 'N/A')}")
        
        # Check if any values are ObjectId instances
        for key, value in promo.items():
            if hasattr(value, '__class__') and 'ObjectId' in str(value.__class__):
                print(f"❌ Found ObjectId in {key}: {value}")
                return False
        
        print("✅ All promo data is properly serialized!")
    
    print("\n🎉 All ObjectId serialization tests passed!")
    print("✅ The ObjectId serialization fix is working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_objectid_serialization_fix()
        if success:
            print("\n✅ ObjectId serialization fix is working correctly!")
        else:
            print("\n❌ ObjectId serialization fix has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
