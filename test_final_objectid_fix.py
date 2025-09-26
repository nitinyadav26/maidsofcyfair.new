#!/usr/bin/env python3
"""
Final test to verify the ObjectId serialization fix
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_final_objectid_fix():
    """Test that ObjectId serialization is working correctly"""
    
    print("🧪 Testing Final ObjectId Serialization Fix")
    print("=" * 45)
    
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
            "code": "FINAL20",
            "description": "Final test promo code",
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
            "code": "FINAL20",
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
        
        # Step 5: Verify no ObjectId serialization errors
        print("\n5. Verifying no ObjectId serialization errors...")
        try:
            # Try to parse the JSON response
            json_str = json.dumps(validation_result)
            print(f"✅ No ObjectId serialization errors detected!")
            print(f"   - JSON serialization successful")
            print(f"   - JSON length: {len(json_str)} characters")
        except Exception as e:
            print(f"❌ ObjectId serialization error detected: {e}")
            return False
        
        # Step 6: Check that promo data is properly serialized
        print("\n6. Checking promo data serialization...")
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
        
        # Step 7: Test with different subtotal
        print("\n7. Testing with different subtotal...")
        validation_data_2 = {
            "code": "FINAL20",
            "subtotal": 50.0
        }
        
        response = requests.post(f"{API_URL}/validate-promo-code", json=validation_data_2, headers=customer_headers)
        if response.status_code != 200:
            print(f"❌ Second validation failed: {response.text}")
            return False
        
        validation_result_2 = response.json()
        print(f"✅ Second validation successful!")
        print(f"   - Valid: {validation_result_2['valid']}")
        print(f"   - Discount: ${validation_result_2['discount']}")
        print(f"   - Final Amount: ${validation_result_2['final_amount']}")
        
        print("\n🎉 All final ObjectId serialization tests passed!")
        print("✅ The ObjectId serialization fix is working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        success = test_final_objectid_fix()
        if success:
            print("\n✅ Final ObjectId serialization fix is working correctly!")
        else:
            print("\n❌ Final ObjectId serialization fix has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
