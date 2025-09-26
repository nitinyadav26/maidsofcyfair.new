#!/usr/bin/env python3
"""
Quick Test Execution for Maids of Cyfair
This script runs a quick test of the backend API to verify basic functionality
"""

import requests
import json
import time
from datetime import datetime, timedelta

def test_backend_health():
    """Test if backend is running and responding"""
    try:
        response = requests.get("http://localhost:8000/api/services", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and responding")
            return True
        else:
            print(f"❌ Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend is not accessible: {e}")
        return False

def test_frontend_health():
    """Test if frontend is running and responding"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running and responding")
            return True
        else:
            print(f"❌ Frontend responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend is not accessible: {e}")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    print("\n🔍 Testing API Endpoints...")
    
    endpoints = [
        ("/api/services", "GET"),
        ("/api/services/standard", "GET"),
        ("/api/services/a-la-carte", "GET"),
        ("/api/available-dates", "GET"),
        ("/api/pricing/2000-2500/monthly", "GET")
    ]
    
    results = []
    
    for endpoint, method in endpoints:
        try:
            url = f"http://localhost:8000{endpoint}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"✅ {method} {endpoint} - OK")
                results.append(True)
            else:
                print(f"❌ {method} {endpoint} - Status {response.status_code}")
                results.append(False)
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {method} {endpoint} - Error: {e}")
            results.append(False)
    
    return results

def test_booking_flow():
    """Test complete booking flow"""
    print("\n📅 Testing Booking Flow...")
    
    try:
        # Test guest booking
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        booking_data = {
            "customer": {
                "email": f"test_{int(time.time())}@example.com",
                "first_name": "Test",
                "last_name": "User",
                "phone": "(555) 123-4567",
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
            "special_instructions": "Quick test booking"
        }
        
        response = requests.post("http://localhost:8000/api/bookings/guest", json=booking_data, timeout=10)
        
        if response.status_code == 200:
            booking = response.json()
            print(f"✅ Guest booking created successfully - ID: {booking.get('id', 'N/A')}")
            return True
        else:
            print(f"❌ Guest booking failed - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Booking flow test failed: {e}")
        return False

def test_authentication():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication...")
    
    try:
        # Test admin login
        login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        response = requests.post("http://localhost:8000/api/auth/login", json=login_data, timeout=5)
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get("access_token")
            print("✅ Admin login successful")
            
            # Test protected endpoint
            headers = {"Authorization": f"Bearer {token}"}
            protected_response = requests.get("http://localhost:8000/api/auth/me", headers=headers, timeout=5)
            
            if protected_response.status_code == 200:
                print("✅ Protected endpoint access successful")
                return True
            else:
                print(f"❌ Protected endpoint failed - Status: {protected_response.status_code}")
                return False
        else:
            print(f"❌ Admin login failed - Status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Authentication test failed: {e}")
        return False

def main():
    """Run all quick tests"""
    print("🚀 Quick Test Execution for Maids of Cyfair")
    print("=" * 50)
    
    # Test service health
    backend_ok = test_backend_health()
    frontend_ok = test_frontend_health()
    
    if not backend_ok:
        print("\n❌ Backend is not running. Please start the backend service first.")
        print("Run: cd backend && python server.py")
        return False
    
    if not frontend_ok:
        print("\n⚠️  Frontend is not running. Some tests may fail.")
        print("Run: cd frontend && npm start")
    
    # Test API endpoints
    endpoint_results = test_api_endpoints()
    
    # Test authentication
    auth_ok = test_authentication()
    
    # Test booking flow
    booking_ok = test_booking_flow()
    
    # Summary
    print("\n📋 Test Summary:")
    print("=" * 30)
    
    total_tests = 1 + len(endpoint_results) + 2  # health + endpoints + auth + booking
    passed_tests = sum([backend_ok, frontend_ok] + endpoint_results + [auth_ok, booking_ok])
    
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"Frontend Health: {'✅' if frontend_ok else '❌'}")
    print(f"API Endpoints: {sum(endpoint_results)}/{len(endpoint_results)} passed")
    print(f"Authentication: {'✅' if auth_ok else '❌'}")
    print(f"Booking Flow: {'✅' if booking_ok else '❌'}")
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! The application is working correctly.")
        return True
    else:
        print(f"\n⚠️  {total_tests - passed_tests} tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
