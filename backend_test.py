import requests
import sys
import json
from datetime import datetime, timedelta

class MaidsBookingAPITester:
    def __init__(self, base_url="https://maidsbooking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.user_id = None
        self.booking_id = None
        self.customer_id = None
        self.available_date = None
        self.time_slot = None
        self.a_la_carte_services = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

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

    def test_login(self):
        """Test POST /api/auth/login with demo credentials"""
        login_data = {
            "email": "test@maids.com",
            "password": "test@maids@1234"
        }
        
        success, response = self.run_test(
            "Login with Demo Credentials",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   ✅ Login successful, token obtained")
            print(f"   User: {response['user']['first_name']} {response['user']['last_name']}")
        return success, response

    def test_auth_me(self):
        """Test GET /api/auth/me with token"""
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        return success, response

    def test_register_new_user(self):
        """Test POST /api/auth/register"""
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"newuser_{timestamp}@test.com",
            "password": "TestPassword123!",
            "first_name": "New",
            "last_name": "User",
            "phone": "555-123-4567"
        }
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if success and 'access_token' in response:
            print(f"   ✅ Registration successful")
            print(f"   New User: {response['user']['first_name']} {response['user']['last_name']}")
        return success, response

    def test_pricing_endpoints(self):
        """Test pricing endpoints for different house sizes and frequencies"""
        house_sizes = ["1000-1500", "2000-2500", "3000-3500", "5000+"]
        frequencies = ["one_time", "monthly", "bi_weekly", "weekly"]
        
        pricing_tests_passed = 0
        total_pricing_tests = 0
        
        for house_size in house_sizes:
            for frequency in frequencies:
                total_pricing_tests += 1
                success, response = self.run_test(
                    f"Get Pricing for {house_size} sq ft, {frequency}",
                    "GET",
                    f"pricing/{house_size}/{frequency}",
                    200
                )
                
                if success and 'base_price' in response:
                    pricing_tests_passed += 1
                    base_price = response['base_price']
                    print(f"   Price: ${base_price}")
                    
                    # Verify minimum pricing of $125
                    if base_price >= 125:
                        print(f"   ✅ Meets minimum pricing requirement ($125)")
                    else:
                        print(f"   ❌ Below minimum pricing: ${base_price} < $125")
        
        print(f"\n📊 Pricing Tests: {pricing_tests_passed}/{total_pricing_tests} passed")
        return pricing_tests_passed == total_pricing_tests

    def test_get_a_la_carte_services(self):
        """Test GET /api/services/a-la-carte"""
        success, response = self.run_test(
            "Get A La Carte Services",
            "GET",
            "services/a-la-carte",
            200
        )
        
        if success and isinstance(response, list):
            self.a_la_carte_services = response
            print(f"   ✅ Found {len(response)} a la carte services")
            
            # Verify expected services
            expected_services = ["Blinds", "Oven Cleaning", "Inside Refrigerator"]
            found_services = [service['name'] for service in response]
            
            for expected in expected_services:
                if any(expected in name for name in found_services):
                    print(f"   ✅ Found expected service: {expected}")
                else:
                    print(f"   ❌ Missing expected service: {expected}")
                    
            # Show pricing for some services
            for service in response[:3]:
                if service.get('a_la_carte_price'):
                    print(f"   {service['name']}: ${service['a_la_carte_price']}")
        
        return success, response

    def test_get_standard_services(self):
        """Test GET /api/services/standard"""
        success, response = self.run_test(
            "Get Standard Services",
            "GET",
            "services/standard",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} standard services")
            for service in response:
                print(f"   - {service['name']}: {service['description'][:50]}...")
        
        return success, response

    def test_get_available_dates(self):
        """Test GET /api/available-dates"""
        success, response = self.run_test(
            "Get Available Dates",
            "GET",
            "available-dates",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.available_date = response[0]  # Store first available date
            print(f"   ✅ Found {len(response)} available dates")
            print(f"   Using date for testing: {self.available_date}")
        return success, response

    def test_get_time_slots(self):
        """Test GET /api/time-slots?date=YYYY-MM-DD"""
        if not self.available_date:
            print("❌ No available date found, skipping time slots test")
            return False, {}
            
        success, response = self.run_test(
            "Get Time Slots for Date",
            "GET",
            "time-slots",
            200,
            params={"date": self.available_date}
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.time_slot = f"{response[0]['start_time']}-{response[0]['end_time']}"
            print(f"   ✅ Found {len(response)} time slots")
            print(f"   Using time slot: {self.time_slot}")
        return success, response

    def test_create_booking_with_a_la_carte(self):
        """Test POST /api/bookings with a la carte services"""
        if not self.available_date or not self.time_slot:
            print("❌ Missing date or time slot, skipping booking creation")
            return False, {}
        
        if not self.a_la_carte_services:
            print("❌ No a la carte services available, skipping booking creation")
            return False, {}
            
        # Select first few a la carte services for testing
        selected_services = self.a_la_carte_services[:3]
        a_la_carte_items = []
        
        for service in selected_services:
            a_la_carte_items.append({
                "service_id": service['id'],
                "quantity": 1,
                "special_instructions": f"Test {service['name']}"
            })
            
        booking_data = {
            "customer": {
                "email": f"booking_test_{datetime.now().strftime('%H%M%S')}@example.com",
                "first_name": "Jane",
                "last_name": "Smith",
                "phone": "555-987-6543",
                "address": "456 Booking Ave",
                "city": "Houston",
                "state": "TX",
                "zip_code": "77002",
                "is_guest": False
            },
            "house_size": "2000-2500",
            "frequency": "monthly",
            "services": [
                {
                    "service_id": "standard-cleaning-id",
                    "quantity": 1,
                    "special_instructions": "Standard cleaning service"
                }
            ],
            "a_la_carte_services": a_la_carte_items,
            "booking_date": self.available_date,
            "time_slot": self.time_slot,
            "special_instructions": "Test booking with a la carte services"
        }
        
        success, response = self.run_test(
            "Create Booking with A La Carte Services",
            "POST",
            "bookings",
            200,
            data=booking_data,
            auth_required=True
        )
        
        if success and 'id' in response:
            self.booking_id = response['id']
            print(f"   ✅ Booking created with ID: {self.booking_id}")
            print(f"   Base Price: ${response.get('base_price', 0)}")
            print(f"   A La Carte Total: ${response.get('a_la_carte_total', 0)}")
            print(f"   Total Amount: ${response.get('total_amount', 0)}")
        return success, response

    def test_get_bookings(self):
        """Test GET /api/bookings (user's bookings)"""
        success, response = self.run_test(
            "Get User Bookings",
            "GET",
            "bookings",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} bookings for user")
            for booking in response:
                print(f"   - Booking {booking['id']}: ${booking['total_amount']} on {booking['booking_date']}")
        
        return success, response

    def test_get_booking_by_id(self):
        """Test GET /api/bookings/{booking_id}"""
        if not self.booking_id:
            print("❌ No booking ID available, skipping get booking test")
            return False, {}
            
        success, response = self.run_test(
            "Get Booking by ID",
            "GET",
            f"bookings/{self.booking_id}",
            200
        )
        return success, response

    def test_process_payment(self):
        """Test POST /api/process-payment/{booking_id}"""
        if not self.booking_id:
            print("❌ No booking ID available, skipping payment test")
            return False, {}
            
        payment_data = {
            "card_number": "4111111111111111",
            "expiry_month": "12",
            "expiry_year": "2025",
            "cvv": "123",
            "amount": 200.00
        }
        
        success, response = self.run_test(
            "Process Payment (Mock)",
            "POST",
            f"process-payment/{self.booking_id}",
            200,
            data=payment_data
        )
        if success:
            payment_success = response.get('success', False)
            print(f"   Payment Result: {'✅ Success' if payment_success else '❌ Failed'}")
            print(f"   Payment Status: {response.get('payment_status')}")
            print(f"   Booking Status: {response.get('booking_status')}")
        return success, response

def main():
    print("🧪 Starting Maids of Cyfair Booking System API Tests")
    print("=" * 60)
    
    tester = MaidsBookingAPITester()
    
    # Test sequence
    print("\n🔐 Testing Authentication Endpoints...")
    login_success, _ = tester.test_login()
    if not login_success:
        print("❌ Login failed, cannot proceed with authenticated tests")
        return 1
    
    tester.test_auth_me()
    tester.test_register_new_user()
    
    print("\n💰 Testing Pricing Endpoints...")
    tester.test_pricing_endpoints()
    
    print("\n🛍️ Testing Services Endpoints...")
    tester.test_get_standard_services()
    tester.test_get_a_la_carte_services()
    
    print("\n📅 Testing Date/Time Endpoints...")
    tester.test_get_available_dates()
    tester.test_get_time_slots()
    
    print("\n📝 Testing Booking Endpoints...")
    tester.test_create_booking_with_a_la_carte()
    tester.test_get_bookings()
    tester.test_get_booking_by_id()
    
    print("\n💳 Testing Payment Processing...")
    tester.test_process_payment()
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())