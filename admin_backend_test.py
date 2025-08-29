import requests
import sys
import json
from datetime import datetime, timedelta

class AdminAPITester:
    def __init__(self, base_url="https://maid-booking-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.created_cleaner_id = None
        self.created_service_id = None
        self.created_faq_id = None
        self.test_booking_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: Found {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")

            return success, response.json() if response.status_code < 400 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with admin credentials"""
        login_data = {
            "email": "admin@maids.com",
            "password": "admin@maids@1234"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            user_role = response.get('user', {}).get('role')
            print(f"   ✅ Admin login successful")
            print(f"   User role: {user_role}")
            print(f"   Admin: {response['user']['first_name']} {response['user']['last_name']}")
            
            if user_role != 'admin':
                print(f"   ❌ Expected admin role, got: {user_role}")
                return False, response
        return success, response

    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        success, response = self.run_test(
            "Get Admin Dashboard Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            expected_fields = ['total_bookings', 'pending_bookings', 'completed_bookings', 
                             'total_customers', 'total_cleaners', 'total_revenue', 'open_tickets']
            
            for field in expected_fields:
                if field in response:
                    print(f"   ✅ {field}: {response[field]}")
                else:
                    print(f"   ❌ Missing field: {field}")
        
        return success, response

    def test_get_all_bookings(self):
        """Test GET /api/admin/bookings"""
        success, response = self.run_test(
            "Get All Bookings (Admin)",
            "GET",
            "admin/bookings",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} total bookings")
            if len(response) > 0:
                self.test_booking_id = response[0]['id']
                print(f"   Using booking ID for testing: {self.test_booking_id}")
                
                # Show booking details
                booking = response[0]
                print(f"   Sample booking: {booking['house_size']} • ${booking['total_amount']} • {booking['status']}")
        
        return success, response

    def test_update_booking_status(self):
        """Test PATCH /api/admin/bookings/{booking_id}"""
        if not self.test_booking_id:
            print("❌ No booking ID available, skipping booking update test")
            return False, {}
            
        update_data = {
            "status": "confirmed"
        }
        
        success, response = self.run_test(
            "Update Booking Status",
            "PATCH",
            f"admin/bookings/{self.test_booking_id}",
            200,
            data=update_data
        )
        
        return success, response

    def test_get_cleaners(self):
        """Test GET /api/admin/cleaners"""
        success, response = self.run_test(
            "Get All Cleaners",
            "GET",
            "admin/cleaners",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} cleaners")
            for cleaner in response[:3]:  # Show first 3
                print(f"   - {cleaner['first_name']} {cleaner['last_name']}: {cleaner['email']}")
        
        return success, response

    def test_create_cleaner(self):
        """Test POST /api/admin/cleaners"""
        timestamp = datetime.now().strftime('%H%M%S')
        cleaner_data = {
            "email": f"cleaner_{timestamp}@test.com",
            "first_name": "Test",
            "last_name": "Cleaner",
            "phone": "555-123-4567"
        }
        
        success, response = self.run_test(
            "Create New Cleaner",
            "POST",
            "admin/cleaners",
            200,
            data=cleaner_data
        )
        
        if success and 'id' in response:
            self.created_cleaner_id = response['id']
            print(f"   ✅ Cleaner created with ID: {self.created_cleaner_id}")
            print(f"   Name: {response['first_name']} {response['last_name']}")
        
        return success, response

    def test_assign_cleaner_to_booking(self):
        """Test assigning cleaner to booking"""
        if not self.test_booking_id or not self.created_cleaner_id:
            print("❌ Missing booking ID or cleaner ID, skipping assignment test")
            return False, {}
            
        update_data = {
            "cleaner_id": self.created_cleaner_id
        }
        
        success, response = self.run_test(
            "Assign Cleaner to Booking",
            "PATCH",
            f"admin/bookings/{self.test_booking_id}",
            200,
            data=update_data
        )
        
        return success, response

    def test_delete_cleaner(self):
        """Test DELETE /api/admin/cleaners/{cleaner_id}"""
        if not self.created_cleaner_id:
            print("❌ No cleaner ID available, skipping delete test")
            return False, {}
            
        success, response = self.run_test(
            "Delete Cleaner",
            "DELETE",
            f"admin/cleaners/{self.created_cleaner_id}",
            200
        )
        
        return success, response

    def test_get_services(self):
        """Test GET /api/services (all services)"""
        success, response = self.run_test(
            "Get All Services",
            "GET",
            "services",
            200,
            auth_required=False
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} services")
            standard_count = len([s for s in response if not s.get('is_a_la_carte', False)])
            a_la_carte_count = len([s for s in response if s.get('is_a_la_carte', False)])
            print(f"   Standard services: {standard_count}")
            print(f"   A la carte services: {a_la_carte_count}")
        
        return success, response

    def test_create_service(self):
        """Test POST /api/admin/services"""
        timestamp = datetime.now().strftime('%H%M%S')
        service_data = {
            "name": f"Test Service {timestamp}",
            "category": "a_la_carte",
            "description": "Test service for admin testing",
            "is_a_la_carte": True,
            "a_la_carte_price": 25.0,
            "duration_hours": 1
        }
        
        success, response = self.run_test(
            "Create New Service",
            "POST",
            "admin/services",
            200,
            data=service_data
        )
        
        if success and 'id' in response:
            self.created_service_id = response['id']
            print(f"   ✅ Service created with ID: {self.created_service_id}")
            print(f"   Name: {response['name']}")
            print(f"   Price: ${response.get('a_la_carte_price', 'N/A')}")
        
        return success, response

    def test_delete_service(self):
        """Test DELETE /api/admin/services/{service_id}"""
        if not self.created_service_id:
            print("❌ No service ID available, skipping delete test")
            return False, {}
            
        success, response = self.run_test(
            "Delete Service",
            "DELETE",
            f"admin/services/{self.created_service_id}",
            200
        )
        
        return success, response

    def test_get_faqs(self):
        """Test GET /api/admin/faqs"""
        success, response = self.run_test(
            "Get All FAQs",
            "GET",
            "admin/faqs",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} FAQs")
            for faq in response[:2]:  # Show first 2
                print(f"   - {faq['question'][:50]}...")
        
        return success, response

    def test_create_faq(self):
        """Test POST /api/admin/faqs"""
        timestamp = datetime.now().strftime('%H%M%S')
        faq_data = {
            "question": f"Test FAQ Question {timestamp}?",
            "answer": "This is a test FAQ answer for admin testing purposes.",
            "category": "Testing",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create New FAQ",
            "POST",
            "admin/faqs",
            200,
            data=faq_data
        )
        
        if success and 'id' in response:
            self.created_faq_id = response['id']
            print(f"   ✅ FAQ created with ID: {self.created_faq_id}")
            print(f"   Question: {response['question']}")
        
        return success, response

    def test_delete_faq(self):
        """Test DELETE /api/admin/faqs/{faq_id}"""
        if not self.created_faq_id:
            print("❌ No FAQ ID available, skipping delete test")
            return False, {}
            
        success, response = self.run_test(
            "Delete FAQ",
            "DELETE",
            f"admin/faqs/{self.created_faq_id}",
            200
        )
        
        return success, response

    def test_get_tickets(self):
        """Test GET /api/admin/tickets"""
        success, response = self.run_test(
            "Get All Support Tickets",
            "GET",
            "admin/tickets",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} support tickets")
            for ticket in response[:2]:  # Show first 2
                print(f"   - {ticket['subject']}: {ticket['status']} ({ticket['priority']})")
        
        return success, response

    def test_export_bookings(self):
        """Test GET /api/admin/export/bookings"""
        success, response = self.run_test(
            "Export Bookings to CSV",
            "GET",
            "admin/export/bookings",
            200
        )
        
        if success:
            if 'data' in response and 'filename' in response:
                csv_data = response['data']
                filename = response['filename']
                print(f"   ✅ Export successful")
                print(f"   Filename: {filename}")
                print(f"   Records: {len(csv_data) if isinstance(csv_data, list) else 'N/A'}")
                
                # Check CSV structure
                if isinstance(csv_data, list) and len(csv_data) > 0:
                    headers = list(csv_data[0].keys())
                    print(f"   CSV Headers: {', '.join(headers[:5])}...")
            else:
                print(f"   ❌ Invalid export response format")
        
        return success, response

    def test_unauthorized_access(self):
        """Test that non-admin users cannot access admin endpoints"""
        # Test without token
        success, response = self.run_test(
            "Admin Endpoint Without Token",
            "GET",
            "admin/stats",
            401,
            auth_required=False
        )
        
        # This should fail (401), so we invert the success
        if success:  # If we got 401 as expected
            print(f"   ✅ Properly blocked unauthorized access")
        else:
            print(f"   ❌ Should have blocked unauthorized access")
        
        return success, response

def main():
    print("🛡️  Starting Admin Dashboard API Tests")
    print("=" * 60)
    
    tester = AdminAPITester()
    
    # Test sequence
    print("\n🔐 Testing Admin Authentication...")
    login_success, _ = tester.test_admin_login()
    if not login_success:
        print("❌ Admin login failed, cannot proceed with admin tests")
        return 1
    
    print("\n📊 Testing Admin Dashboard...")
    tester.test_admin_stats()
    
    print("\n📅 Testing Booking Management...")
    tester.test_get_all_bookings()
    tester.test_update_booking_status()
    
    print("\n👥 Testing Cleaner Management...")
    tester.test_get_cleaners()
    tester.test_create_cleaner()
    tester.test_assign_cleaner_to_booking()
    tester.test_delete_cleaner()
    
    print("\n🛍️ Testing Service Management...")
    tester.test_get_services()
    tester.test_create_service()
    tester.test_delete_service()
    
    print("\n❓ Testing FAQ Management...")
    tester.test_get_faqs()
    tester.test_create_faq()
    tester.test_delete_faq()
    
    print("\n🎫 Testing Support Tickets...")
    tester.test_get_tickets()
    
    print("\n📤 Testing Data Export...")
    tester.test_export_bookings()
    
    print("\n🔒 Testing Security...")
    tester.test_unauthorized_access()
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All admin tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} admin tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())