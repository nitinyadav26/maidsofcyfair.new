import requests
import sys
import json
from datetime import datetime, timedelta

class MaidsBookingAPITester:
    def __init__(self, base_url="https://maid-booking-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.booking_id = None
        self.customer_id = None
        self.available_date = None
        self.time_slot = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

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

    def test_get_services(self):
        """Test GET /api/services"""
        success, response = self.run_test(
            "Get All Services",
            "GET",
            "services",
            200
        )
        if success and isinstance(response, list) and len(response) >= 5:
            print(f"   ✅ Found {len(response)} services as expected")
            # Verify service types
            service_types = [service.get('type') for service in response]
            expected_types = ['standard', 'deep', 'move_in', 'move_out', 'post_construction']
            if all(stype in service_types for stype in expected_types):
                print(f"   ✅ All expected service types found")
            else:
                print(f"   ⚠️  Missing service types. Found: {service_types}")
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

    def test_create_customer(self):
        """Test POST /api/customers"""
        customer_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "555-123-4567",
            "address": "123 Test St",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001",
            "is_guest": False
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        if success and 'id' in response:
            self.customer_id = response['id']
            print(f"   ✅ Customer created with ID: {self.customer_id}")
        return success, response

    def test_create_booking(self):
        """Test POST /api/bookings"""
        if not self.available_date or not self.time_slot:
            print("❌ Missing date or time slot, skipping booking creation")
            return False, {}
            
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
            "services": [
                {
                    "service_id": "test-service-id",  # This might fail, but let's see
                    "quantity": 1,
                    "special_instructions": "Test booking"
                }
            ],
            "booking_date": self.available_date,
            "time_slot": self.time_slot,
            "special_instructions": "This is a test booking"
        }
        
        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        if success and 'id' in response:
            self.booking_id = response['id']
            print(f"   ✅ Booking created with ID: {self.booking_id}")
        return success, response

    def test_get_booking(self):
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
            "amount": 120.00
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

    def test_get_all_bookings(self):
        """Test GET /api/bookings"""
        success, response = self.run_test(
            "Get All Bookings",
            "GET",
            "bookings",
            200
        )
        return success, response

def main():
    print("🧪 Starting Maids of Cyfair Booking System API Tests")
    print("=" * 60)
    
    tester = MaidsBookingAPITester()
    
    # Test sequence
    print("\n📋 Testing Services Endpoints...")
    tester.test_get_services()
    
    print("\n📅 Testing Date/Time Endpoints...")
    tester.test_get_available_dates()
    tester.test_get_time_slots()
    
    print("\n👤 Testing Customer Endpoints...")
    tester.test_create_customer()
    
    print("\n📝 Testing Booking Endpoints...")
    tester.test_create_booking()
    tester.test_get_booking()
    tester.test_get_all_bookings()
    
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