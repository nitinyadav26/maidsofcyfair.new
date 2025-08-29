#!/usr/bin/env python3

import requests
import json

# Test the mobile app API integration
BACKEND_URL = "https://maid-booking-system.preview.emergentagent.com/api"

def test_cleaner_login():
    """Test cleaner login functionality"""
    print("🧪 Testing Cleaner Login...")
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "email": "cleaner@maids.com",
        "password": "cleaner123"
    })
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        user = data["user"]
        print(f"✅ Login successful for {user['first_name']} {user['last_name']}")
        return token
    else:
        print(f"❌ Login failed: {response.json()}")
        return None

def test_get_cleaners(admin_token):
    """Test getting cleaner list (needed for mobile app authentication)"""
    print("🧪 Testing Cleaner List API...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BACKEND_URL}/admin/cleaners", headers=headers)
    
    if response.status_code == 200:
        cleaners = response.json()
        demo_cleaner = next((c for c in cleaners if c['email'] == 'cleaner@maids.com'), None)
        
        if demo_cleaner:
            print(f"✅ Demo cleaner found: {demo_cleaner['first_name']} {demo_cleaner['last_name']}")
            return demo_cleaner['id']
        else:
            print("❌ Demo cleaner not found in cleaner list")
            return None
    else:
        print(f"❌ Failed to get cleaners: {response.json()}")
        return None

def test_cleaner_jobs(admin_token, cleaner_id):
    """Test getting jobs for cleaner"""
    print("🧪 Testing Cleaner Jobs API...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BACKEND_URL}/admin/bookings", headers=headers)
    
    if response.status_code == 200:
        all_bookings = response.json()
        cleaner_jobs = [job for job in all_bookings if job.get('cleaner_id') == cleaner_id]
        
        print(f"✅ Found {len(cleaner_jobs)} jobs for demo cleaner")
        
        if cleaner_jobs:
            job = cleaner_jobs[0]
            print(f"   📋 Sample job: {job['id'][:8]} - {job['status']} - ${job['total_amount']}")
        
        return cleaner_jobs
    else:
        print(f"❌ Failed to get jobs: {response.json()}")
        return []

def test_job_status_update(admin_token, job_id):
    """Test updating job status"""
    print("🧪 Testing Job Status Update...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.patch(
        f"{BACKEND_URL}/admin/bookings/{job_id}", 
        headers=headers,
        json={"status": "in_progress"}
    )
    
    if response.status_code == 200:
        print("✅ Job status updated successfully")
        return True
    else:
        print(f"❌ Failed to update job status: {response.json()}")
        return False

def get_admin_token():
    """Get admin token for testing"""
    response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "email": "admin@maids.com", 
        "password": "admin@maids@1234"
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print("❌ Failed to get admin token")
        return None

def main():
    print("Maids of Cyfair - Flutter App Integration Test")
    print("="*50)
    
    # Get admin token for API calls
    admin_token = get_admin_token()
    if not admin_token:
        return
    
    # Test cleaner login
    cleaner_token = test_cleaner_login()
    if not cleaner_token:
        return
    
    # Test getting cleaner list
    cleaner_id = test_get_cleaners(admin_token)
    if not cleaner_id:
        return
    
    # Test getting jobs
    jobs = test_cleaner_jobs(admin_token, cleaner_id)
    
    # Test job status update if jobs exist
    if jobs:
        test_job_status_update(admin_token, jobs[0]['id'])
    
    print("\n🎉 All integration tests completed!")
    print("\n📱 Flutter App is ready to use with:")
    print("   Email: cleaner@maids.com")
    print("   Password: cleaner123")
    
    print("\n🚀 To run the Flutter app:")
    print("   cd /app/cleaner_app")
    print("   flutter pub get")
    print("   flutter run")

if __name__ == "__main__":
    main()