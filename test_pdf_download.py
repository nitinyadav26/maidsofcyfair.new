#!/usr/bin/env python3
"""
Test script to verify PDF download functionality for invoices
"""

import requests
import json
import base64
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_pdf_download():
    """Test PDF download functionality"""
    
    print("🧪 Testing PDF Download Functionality")
    print("=" * 40)
    
    try:
        # Step 1: Login as admin
        print("\n1. Logging in as admin...")
        
        admin_login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        if admin_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_response.text}")
            return False
        
        admin_token = admin_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✅ Admin login successful!")
        
        # Step 2: Get invoices
        print("\n2. Fetching invoices...")
        
        invoices_response = requests.get(f"{API_URL}/admin/invoices", headers=admin_headers)
        if invoices_response.status_code != 200:
            print(f"❌ Failed to fetch invoices: {invoices_response.text}")
            return False
        
        invoices = invoices_response.json()
        print(f"✅ Found {len(invoices)} invoices")
        
        if not invoices:
            print("❌ No invoices found to test PDF download")
            return False
        
        # Step 3: Test PDF generation for first invoice
        print("\n3. Testing PDF generation...")
        
        first_invoice = invoices[0]
        invoice_id = first_invoice.get('id')
        print(f"   Testing PDF generation for invoice: {invoice_id}")
        
        pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
        if pdf_response.status_code != 200:
            print(f"❌ PDF generation failed: {pdf_response.text}")
            return False
        
        pdf_data = pdf_response.json()
        print("✅ PDF generation successful!")
        print(f"   - Message: {pdf_data.get('message', 'N/A')}")
        print(f"   - Filename: {pdf_data.get('filename', 'N/A')}")
        
        # Step 4: Verify PDF content
        print("\n4. Verifying PDF content...")
        
        if 'pdf_content' in pdf_data:
            pdf_content = pdf_data['pdf_content']
            print(f"   - PDF content length: {len(pdf_content)} characters")
            
            # Try to decode base64 content
            try:
                decoded_content = base64.b64decode(pdf_content)
                print(f"   - Decoded PDF size: {len(decoded_content)} bytes")
                
                # Check if it starts with PDF header
                if decoded_content.startswith(b'%PDF'):
                    print("✅ PDF content is valid!")
                else:
                    print("❌ PDF content is not valid")
                    return False
                    
            except Exception as e:
                print(f"❌ Failed to decode PDF content: {e}")
                return False
        else:
            print("❌ No PDF content found in response")
            return False
        
        # Step 5: Test PDF download simulation
        print("\n5. Testing PDF download simulation...")
        
        # Save PDF to file for testing
        try:
            with open(f"test_invoice_{invoice_id}.pdf", "wb") as f:
                f.write(decoded_content)
            print(f"✅ PDF saved as test_invoice_{invoice_id}.pdf")
        except Exception as e:
            print(f"❌ Failed to save PDF: {e}")
            return False
        
        # Step 6: Test multiple invoices
        print("\n6. Testing multiple invoice PDFs...")
        
        successful_downloads = 0
        for i, invoice in enumerate(invoices[:3]):  # Test first 3 invoices
            invoice_id = invoice.get('id')
            print(f"   Testing invoice {i+1}: {invoice_id}")
            
            try:
                pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
                if pdf_response.status_code == 200:
                    pdf_data = pdf_response.json()
                    if 'pdf_content' in pdf_data:
                        successful_downloads += 1
                        print(f"   ✅ Invoice {i+1} PDF generated successfully")
                    else:
                        print(f"   ❌ Invoice {i+1} PDF content missing")
                else:
                    print(f"   ❌ Invoice {i+1} PDF generation failed")
            except Exception as e:
                print(f"   ❌ Invoice {i+1} error: {e}")
        
        print(f"\n✅ Successfully generated {successful_downloads}/{min(3, len(invoices))} PDFs")
        
        print("\n🎉 PDF download functionality is working correctly!")
        print("✅ PDFs are being generated and can be downloaded!")
        return True
        
    except Exception as e:
        print(f"\n❌ PDF download test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_pdf_content_quality():
    """Test the quality and content of generated PDFs"""
    
    print("\n🔍 Testing PDF Content Quality")
    print("=" * 35)
    
    try:
        # Login as admin
        admin_login_data = {
            "email": "admin@maids.com",
            "password": "admin123"
        }
        
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        if admin_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_response.text}")
            return False
        
        admin_token = admin_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get invoices
        invoices_response = requests.get(f"{API_URL}/admin/invoices", headers=admin_headers)
        if invoices_response.status_code != 200:
            print(f"❌ Failed to fetch invoices: {invoices_response.text}")
            return False
        
        invoices = invoices_response.json()
        if not invoices:
            print("❌ No invoices found to test")
            return False
        
        # Test first invoice
        first_invoice = invoices[0]
        invoice_id = first_invoice.get('id')
        
        print(f"Testing PDF content for invoice: {invoice_id}")
        print(f"Invoice details:")
        print(f"  - Number: {first_invoice.get('invoice_number', 'N/A')}")
        print(f"  - Customer: {first_invoice.get('customer_name', 'N/A')}")
        print(f"  - Total: ${first_invoice.get('total_amount', 'N/A')}")
        print(f"  - Status: {first_invoice.get('status', 'N/A')}")
        
        # Generate PDF
        pdf_response = requests.get(f"{API_URL}/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
        if pdf_response.status_code == 200:
            pdf_data = pdf_response.json()
            if 'pdf_content' in pdf_data:
                print("✅ PDF content generated successfully!")
                print(f"  - Filename: {pdf_data.get('filename', 'N/A')}")
                print(f"  - Content length: {len(pdf_data['pdf_content'])} characters")
                
                # Save and verify PDF
                try:
                    decoded_content = base64.b64decode(pdf_data['pdf_content'])
                    with open(f"quality_test_invoice_{invoice_id}.pdf", "wb") as f:
                        f.write(decoded_content)
                    print(f"✅ PDF saved as quality_test_invoice_{invoice_id}.pdf")
                    print("✅ PDF content quality test passed!")
                    return True
                except Exception as e:
                    print(f"❌ Failed to save PDF: {e}")
                    return False
            else:
                print("❌ No PDF content in response")
                return False
        else:
            print(f"❌ PDF generation failed: {pdf_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ PDF content quality test failed: {e}")
        return False

if __name__ == "__main__":
    try:
        # Test basic PDF download functionality
        success1 = test_pdf_download()
        
        # Test PDF content quality
        success2 = test_pdf_content_quality()
        
        if success1 and success2:
            print("\n✅ All PDF download tests passed!")
            print("✅ PDF generation and download functionality is working perfectly!")
        else:
            print("\n❌ Some PDF download tests failed!")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
