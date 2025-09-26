#!/usr/bin/env python3
"""
Debug script to identify ObjectId serialization issues
"""

import requests
import json
from bson import ObjectId

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def debug_objectid_issue():
    """Debug the ObjectId serialization issue"""
    
    print("🔍 Debugging ObjectId Serialization Issue")
    print("=" * 50)
    
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
        
        # Step 2: Create a test promo code
        print("\n2. Creating test promo code...")
        promo_data = {
            "code": "DEBUG20",
            "description": "Debug test promo code",
            "discount_type": "percentage",
            "discount_value": 20.0,
            "is_active": True
        }
        
        response = requests.post(f"{API_URL}/admin/promo-codes", json=promo_data, headers=admin_headers)
        if response.status_code != 200:
            print(f"❌ Promo code creation failed: {response.text}")
            return False
        
        created_promo = response.json()
        print(f"✅ Test promo code created successfully")
        print(f"   - Promo ID: {created_promo.get('id', 'N/A')}")
        print(f"   - Promo ID type: {type(created_promo.get('id', 'N/A'))}")
        
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
        
        # Step 4: Test promo code validation with detailed debugging
        print("\n4. Testing promo code validation with debugging...")
        validation_data = {
            "code": "DEBUG20",
            "subtotal": 100.0
        }
        
        print(f"   - Sending validation request...")
        print(f"   - Validation data: {validation_data}")
        
        response = requests.post(f"{API_URL}/validate-promo-code", json=validation_data, headers=customer_headers)
        
        print(f"   - Response status: {response.status_code}")
        print(f"   - Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"❌ Promo code validation failed: {response.text}")
            return False
        
        validation_result = response.json()
        print(f"✅ Promo code validation successful!")
        print(f"   - Valid: {validation_result['valid']}")
        print(f"   - Discount: ${validation_result['discount']}")
        print(f"   - Final Amount: ${validation_result['final_amount']}")
        
        # Step 5: Check the promo data structure
        print("\n5. Analyzing promo data structure...")
        if 'promo' in validation_result:
            promo = validation_result['promo']
            print(f"   - Promo keys: {list(promo.keys())}")
            
            for key, value in promo.items():
                print(f"   - {key}: {type(value)} = {value}")
                
                # Check for ObjectId instances
                if hasattr(value, '__class__') and 'ObjectId' in str(value.__class__):
                    print(f"❌ Found ObjectId in {key}: {value}")
                    return False
                
                # Check for nested structures
                if isinstance(value, dict):
                    for nested_key, nested_value in value.items():
                        print(f"     - {nested_key}: {type(nested_value)} = {nested_value}")
                        if hasattr(nested_value, '__class__') and 'ObjectId' in str(nested_value.__class__):
                            print(f"❌ Found ObjectId in {key}.{nested_key}: {nested_value}")
                            return False
                
                if isinstance(value, list):
                    for i, item in enumerate(value):
                        print(f"     - [{i}]: {type(item)} = {item}")
                        if hasattr(item, '__class__') and 'ObjectId' in str(item.__class__):
                            print(f"❌ Found ObjectId in {key}[{i}]: {item}")
                            return False
        
        # Step 6: Test JSON serialization
        print("\n6. Testing JSON serialization...")
        try:
            json_str = json.dumps(validation_result)
            print(f"✅ JSON serialization successful!")
            print(f"   - JSON length: {len(json_str)} characters")
        except Exception as e:
            print(f"❌ JSON serialization failed: {e}")
            return False
        
        print("\n🎉 All debugging tests passed!")
        print("✅ No ObjectId serialization issues detected!")
        return True
        
    except Exception as e:
        print(f"\n❌ Debug failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = debug_objectid_issue()
        if success:
            print("\n✅ Debug completed successfully!")
        else:
            print("\n❌ Debug found issues!")
    except Exception as e:
        print(f"\n❌ Debug failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
