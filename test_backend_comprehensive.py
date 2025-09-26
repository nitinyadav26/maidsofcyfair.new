#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Maids of Cyfair
This script tests all backend endpoints with various scenarios
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class MaidsBackendTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test_name": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, auth_required: bool = False) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        if auth_required and self.auth_token:
            if not headers:
                headers = {}
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test user registration
        try:
            user_data = {
                "email": f"testuser_{int(time.time())}@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User",
                "phone": "(555) 123-4567"
            }
            response = self.make_request("POST", "/api/auth/register", data=user_data)
            
            if response.status_code == 200:
                auth_data = response.json()
                self.auth_token = auth_data.get("access_token")
                self.log_test("User Registration", True, "User registered successfully")
            else:
                self.log_test("User Registration", False, f"Failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
        
        # Test user login
        try:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            response = self.make_request("POST", "/api/auth/login", data=login_data)
            
            if response.status_code == 200:
                auth_data = response.json()
                self.auth_token = auth_data.get("access_token")
                self.log_test("User Login", True, "User logged in successfully")
            else:
                self.log_test("User Login", False, f"Failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
        
        # Test get current user
        try:
            response = self.make_request("GET", "/api/auth/me", auth_required=True)
            
            if response.status_code == 200:
                user_info = response.json()
                self.log_test("Get Current User", True, f"Retrieved user: {user_info.get('email')}")
            else:
                self.log_test("Get Current User", False, f"Failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
        
        # Test admin login
        try:
            admin_data = {
                "email": "admin@maids.com",
                "password": "admin123"
            }
            response = self.make_request("POST", "/api/auth/login", data=admin_data)
            
            if response.status_code == 200:
                auth_data = response.json()
                self.admin_token = auth_data.get("access_token")
                self.log_test("Admin Login", True, "Admin logged in successfully")
            else:
                self.log_test("Admin Login", False, f"Failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")

    def test_services(self):
        """Test service management endpoints"""
        print("\n🛠️ Testing Service Endpoints...")
        
        # Test get all services
        try:
            response = self.make_request("GET", "/api/services")
            if response.status_code == 200:
                services = response.json()
                self.log_test("Get All Services", True, f"Retrieved {len(services)} services")
            else:
                self.log_test("Get All Services", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get All Services", False, f"Exception: {str(e)}")
        
        # Test get standard services
        try:
            response = self.make_request("GET", "/api/services/standard")
            if response.status_code == 200:
                services = response.json()
                self.log_test("Get Standard Services", True, f"Retrieved {len(services)} standard services")
            else:
                self.log_test("Get Standard Services", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Standard Services", False, f"Exception: {str(e)}")
        
        # Test get a-la-carte services
        try:
            response = self.make_request("GET", "/api/services/a-la-carte")
            if response.status_code == 200:
                services = response.json()
                self.log_test("Get A-La-Carte Services", True, f"Retrieved {len(services)} a-la-carte services")
            else:
                self.log_test("Get A-La-Carte Services", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get A-La-Carte Services", False, f"Exception: {str(e)}")
        
        # Test pricing endpoint
        try:
            response = self.make_request("GET", "/api/pricing/2000-2500/monthly")
            if response.status_code == 200:
                pricing = response.json()
                self.log_test("Get Pricing", True, f"Pricing: ${pricing.get('base_price', 0)}")
            else:
                self.log_test("Get Pricing", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Pricing", False, f"Exception: {str(e)}")

    def test_time_slots(self):
        """Test time slot management"""
        print("\n⏰ Testing Time Slot Endpoints...")
        
        # Test get available dates
        try:
            response = self.make_request("GET", "/api/available-dates")
            if response.status_code == 200:
                dates = response.json()
                self.log_test("Get Available Dates", True, f"Retrieved {len(dates)} available dates")
            else:
                self.log_test("Get Available Dates", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Available Dates", False, f"Exception: {str(e)}")
        
        # Test get time slots for specific date
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            response = self.make_request("GET", f"/api/time-slots?date={tomorrow}")
            if response.status_code == 200:
                slots = response.json()
                self.log_test("Get Time Slots", True, f"Retrieved {len(slots)} time slots for {tomorrow}")
            else:
                self.log_test("Get Time Slots", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Time Slots", False, f"Exception: {str(e)}")

    def test_booking_system(self):
        """Test booking system"""
        print("\n📅 Testing Booking System...")
        
        # Test guest booking
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            guest_booking = {
                "customer": {
                    "email": f"guest_{int(time.time())}@example.com",
                    "first_name": "Guest",
                    "last_name": "User",
                    "phone": "(555) 987-6543",
                    "address": "123 Test St",
                    "city": "Test City",
                    "state": "TX",
                    "zip_code": "77001"
                },
                "house_size": "2000-2500",
                "frequency": "monthly",
                "services": [{"service_id": "base_service", "quantity": 1}],
                "a_la_carte_services": [],
                "booking_date": tomorrow,
                "time_slot": "10:00-12:00",
                "base_price": 180.0,
                "address": {
                    "street": "123 Test St",
                    "city": "Test City",
                    "state": "TX",
                    "zip_code": "77001"
                },
                "special_instructions": "Test booking"
            }
            
            response = self.make_request("POST", "/api/bookings/guest", data=guest_booking)
            if response.status_code == 200:
                booking = response.json()
                self.log_test("Guest Booking", True, f"Created booking {booking.get('id', 'N/A')}")
            else:
                self.log_test("Guest Booking", False, f"Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Guest Booking", False, f"Exception: {str(e)}")
        
        # Test authenticated user booking
        try:
            tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
            user_booking = {
                "house_size": "1500-2000",
                "frequency": "weekly",
                "services": [{"service_id": "base_service", "quantity": 1}],
                "a_la_carte_services": [],
                "booking_date": tomorrow,
                "time_slot": "14:00-16:00",
                "base_price": 120.0,
                "address": {
                    "street": "456 User St",
                    "city": "User City",
                    "state": "TX",
                    "zip_code": "77002"
                },
                "special_instructions": "User booking test"
            }
            
            response = self.make_request("POST", "/api/bookings", data=user_booking, auth_required=True)
            if response.status_code == 200:
                booking = response.json()
                self.log_test("User Booking", True, f"Created booking {booking.get('id', 'N/A')}")
            else:
                self.log_test("User Booking", False, f"Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Booking", False, f"Exception: {str(e)}")
        
        # Test get user bookings
        try:
            response = self.make_request("GET", "/api/bookings", auth_required=True)
            if response.status_code == 200:
                bookings = response.json()
                self.log_test("Get User Bookings", True, f"Retrieved {len(bookings)} bookings")
            else:
                self.log_test("Get User Bookings", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get User Bookings", False, f"Exception: {str(e)}")

    def test_promo_codes(self):
        """Test promo code system"""
        print("\n🎟️ Testing Promo Code System...")
        
        # Test promo code validation
        try:
            validation_data = {
                "code": "WELCOME10",
                "subtotal": 150.0
            }
            response = self.make_request("POST", "/api/validate-promo-code", data=validation_data, auth_required=True)
            if response.status_code == 200:
                result = response.json()
                self.log_test("Validate Promo Code", True, f"Validation result: {result.get('valid', False)}")
            else:
                self.log_test("Validate Promo Code", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Validate Promo Code", False, f"Exception: {str(e)}")
        
        # Test admin promo code management (if admin token available)
        if self.admin_token:
            # Temporarily use admin token
            original_token = self.auth_token
            self.auth_token = self.admin_token
            
            try:
                response = self.make_request("GET", "/api/admin/promo-codes", auth_required=True)
                if response.status_code == 200:
                    promos = response.json()
                    self.log_test("Get Admin Promo Codes", True, f"Retrieved {len(promos)} promo codes")
                else:
                    self.log_test("Get Admin Promo Codes", False, f"Failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Get Admin Promo Codes", False, f"Exception: {str(e)}")
            
            # Restore original token
            self.auth_token = original_token

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return
        
        # Temporarily use admin token
        original_token = self.auth_token
        self.auth_token = self.admin_token
        
        try:
            # Test admin stats
            response = self.make_request("GET", "/api/admin/stats", auth_required=True)
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Get Admin Stats", True, f"Stats: {stats}")
            else:
                self.log_test("Get Admin Stats", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Admin Stats", False, f"Exception: {str(e)}")
        
        try:
            # Test admin bookings
            response = self.make_request("GET", "/api/admin/bookings", auth_required=True)
            if response.status_code == 200:
                bookings = response.json()
                self.log_test("Get Admin Bookings", True, f"Retrieved {len(bookings)} bookings")
            else:
                self.log_test("Get Admin Bookings", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Admin Bookings", False, f"Exception: {str(e)}")
        
        try:
            # Test admin cleaners
            response = self.make_request("GET", "/api/admin/cleaners", auth_required=True)
            if response.status_code == 200:
                cleaners = response.json()
                self.log_test("Get Admin Cleaners", True, f"Retrieved {len(cleaners)} cleaners")
            else:
                self.log_test("Get Admin Cleaners", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Admin Cleaners", False, f"Exception: {str(e)}")
        
        # Restore original token
        self.auth_token = original_token

    def test_reports(self):
        """Test reporting endpoints"""
        print("\n📊 Testing Report Endpoints...")
        
        if not self.admin_token:
            self.log_test("Report Endpoints", False, "No admin token available")
            return
        
        # Temporarily use admin token
        original_token = self.auth_token
        self.auth_token = self.admin_token
        
        try:
            # Test weekly report
            response = self.make_request("GET", "/api/admin/reports/weekly", auth_required=True)
            if response.status_code == 200:
                report = response.json()
                self.log_test("Get Weekly Report", True, f"Weekly report: {report}")
            else:
                self.log_test("Get Weekly Report", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Weekly Report", False, f"Exception: {str(e)}")
        
        try:
            # Test monthly report
            response = self.make_request("GET", "/api/admin/reports/monthly", auth_required=True)
            if response.status_code == 200:
                report = response.json()
                self.log_test("Get Monthly Report", True, f"Monthly report: {report}")
            else:
                self.log_test("Get Monthly Report", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Monthly Report", False, f"Exception: {str(e)}")
        
        # Restore original token
        self.auth_token = original_token

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🚨 Testing Error Handling...")
        
        # Test invalid endpoint
        try:
            response = self.make_request("GET", "/api/invalid-endpoint")
            if response.status_code == 404:
                self.log_test("Invalid Endpoint", True, "Correctly returned 404")
            else:
                self.log_test("Invalid Endpoint", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Endpoint", False, f"Exception: {str(e)}")
        
        # Test unauthorized access
        try:
            response = self.make_request("GET", "/api/admin/stats")
            if response.status_code == 401:
                self.log_test("Unauthorized Access", True, "Correctly returned 401")
            else:
                self.log_test("Unauthorized Access", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Unauthorized Access", False, f"Exception: {str(e)}")
        
        # Test invalid booking data
        try:
            invalid_booking = {
                "house_size": "invalid",
                "frequency": "invalid"
            }
            response = self.make_request("POST", "/api/bookings", data=invalid_booking, auth_required=True)
            if response.status_code >= 400:
                self.log_test("Invalid Booking Data", True, "Correctly rejected invalid data")
            else:
                self.log_test("Invalid Booking Data", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Booking Data", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Backend Testing...")
        print(f"Testing against: {self.base_url}")
        
        start_time = time.time()
        
        # Run all test suites
        self.test_authentication()
        self.test_services()
        self.test_time_slots()
        self.test_booking_system()
        self.test_promo_codes()
        self.test_admin_endpoints()
        self.test_reports()
        self.test_error_handling()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📋 Test Summary:")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Save detailed results
        results_file = f"backend_test_results_{int(time.time())}.json"
        with open(results_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": failed_tests,
                    "success_rate": (passed_tests/total_tests)*100,
                    "duration": duration
                },
                "test_results": self.test_results
            }, f, indent=2)
        
        print(f"Detailed results saved to: {results_file}")
        
        return passed_tests == total_tests

def main():
    """Main function"""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = MaidsBackendTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
